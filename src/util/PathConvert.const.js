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
  pdf: {
    toPptx: (pdfPath) => (
      pdfPath
        .replace(AppConfig.PATHS.PDF_DIR, AppConfig.PATHS.PPTX_DIR)
        .replace('.pdf', '.pptx')
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
    toPdf: (pngDirPath) => (
      `${
        pngDirPath
          .replace(AppConfig.PATHS.PNG_DIR, AppConfig.PATHS.PDF_DIR)
      }.pdf`
    ),
  },
};

export default PathConvert;
