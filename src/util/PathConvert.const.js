import AppConfig from '../../config/AppConfig.const';

const PathConvert = {
  pptx: {
    toPdf: (pptxPath) => (
      pptxPath
        .replace(AppConfig.PATHS.PPTX_DIR, AppConfig.PATHS.PDF_DIR)
        .replace('.pptx', '.pdf')
    ),
    toPngDir: (pptxPath) => (
      pptxPath
        .replace(AppConfig.PATHS.PPTX_DIR, AppConfig.PATHS.PNG_DIR)
        .replace('.pptx', '')
    ),
  },
  docx: {
    toPdf: (docxPath) => (
      docxPath
        .replace(AppConfig.PATHS.DOCX_DIR, AppConfig.PATHS.PDF_DIR)
        .replace('.docx', '.pdf')
    ),
    toPngDir: (docxPath) => (
      docxPath
        .replace(AppConfig.PATHS.DOCX_DIR, AppConfig.PATHS.PNG_DIR)
        .replace('.docx', '')
    ),
  },
  pdf: {
    toPptx: (pdfPath) => (
      pdfPath
        .replace(AppConfig.PATHS.PDF_DIR, AppConfig.PATHS.PPTX_DIR)
        .replace('.pdf', '.pptx')
    ),
    toDocx: (pdfPath) => (
      pdfPath
        .replace(AppConfig.PATHS.PDF_DIR, AppConfig.PATHS.DOCX_DIR)
        .replace('.pdf', '.docx')
    ),
    toPngDir: (pdfPath) => (
      pdfPath
        .replace(AppConfig.PATHS.PDF_DIR, AppConfig.PATHS.PNG_DIR)
        .replace('.pdf', '')
    ),
  },
  pngDir: {
    toPptx: (pngDirPath) => (
      `${
        pngDirPath
          .replace(AppConfig.PATHS.PNG_DIR, AppConfig.PATHS.PPTX_DIR)
      }.pptx`
    ),
    toDocx: (pngDirPath) => (
      `${
        pngDirPath
          .replace(AppConfig.PATHS.PNG_DIR, AppConfig.PATHS.DOCX_DIR)
      }.docx`
    ),
    toPdf: (pngDirPath) => (
      `${
        pngDirPath
          .replace(AppConfig.PATHS.PNG_DIR, AppConfig.PATHS.PDF_DIR)
      }.pdf`
    ),
  },
};

export default PathConvert;
