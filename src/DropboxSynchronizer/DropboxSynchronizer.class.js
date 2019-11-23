import fs from 'fs';
import path from 'path';
import { Dropbox } from 'dropbox';
import fetch from 'isomorphic-fetch';
import AppConfig from '../../config/AppConfig.const';
import listDirRec from '../util/listDirRec.func';
import PathConvert from '../util/PathConvert.const';
import PromiseUtil from '../util/PromiseUtil.const';

/**
 * An instance that keeps the local "data" folder up-to-date with a remote Dropbox repository by periodically
 * checking for file updates on the remote repo and applying the changes to the local folder. The remote Dropbox
 * folder is accessible via a Dropbox API token, defined in "config/AppConfig.const.js". Besides, due to the
 * utility of this specific project, the remote repo should have 3 folders named "pptx", "docx", "pdf" under
 * its root directory and have the 3 corresponding type of files placed under these 3 folders, respectively. The
 * file hierarchy under these 3 folders can be customized by users with their own needs.
 * @param {Dropbox} dbx an instance handling connections with the remote Dropbox repo via Dropbox development API. [>> ref <<](https://dropbox.github.io/dropbox-sdk-js/Dropbox.html)
 * @param {number} syncTimeout a timeout ID indicating the next time of synchronization check
 */
class DropboxSynchronizer {
  constructor() {
    // create the Dropbox connection instance
    this.dbx = new Dropbox({
      fetch,
      accessToken: AppConfig.DROPBOX.ACCESS_TOKEN,
    });
    this.syncTimeout = null;

    // if any of `data/pptx/`, `data/docx/`, `data/pdf/`, `data/png/` is not existed, create them
    [AppConfig.PATHS.PPTX_DIR, AppConfig.PATHS.DOCX_DIR, AppConfig.PATHS.PDF_DIR, AppConfig.PATHS.PNG_DIR]
      .forEach((dir) => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
  }

  /**
   * start periodical synchronization. The synchronization interval can be configured with "DROPBOX.SYNC_INTERVAL"
   * in "config/AppConfig.const.js"
   * @param {func} diffCallback a function argument that will be called whenever periodical sync is done. When
   * this function is called, a "diff" object will be passed
   *
   * @example
   * // diff object is in following structure
   * {
   *   added: {
   *     pptx: [ added_pptx_paths ],
   *     docx: [ added_docx_paths ],
   *     pdf:  [ added_pdf_paths ],
   *   },
   *   modified: {
   *     pptx: [ modified_pptx_paths ],
   *     docx: [ modified_docx_paths ],
   *     pdf:  [ modified_pdf_paths ],
   *   },
   *   deleted: {
   *     pptx: [ deleted_pptx_paths ],
   *     docx: [ deleted_docx_paths ],
   *     pdf:  [ deleted_pdf_paths ],
   *   },
   * }
   */
  startSync(diffCallback = () => {}) {
    const syncTask = () => {
      console.log('INFO [DropboxSynchronizer.startSync]: start sync...');
      this
        .fetchDropboxFileLib()
        .then((dropboxFileLib) => {
          const localFileLib = this.fetchLocalFileLib();
          // compare local file hierarchy with remote one and return the difference
          const diff = this.diffFileLib(localFileLib, dropboxFileLib);
          // for each file to be downloaded, create a download promise
          const downloadPromises = [];
          ['added', 'modified']
            .forEach((diffMode) => {
              ['pptx', 'docx', 'pdf'].forEach((fileType) => {
                diff[diffMode][fileType].forEach((filePath) => {
                  if (!fs.existsSync(path.dirname(filePath))) {
                    fs.mkdirSync(path.dirname(filePath), { recursive: true });
                  }
                  downloadPromises.push(this.downloadFile(filePath));
                });
              });
            });
          // delete out-dated files along with their related ones
          const actualDeletion = this.fullDeletion(diff.deleted);
          // return a promise chain that calls diffCallback when all files are downloaded
          return PromiseUtil
            .tolerateAllAndKeepResolved(downloadPromises)
            .then(() => diffCallback({ ...diff, deleted: actualDeletion }));
        })
        // after the promise returned by diffCallback is either resolved or rejected, start another sync cycle
        .finally(() => {
          this.syncTimeout = setTimeout(syncTask, AppConfig.DROPBOX.SYNC_INTERVAL);
        });
    };

    syncTask();
  }

  /**
   * Stop periodical synchronization by canceling the next-coming timeout
   */
  stopSync() {
    if (this.syncTimeout !== null) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
  }

  /**
   * Fetch file structure under the remote Dropbox folder
   * @returns {Promise<fileLib>} promise with a fileLib object
   *
   * @example
   * // fileLib object is in following structure:
   * {
   *   pptx: { [ path ]: { path, lastModified }, ... }
   *   docx: { [ path ]: { path, lastModified }, ... }
   *   pdf:  { [ path ]: { path, lastModified }, ... }
   * }
   *
   */
  fetchDropboxFileLib() {
    return this.dbx.filesListFolder({
      path: '',
      recursive: true,
    })
      .then(({ entries }) => {
        const fileLib = {
          pptx: {},
          docx: {},
          pdf: {},
        };
        entries
          // take only files but not directories
          .filter((e) => e['.tag'] === 'file')
          .forEach(({ path_display: dropboxPath, server_modified: lastModified }) => {
            // add a "data/" path prefix in order to match local file hierarchy
            if (dropboxPath.startsWith('/pptx/') && dropboxPath.endsWith('pptx')) {
              fileLib.pptx[`data${dropboxPath}`] = { path: `data${dropboxPath}`, lastModified: Date.parse(lastModified) };
            } else if (dropboxPath.startsWith('/docx/') && dropboxPath.endsWith('docx')) {
              fileLib.docx[`data${dropboxPath}`] = { path: `data${dropboxPath}`, lastModified: Date.parse(lastModified) };
            } else if (dropboxPath.startsWith('/pdf/') && dropboxPath.endsWith('pdf')) {
              fileLib.pdf[`data${dropboxPath}`] = { path: `data${dropboxPath}`, lastModified: Date.parse(lastModified) };
            }
          });
        return fileLib;
      })
      .catch((error) => {
        console.log(`ERROR [DropboxSynchronizer.fetchDropboxFileLib]: ${error}`);
      });
  }

  /**
   * Fetch local file structure under the "data" folder
   * @returns {object} a fileLib object
   *
   * @example
   * // fileLib object is in following structure
   * {
   *   pptx: { [ path ]: { path, lastModified }, ... }
   *   docx: { [ path ]: { path, lastModified }, ... }
   *   pdf:  { [ path ]: { path, lastModified }, ... }
   * }
   *
   */
  fetchLocalFileLib() {
    const filePathList = listDirRec('data');
    const fileLib = {
      pptx: {},
      docx: {},
      pdf: {},
    };
    filePathList
      .map((localPath) => ({ path: localPath, ...fs.statSync(localPath) }))
      .forEach(({ path: localPath, mtime: lastModified }) => {
        if (localPath.startsWith('data/pptx/') && localPath.endsWith('pptx')) {
          fileLib.pptx[localPath] = { path: localPath, lastModified };
        } else if (localPath.startsWith('data/docx/') && localPath.endsWith('docx')) {
          fileLib.docx[localPath] = { path: localPath, lastModified };
        } else if (localPath.startsWith('data/pdf/') && localPath.endsWith('pdf')) {
          fileLib.pdf[localPath] = { path: localPath, lastModified };
        }
      });
    return fileLib;
  }

  /**
   * Compare 2 fileLibs each representing the file structure under a directory
   * @param {object} oriFileLib the original fileLib. The baseline file structure to be compared with
   * @param {object} chgFileLib the changed fileLib.
   * @returns {object} the diff object showing the differences between the 2 directories
   */
  diffFileLib(oriFileLib, chgFileLib) {
    const diff = {
      added: {
        pptx: [],
        docx: [],
        pdf: [],
      },
      modified: {
        pptx: [],
        docx: [],
        pdf: [],
      },
      deleted: {
        pptx: [],
        docx: [],
        pdf: [],
      },
    };
    ['pptx', 'docx', 'pdf']
      .forEach((type) => {
        Object
          .entries(chgFileLib[type])
          .forEach(([chgPath, { lastModified }]) => {
            if (oriFileLib[type][chgPath] === undefined) {
              // if a path shows in changed fileLib but not in original fileLib, its an added file
              diff.added[type].push(chgPath);
            } else if (lastModified > oriFileLib[type][chgPath].lastModified) {
              // if a file shows in both fileLibs but has been modified more recently in the changed file lib, its a modified file
              diff.modified[type].push(chgPath);
            }
          });
      });
    ['pptx', 'docx', 'pdf']
      .forEach((type) => {
        Object
          .keys(oriFileLib[type])
          .forEach((oriPath) => {
            if (chgFileLib[type][oriPath] === undefined) {
              // if a path shows in original fileLib but not in changed fileLib, its a deleted file
              diff.deleted[type].push(oriPath);
            }
          });
      });
    return diff;
  }

  /**
   * Download a file from Dropbox
   * @param {string} savePath the local path save file, starting with "data/..."
   * @returns {Promise<any>}
   */
  downloadFile(savePath) {
    console.log(`INFO [DropboxSynchronizer.downloadFile]: downloading '${savePath}'`);
    return this
      .dbx
      .filesDownload({ path: savePath.substring(savePath.indexOf('/')) })
      .then(({ fileBinary }) => fs.promises.writeFile(savePath, fileBinary))
      .catch((error) => {
        console.log(`ERROR [DropboxSynchronizer.downloadFile]: ${error}`);
      });
  }

  /**
   * Perform deletion of files and their related ones based on the "deleted" part of "diff".
   * @param {object} deletion the "deleted" part of "diff"
   * @returns {object} actualDeletion, a deletion object describing the deleted files that are not generated from others
   */
  fullDeletion(deletion) {
    const actualDeletion = {
      pptx: [],
      docx: [],
      pdf: [],
    };
    // If a pptx or docx file is to be deleted, the pdf file generated from it should also be deleted
    ['pptx', 'docx'].forEach((fileType) => {
      deletion[fileType].forEach((filePath) => {
        console.log(`INFO [DropboxSynchronizer.fullDeletion]: delete '${filePath}' and its related files`);
        const pdfPath = PathConvert[fileType].toPdf(filePath);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
        actualDeletion[fileType].push(filePath);
      });
    });
    deletion.pdf.forEach((pdfPath) => {
      const pptxPath = PathConvert.pdf.toPptx(pdfPath);
      const docxPath = PathConvert.pdf.toDocx(pdfPath);
      // a pdf file with no corresponding pptx or docx file is not generated locally but uploaded by user
      if (!fs.existsSync(pptxPath) && !fs.existsSync(docxPath)) {
        console.log(`INFO [DropboxSynchronizer.fullDeletion]: delete '${pdfPath}' and its related files`);
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
        actualDeletion.pdf.push(pdfPath);
      }
    });
    return actualDeletion;
  }
}

export default new DropboxSynchronizer();
