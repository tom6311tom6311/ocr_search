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
  OCR: {
    // CONFIDENCE_THRES: 0,
  },
  API_SERVER: {
    PORT: 7055,
  },
  DROPBOX: {
    ACCESS_TOKEN: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    SYNC_INTERVAL: 5 * 60 * 1000,
  },
};

export default AppConfig;
