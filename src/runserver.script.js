import AppConfig from '../config/AppConfig.const';
import ApiServer from './ApiServer/ApiServer.class';
import DropboxSynchronizer from './DropboxSynchronizer/DropboxSynchronizer.class';
import ProcessDirector from './ProcessDirector/ProcessDirector.class';

// start synchronization with the target Dropbox repository
// when encountering an added, modified or deleted file, trigger handling processes correspondingly
// when all handling processes finished, the resolved "Promise.all" will trigger the next cycle of synchronization
DropboxSynchronizer.startSync(
  (diff) => {
    let promises = [];
    ['added', 'modified']
      .forEach((diffMode) => {
        promises = promises.concat(
          diff[diffMode].pptx.map(ProcessDirector.handlePptxUpdate),
          diff[diffMode].docx.map(ProcessDirector.handleDocxUpdate),
          diff[diffMode].pdf.map(ProcessDirector.handlePdfUpdate),
        );
      });
    promises = promises.concat(
      diff.deleted.pptx.map(ProcessDirector.handlePptxDelete),
      diff.deleted.docx.map(ProcessDirector.handleDocxDelete),
      diff.deleted.pdf.map(ProcessDirector.handlePdfDelete),
    );
    return Promise.all(promises);
  },
);

// start api server to serve for http requests
const apiServer = new ApiServer();
apiServer.start(AppConfig.API_SERVER.PORT);
