import AppConfig from '../config/AppConfig.const';
import ApiServer from './ApiServer/ApiServer.class';
import DropboxSynchronizer from './DropboxSynchronizer/DropboxSynchronizer.class';
import TypeConverter from './TypeConverter/TypeConverter.class';
import TermExtractor from './TermExtractor/TermExtractor.class';
import DbInterface from './DbInterface/DbInterface.class';
import TermMatcher from './TermMatcher/TermMatcher.class';
import PathConvert from './util/PathConvert.const';


DropboxSynchronizer.startSync(
  (diff, cb = () => {}) => {
    TermMatcher.clearBuffer();
    let promises = [];
    ['added', 'modified']
      .forEach((diffMode) => {
        promises = promises.concat(
          diff[diffMode]
            .pptx
            .map((pptxPath) => TypeConverter
              .pptx2pdf(pptxPath)
              .then(() => TypeConverter.pdf2png(PathConvert.pptx.toPdf(pptxPath)))
              .then(() => TermExtractor.extractFromPdf(PathConvert.pptx.toPdf(pptxPath)))
              .then(({ pages }) => DbInterface.updateFile({ pages }))),
          diff[diffMode]
            .docx
            .map((docxPath) => TypeConverter
              .docx2pdf(docxPath)
              .then(() => TypeConverter.pdf2png(PathConvert.docx.toPdf(docxPath)))
              .then(() => TermExtractor.extractFromPdf(PathConvert.docx.toPdf(docxPath)))
              .then(({ pages }) => DbInterface.updateFile({ pages }))),
          diff[diffMode]
            .pdf
            .map((pdfPath) => TypeConverter
              .pdf2png(pdfPath)
              .then(() => TermExtractor.extractFromPdf(pdfPath))
              .then(({ pages }) => DbInterface.updateFile({ pages }))),
        );
      });
    promises = promises.concat(
      diff
        .deleted
        .pptx
        .map((pptxPath) => DbInterface
          .deleteFile(
            { oriFilePath: pptxPath.substring(AppConfig.PATHS.PPTX_DIR.length + 1) },
          )),
      diff
        .deleted
        .docx
        .map((docxPath) => DbInterface
          .deleteFile(
            { oriFilePath: docxPath.substring(AppConfig.PATHS.DOCX_DIR.length + 1) },
          )),
      diff
        .deleted
        .pdf
        .map((pdfPath) => DbInterface
          .deleteFile(
            { oriFilePath: pdfPath.substring(AppConfig.PATHS.PDF_DIR.length + 1) },
          )),
    );
    Promise
      .all(promises)
      .then(cb)
      .catch(cb);
  },
);

const apiServer = new ApiServer();
apiServer.start(AppConfig.API_SERVER.PORT);
