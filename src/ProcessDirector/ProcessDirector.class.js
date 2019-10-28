import TypeConverter from '../TypeConverter/TypeConverter.class';
import TermExtractor from '../TermExtractor/TermExtractor.class';
import DbInterface from '../DbInterface/DbInterface.class';
import PathConvert from '../util/PathConvert.const';
import AppConfig from '../../config/AppConfig.const';

class ProcessDirector {
  static handlePptxUpdate(pptxPath) {
    return TypeConverter
      .pptx2pdf(pptxPath)
      .then(() => ProcessDirector.handlePdfUpdate(PathConvert.pptx.toPdf(pptxPath)));
  }

  static handleDocxUpdate(docxPath) {
    return TypeConverter
      .docx2pdf(docxPath)
      .then(() => ProcessDirector.handlePdfUpdate(PathConvert.docx.toPdf(docxPath)));
  }

  static handlePdfUpdate(pdfPath) {
    return TypeConverter
      .pdf2png(pdfPath)
      .then(() => TermExtractor.extractFromPdf(pdfPath))
      .then(({ pages }) => DbInterface.updateFile({ pages }));
  }

  static handlePptxDelete(pptxPath) {
    return DbInterface
      .deleteFile(
        { oriFilePath: pptxPath.substring(AppConfig.PATHS.PPTX_DIR.length + 1) },
      );
  }

  static handleDocxDelete(docxPath) {
    return DbInterface
      .deleteFile(
        { oriFilePath: docxPath.substring(AppConfig.PATHS.DOCX_DIR.length + 1) },
      );
  }

  static handlePdfDelete(pdfPath) {
    return DbInterface
      .deleteFile(
        { oriFilePath: pdfPath.substring(AppConfig.PATHS.PDF_DIR.length + 1) },
      );
  }
}

export default ProcessDirector;
