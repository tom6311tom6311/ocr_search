const DATA_DIR = 'data';

const AppConfig = {
  PATHS: {
    DATA_DIR,
    PPTX_DIR: `${DATA_DIR}/pptx`,
    PDF_DIR: `${DATA_DIR}/pdf`,
    PNG_DIR: `${DATA_DIR}/png`,
    OCR_RESULT_PATH: `${DATA_DIR}/ocr_result.json`,
    OCR_TMP_RESULT_PATH: `${DATA_DIR}/ocr_tmp_result.json`,
    LOCAL_FILE_LIB: `${DATA_DIR}/local_file_lib.json`,
  },
  TYPE_CONVERT: {
    TIMEOUT: 150 * 1000,
  },
  TEXT_EXTRACT: {
    // CONFIDENCE_THRES: 0,
    TIMEOUT: 5 * 60 * 1000,
  },
  API_SERVER: {
    PORT: 7055,
  },
  DROPBOX: {
    ACCESS_TOKEN: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    SYNC_INTERVAL: 15 * 60 * 1000,
  },
  MONGO_DB: {
    URL: 'mongodb://localhost:27017',
    POOL_SIZE: 10,
    DB_NAME: 'term_db',
    COLLECTION_NAME: 'pages',
  },
};

export default AppConfig;
