import AppConfig from '../config/AppConfig.const';
import ApiServer from './ApiServer/ApiServer.class';
import DropboxSynchronizer from './DropboxSynchronizer/DropboxSynchronizer.class';
import TermMatcher from './TermMatcher/TermMatcher.class';
import ProcessDirector from './ProcessDirector/ProcessDirector.class';


DropboxSynchronizer.startSync(
  (diff, cb = () => {}) => {
    TermMatcher.clearBuffer();
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
    Promise
      .all(promises)
      .finally(cb);
  },
);

const apiServer = new ApiServer();
apiServer.start(AppConfig.API_SERVER.PORT);
