import fs from 'fs';
import rmrf from 'rimraf';
import path from 'path';
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
      .then(({ pages }) => ProcessDirector.reArrangePngs({ pages }))
      .then(({ pages }) => DbInterface.updateFile({ pages }));
  }

  static handlePptxDelete(pptxPath) {
    return DbInterface
      .deleteFile({ oriFilePath: pptxPath.substring(AppConfig.PATHS.PPTX_DIR.length + 1) })
      .then((docs) => ProcessDirector.handlePngDelete(docs));
  }

  static handleDocxDelete(docxPath) {
    return DbInterface
      .deleteFile({ oriFilePath: docxPath.substring(AppConfig.PATHS.DOCX_DIR.length + 1) })
      .then((docs) => ProcessDirector.handlePngDelete(docs));
  }

  static handlePdfDelete(pdfPath) {
    return DbInterface
      .deleteFile({ oriFilePath: pdfPath.substring(AppConfig.PATHS.PDF_DIR.length + 1) })
      .then((docs) => ProcessDirector.handlePngDelete(docs));
  }

  static handlePngDelete(docs) {
    return Promise.all(
      docs.map(
        ({ docId }) => {
          const pngPath = `${AppConfig.PATHS.PNG_DIR}/${docId}.png`;
          if (fs.existsSync(pngPath)) {
            return new Promise(
              (resolve) => fs.unlink(pngPath, resolve),
            );
          }
          return true;
        },
      ),
    );
  }

  static reArrangePngs({ pages }) {
    const promises = [];
    const pngDirPath = path.dirname(pages[0].imgPath);
    const newPages = [];
    pages.forEach(({ docId, imgPath, ...page }) => {
      const newPath = `${AppConfig.PATHS.PNG_DIR}/${docId}.png`;
      promises.push(
        new Promise((resolve, reject) => {
          fs.rename(imgPath, newPath, (err) => {
            if (err) {
              console.log(`ERROR [ProcessDirector]: ${err}`);
              reject();
            } else {
              resolve();
            }
          });
        }),
      );
      newPages.push({
        docId,
        ...page,
        imgPath: `${docId}.png`,
      });
    });
    return Promise
      .all(promises)
      .then(() => new Promise(
        (resolve, reject) => {
          rmrf(pngDirPath, (err) => {
            if (err) reject(err);
            else resolve();
          });
        },
      ))
      .then(() => new Promise((resolve) => resolve({ pages: newPages })));
  }
}

export default ProcessDirector;
