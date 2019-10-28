const DATA_DIR = 'data';

const AppConfig = {
  PATHS: {
    DATA_DIR,
    PPTX_DIR: `${DATA_DIR}/pptx`,
    DOCX_DIR: `${DATA_DIR}/docx`,
    PDF_DIR: `${DATA_DIR}/pdf`,
    PNG_DIR: `${DATA_DIR}/png`,
  },
  TYPE_CONVERT: {
    TIMEOUT: 150 * 1000,
  },
  TEXT_EXTRACT: {
    TIMEOUT: 5 * 60 * 1000,
  },
  API_SERVER: {
    PORT: 7055,
    NUM_SEARCH_RETURN: 20,
  },
  DROPBOX: {
    ACCESS_TOKEN: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    SYNC_INTERVAL: 15 * 60 * 1000,
  },
  MONGO_DB: {
    URL: 'mongodb://localhost:27017',
    POOL_SIZE: 10,
    DB_NAME: 'term_db',
    COLLECTION_NAME: {
      DOCS: 'docs',
      TERM_FREQS: 'term_freqs',
      TERM_CORRELATIONS: 'term_correlations',
    },
  },
};

export default AppConfig;
