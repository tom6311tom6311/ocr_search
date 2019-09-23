import fs from 'fs';
import AppConfig from '../config/AppConfig.const';
import ApiServer from './ApiServer/ApiServer.class';
import TermMatcher from './TermMatcher/TermMatcher.class';
import DropboxSynchronizer from './DropboxSynchronizer/DropboxSynchronizer.class';

DropboxSynchronizer.startSync((diff) => {
  console.log(diff);
});

const ocrData = JSON.parse(fs.readFileSync(AppConfig.PATHS.OCR_RESULT_PATH));
TermMatcher.loadTermLib(ocrData);

const apiServer = new ApiServer();
apiServer.start(AppConfig.API_SERVER.PORT);
