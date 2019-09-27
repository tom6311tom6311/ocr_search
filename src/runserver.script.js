import AppConfig from '../config/AppConfig.const';
import ApiServer from './ApiServer/ApiServer.class';
import DropboxSynchronizer from './DropboxSynchronizer/DropboxSynchronizer.class';
import TypeConverter from './TypeConverter/TypeConverter.class';
import TextExtractor from './TextExtractor/TextExtractor.class';
import DbInterface from './DbInterface/DbInterface.class';
import TermMatcher from './TermMatcher/TermMatcher.class';


DropboxSynchronizer.startSync(
  (diff, cb = () => {}) => {
    TermMatcher.clearBuffer();
    let toConvert = 0;
    const checkTerminate = () => {
      toConvert -= 1;
      if (toConvert === 0) cb();
    };
    ['added', 'modified']
      .forEach((diffMode) => {
        diff[diffMode]
          .pptx
          .forEach(
            (pptxPath) => {
              toConvert += 2;
              TypeConverter.pptx2pdf(pptxPath, () => {
                toConvert -= 1;
                const pdfPath = pptxPath
                  .replace(AppConfig.PATHS.PPTX_DIR, AppConfig.PATHS.PDF_DIR)
                  .replace('.pptx', '.pdf');
                TypeConverter.pdf2png(pdfPath, () => {
                  TextExtractor.extractFromPdf(pdfPath, ({ pages }) => {
                    DbInterface.updatePages(pages, checkTerminate, checkTerminate);
                  }, checkTerminate);
                });
              });
            },
          );
        diff[diffMode]
          .pdf
          .forEach(
            (pdfPath) => {
              toConvert += 1;
              TypeConverter.pdf2png(pdfPath, () => {
                TextExtractor.extractFromPdf(pdfPath, ({ pages }) => {
                  DbInterface.updatePages(pages, checkTerminate, checkTerminate);
                }, checkTerminate);
              });
            },
          );
      });
    diff.deleted.pptx.forEach((pptxPath) => {
      DbInterface.deletePages(
        pptxPath.substring(AppConfig.PATHS.PPTX_DIR.length + 1),
      );
    });
    diff.deleted.pdf.forEach((pdfPath) => {
      DbInterface.deletePages(
        pdfPath.substring(AppConfig.PATHS.PDF_DIR.length + 1),
      );
    });
    if (toConvert === 0) cb();
  },
);

const apiServer = new ApiServer();
apiServer.start(AppConfig.API_SERVER.PORT);
