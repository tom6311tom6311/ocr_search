import fs from 'fs';
import ApiServer from './ApiServer/ApiServer.class';
import TermMatcher from './TermMatcher/TermMatcher.class';
import AppConfig from '../config/AppConfig.const';


const ocrData = JSON.parse(fs.readFileSync(AppConfig.PATHS.OCR_RESULT_PATH));
TermMatcher.loadTermLib(ocrData);

const apiServer = new ApiServer();
apiServer.start(AppConfig.API_SERVER.PORT);
