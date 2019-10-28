import fs from 'fs';
import path from 'path';
import rmrf from 'rimraf';
import { Dropbox } from 'dropbox';
import fetch from 'isomorphic-fetch';
import AppConfig from '../../config/AppConfig.const';
import listDirRec from '../util/listDirRec.func';
import PathConvert from '../util/PathConvert.const';

class DropboxSynchronizer {
  constructor() {
    this.dbx = new Dropbox({
      fetch,
      accessToken: AppConfig.DROPBOX.ACCESS_TOKEN,
    });
    this.syncTimeout = null;

    [AppConfig.PATHS.PPTX_DIR, AppConfig.PATHS.DOCX_DIR, AppConfig.PATHS.PDF_DIR, AppConfig.PATHS.PNG_DIR]
      .forEach((dir) => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
  }

  startSync(diffCallback = () => {}) {
    const syncTask = () => {
      console.log('INFO [DropboxSynchronizer]: start sync...');
      this.fetchDropboxFileLib((dropboxFileLib) => {
        const localFileLib = this.fetchLocalFileLib();
        const diff = this.diffFileLib(localFileLib, dropboxFileLib);
        let toDownload = 0;
        ['added', 'modified']
          .forEach((diffMode) => {
            diff[diffMode].pptx.forEach((pptxPath) => {
              toDownload += 1;
              if (!fs.existsSync(path.dirname(pptxPath))) {
                fs.mkdirSync(path.dirname(pptxPath), { recursive: true });
              }
              this.downloadFile(pptxPath, () => {
                toDownload -= 1;
                if (toDownload === 0) {
                  diffCallback(
                    diff,
                    () => {
                      this.syncTimeout = setTimeout(syncTask, AppConfig.DROPBOX.SYNC_INTERVAL);
                    },
                  );
                }
              });
            });
            diff[diffMode].docx.forEach((docxPath) => {
              toDownload += 1;
              if (!fs.existsSync(path.dirname(docxPath))) {
                fs.mkdirSync(path.dirname(docxPath), { recursive: true });
              }
              this.downloadFile(docxPath, () => {
                toDownload -= 1;
                if (toDownload === 0) {
                  diffCallback(
                    diff,
                    () => {
                      this.syncTimeout = setTimeout(syncTask, AppConfig.DROPBOX.SYNC_INTERVAL);
                    },
                  );
                }
              });
            });
            diff[diffMode].pdf.forEach((pdfPath) => {
              toDownload += 1;
              if (!fs.existsSync(path.dirname(pdfPath))) {
                fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
              }
              this.downloadFile(pdfPath, () => {
                toDownload -= 1;
                if (toDownload === 0) {
                  diffCallback(
                    diff,
                    () => {
                      this.syncTimeout = setTimeout(syncTask, AppConfig.DROPBOX.SYNC_INTERVAL);
                    },
                  );
                }
              });
            });
          });
        let hasDiff = toDownload !== 0;
        diff.deleted.pptx.forEach((pptxPath) => {
          console.log(`INFO [DropboxSynchronizer]: delete '${pptxPath}' and its related files`);
          hasDiff = true;
          const pdfPath = PathConvert.pptx.toPdf(pptxPath);
          const pngDirPath = PathConvert.pptx.toPngDir(pptxPath);
          if (fs.existsSync(pptxPath)) fs.unlinkSync(pptxPath);
          if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
          if (fs.existsSync(pngDirPath)) rmrf.sync(pngDirPath);
        });
        diff.deleted.docx.forEach((docxPath) => {
          console.log(`INFO [DropboxSynchronizer]: delete '${docxPath}' and its related files`);
          hasDiff = true;
          const pdfPath = PathConvert.docx.toPdf(docxPath);
          const pngDirPath = PathConvert.docx.toPngDir(docxPath);
          if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);
          if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
          if (fs.existsSync(pngDirPath)) rmrf.sync(pngDirPath);
        });
        diff.deleted.pdf.forEach((pdfPath, idx) => {
          const pptxPath = PathConvert.pdf.toPptx(pdfPath);
          const docxPath = PathConvert.pdf.toDocx(pdfPath);
          const pngDirPath = PathConvert.pdf.toPngDir(pdfPath);
          if (!fs.existsSync(pptxPath) && !fs.existsSync(docxPath)) {
            console.log(`INFO [DropboxSynchronizer]: delete '${pdfPath}' and its related files`);
            hasDiff = true;
            if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
            if (fs.existsSync(pngDirPath)) rmrf.sync(pngDirPath);
          } else {
            diff.deleted.pdf[idx] = undefined;
          }
        });
        diff.deleted.pdf = diff.deleted.pdf.filter((f) => f !== undefined);
        if (!hasDiff) {
          this.syncTimeout = setTimeout(syncTask, AppConfig.DROPBOX.SYNC_INTERVAL);
        } else if (toDownload === 0) {
          diffCallback(
            diff,
            () => {
              this.syncTimeout = setTimeout(syncTask, AppConfig.DROPBOX.SYNC_INTERVAL);
            },
          );
        }
      });
    };

    syncTask();
  }

  stopSync() {
    if (this.syncTimeout !== null) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
  }

  fetchDropboxFileLib(callback = () => {}, failCallback = () => {}) {
    this.dbx.filesListFolder({
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
          .filter((e) => e['.tag'] === 'file')
          .forEach(({ path_display: dropboxPath, server_modified: lastModified }) => {
            if (dropboxPath.startsWith('/pptx/') && dropboxPath.endsWith('pptx')) {
              fileLib.pptx[`data${dropboxPath}`] = { path: `data${dropboxPath}`, lastModified: Date.parse(lastModified) };
            } else if (dropboxPath.startsWith('/docx/') && dropboxPath.endsWith('docx')) {
              fileLib.docx[`data${dropboxPath}`] = { path: `data${dropboxPath}`, lastModified: Date.parse(lastModified) };
            } else if (dropboxPath.startsWith('/pdf/') && dropboxPath.endsWith('pdf')) {
              fileLib.pdf[`data${dropboxPath}`] = { path: `data${dropboxPath}`, lastModified: Date.parse(lastModified) };
            }
          });
        callback(fileLib);
      })
      .catch(failCallback);
  }

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
    return (fileLib);
  }

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
              diff.added[type].push(chgPath);
            } else if (lastModified > oriFileLib[type][chgPath].lastModified) {
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
              diff.deleted[type].push(oriPath);
            }
          });
      });
    return diff;
  }

  downloadFile(savePath, callback = () => {}) {
    this
      .dbx
      .filesDownload({ path: savePath.substring(savePath.indexOf('/')) })
      .then(({ fileBinary }) => {
        fs.writeFile(
          savePath,
          fileBinary,
          (error) => {
            if (error) {
              console.log(`ERROR [DropboxSynchronizer]: ${error}`);
            }
            callback();
          },
        );
      })
      .catch((error) => {
        console.log(`ERROR [DropboxSynchronizer]: ${error}`);
      });
  }
}

export default new DropboxSynchronizer();
