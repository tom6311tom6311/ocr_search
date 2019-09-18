const DATA_DIR = 'data';

const AppConfig = {
  PATHS: {
    DATA_DIR,
    PPT_DIR: `${DATA_DIR}/ppt`,
    PDF_DIR: `${DATA_DIR}/pdf`,
    PNG_DIR: `${DATA_DIR}/png`,
    OCR_RESULT_PATH: `${DATA_DIR}/ocr_result.json`,
    OCR_TMP_RESULT_PATH: `${DATA_DIR}/ocr_tmp_result.json`,
  },
  OCR: {
    // CONFIDENCE_THRES: 0,
  },
  API_SERVER: {
    PORT: 7055,
  },
  DROPBOX: {
    ACCESS_TOKEN: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  },
};

export default AppConfig;
