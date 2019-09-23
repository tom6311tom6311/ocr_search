import fs from 'fs';
import { Dropbox } from 'dropbox';
import fetch from 'isomorphic-fetch';
import AppConfig from '../../config/AppConfig.const';
import listDirRec from '../util/listDirRec.func';

class DropboxSynchronizer {
  constructor() {
    this.dbx = new Dropbox({
      fetch,
      accessToken: AppConfig.DROPBOX.ACCESS_TOKEN,
    });
    this.syncInterval = null;
  }

  startSync(callback = () => {}) {
    const syncCallback = () => {
      this.fetchDropboxFileLib((dropboxFileLib) => {
        const localFileLib = this.fetchLocalFileLib();
        callback(this.diffFileLib(localFileLib, dropboxFileLib));
      });
    };
    syncCallback();
    this.syncInterval = setInterval(syncCallback, AppConfig.DROPBOX.SYNC_INTERVAL);
  }

  stopSync() {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
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
          pdf: {},
        };
        entries
          .filter((e) => e['.tag'] === 'file')
          .forEach(({ path_display: path, server_modified: lastModified }) => {
            if (path.startsWith('/pptx/') && path.toLowerCase().endsWith('pptx')) {
              fileLib.pptx[`data${path}`] = { path: `data${path}`, lastModified: Date.parse(lastModified) };
            } else if (path.startsWith('/pdf/') && path.toLowerCase().endsWith('pdf')) {
              fileLib.pdf[`data${path}`] = { path: `data${path}`, lastModified: Date.parse(lastModified) };
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
      pdf: {},
    };
    filePathList
      .map((path) => ({ path, ...fs.statSync(path) }))
      .forEach(({ path, mtime: lastModified }) => {
        if (path.startsWith('data/pptx/') && path.toLowerCase().endsWith('pptx')) {
          fileLib.pptx[path] = { path, lastModified };
        } else if (path.startsWith('data/pdf/') && path.toLowerCase().endsWith('pdf')) {
          fileLib.pdf[path] = { path, lastModified };
        }
      });
    return (fileLib);
  }

  diffFileLib(oriFileLib, chgFileLib) {
    const diff = {
      added: {
        pptx: [],
        pdf: [],
      },
      modified: {
        pptx: [],
        pdf: [],
      },
      deleted: {
        pptx: [],
        pdf: [],
      },
    };
    ['pptx', 'pdf']
      .forEach((type) => {
        Object
          .entries(chgFileLib[type])
          .forEach(([path, { lastModified }]) => {
            if (oriFileLib[type][path] === undefined) {
              diff.added[type].push(path);
            } else if (lastModified > oriFileLib[type][path].lastModified) {
              diff.modified[type].push(path);
            }
          });
      });
    ['pptx', 'pdf']
      .forEach((type) => {
        Object
          .keys(oriFileLib[type])
          .forEach((path) => {
            if (chgFileLib[type][path] === undefined) {
              diff.deleted[type].push(path);
            }
          });
      });
    return diff;
  }
}

export default new DropboxSynchronizer();
