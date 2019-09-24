import fs from 'fs';
import AppConfig from '../config/AppConfig.const';
import ApiServer from './ApiServer/ApiServer.class';
import TermMatcher from './TermMatcher/TermMatcher.class';
import DropboxSynchronizer from './DropboxSynchronizer/DropboxSynchronizer.class';
import TypeConverter from './TypeConverter/TypeConverter.class';

DropboxSynchronizer.startSync(
  (diff, cb = () => {}) => {
    let toConvert = 0;
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
                  toConvert -= 1;
                  if (toConvert === 0) cb();
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
                toConvert -= 1;
                if (toConvert === 0) cb();
              });
            },
          );
      });
    if (toConvert === 0) cb();
  },
);

// const ocrData = JSON.parse(fs.readFileSync(AppConfig.PATHS.OCR_RESULT_PATH));
// TermMatcher.loadTermLib(ocrData);

// const apiServer = new ApiServer();
// apiServer.start(AppConfig.API_SERVER.PORT);
