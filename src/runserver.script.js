import fs from 'fs';
import ApiServer from './ApiServer/ApiServer.class';
import TermMatcher from './TermMatcher/TermMatcher.class';

const DATA_DIR = 'data';
const OCR_RESULT_PATH = `${DATA_DIR}/ocr_result.json`;
const API_PORT = 7055;

const ocrData = JSON.parse(fs.readFileSync(OCR_RESULT_PATH));
TermMatcher.loadTermLib(ocrData);

const apiServer = new ApiServer();
apiServer.start(API_PORT);
