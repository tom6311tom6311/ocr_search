import AppConfig from '../../config/AppConfig.const';

/**
 * A bunch of file path conversion methods. In this project, the raw files uploaded by user
 * will be located in "data/pptx", "data/docx", "data/pdf", according to their types. However,
 * in order to extract text and generate page images for front-end displaying purpose, we
 * follow a general flow of file type conversion: `pptx/docx --> pdf --> png`. The `PathCovert`
 * module helps us to locate different format of the same raw file given a file path.
 */
const PathConvert = {
  /**
   * Path convesion with input file type being pptx
   */
  pptx: {
    /**
     * Convert pptx path to pdf path
     * @param {string} pptxPath the input pptx file path
     * @returns {string} the output pdf file path
     */
    toPdf: (pptxPath) => (
      pptxPath
        .replace(AppConfig.PATHS.PPTX_DIR, AppConfig.PATHS.PDF_DIR)
        .replace('.pptx', '.pdf')
    ),
    /**
     * Convert pptx path to png directory path
     * @param {string} pptxPath the input pptx file path
     * @returns {string} the output png directory path
     */
    toPngDir: (pptxPath) => (
      pptxPath
        .replace(AppConfig.PATHS.PPTX_DIR, AppConfig.PATHS.PNG_DIR)
        .replace('.pptx', '')
    ),
  },
  /**
   * Path convesion with input file type being docx
   */
  docx: {
    /**
     * Convert docx path to pdf path
     * @param {string} docxPath the input docx file path
     * @returns {string} the output pdf file path
     */
    toPdf: (docxPath) => (
      docxPath
        .replace(AppConfig.PATHS.DOCX_DIR, AppConfig.PATHS.PDF_DIR)
        .replace('.docx', '.pdf')
    ),
    /**
     * Convert docx path to png directory path
     * @param {string} docxPath the input docx file path
     * @returns {string} the output png directory path
     */
    toPngDir: (docxPath) => (
      docxPath
        .replace(AppConfig.PATHS.DOCX_DIR, AppConfig.PATHS.PNG_DIR)
        .replace('.docx', '')
    ),
  },
  /**
   * Path convesion with input file type being pdf
   */
  pdf: {
    /**
     * Convert pdf path to pptx path
     * @param {string} pdfPath the input pdf file path
     * @returns {string} the output pptx file path
     */
    toPptx: (pdfPath) => (
      pdfPath
        .replace(AppConfig.PATHS.PDF_DIR, AppConfig.PATHS.PPTX_DIR)
        .replace('.pdf', '.pptx')
    ),
    /**
     * Convert pdf path to docx path
     * @param {string} pdfPath the input pdf file path
     * @returns {string} the output docx file path
     */
    toDocx: (pdfPath) => (
      pdfPath
        .replace(AppConfig.PATHS.PDF_DIR, AppConfig.PATHS.DOCX_DIR)
        .replace('.pdf', '.docx')
    ),
    /**
     * Convert pdf path to png directory path
     * @param {string} pdfPath the input pdf file path
     * @returns {string} the output png directory path
     */
    toPngDir: (pdfPath) => (
      pdfPath
        .replace(AppConfig.PATHS.PDF_DIR, AppConfig.PATHS.PNG_DIR)
        .replace('.pdf', '')
    ),
  },
  /**
   * Path convesion with input file type being png
   */
  pngDir: {
    /**
     * Convert png directory path to pptx path
     * @param {string} pngDirPath the input png directory path
     * @returns {string} the output pptx path
     */
    toPptx: (pngDirPath) => (
      `${
        pngDirPath
          .replace(AppConfig.PATHS.PNG_DIR, AppConfig.PATHS.PPTX_DIR)
      }.pptx`
    ),
    /**
     * Convert png directory path to docx path
     * @param {string} pngDirPath the input png directory path
     * @returns {string} the output docx path
     */
    toDocx: (pngDirPath) => (
      `${
        pngDirPath
          .replace(AppConfig.PATHS.PNG_DIR, AppConfig.PATHS.DOCX_DIR)
      }.docx`
    ),
    /**
     * Convert png directory path to pdf path
     * @param {string} pngDirPath the input png directory path
     * @returns {string} the output pdf path
     */
    toPdf: (pngDirPath) => (
      `${
        pngDirPath
          .replace(AppConfig.PATHS.PNG_DIR, AppConfig.PATHS.PDF_DIR)
      }.pdf`
    ),
  },
};

export default PathConvert;
