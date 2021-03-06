import fs from 'fs';
import rmrf from 'rimraf';
import path from 'path';
import TypeConverter from '../TypeConverter/TypeConverter.class';
import DbInterface from '../DbInterface/DbInterface.class';
import PathConvert from '../util/PathConvert.const';
import AppConfig from '../../config/AppConfig.const';
import PromiseUtil from '../util/PromiseUtil.const';
import PdfUtil from '../PdfUtil/PdfUtil.class';

/**
 * A class of static methods defining how specific type of file changes should be handled
 */
class ProcessDirector {
  /**
   * Handle creation or modification of a pptx file
   * @param {String} pptxPath local path of the updated pptx file
   * @returns {Promise<any>}
   */
  static handlePptxUpdate(pptxPath) {
    // convert to pdf first; then handle creation of the pdf file
    return TypeConverter
      .pptx2pdf(pptxPath)
      .then(() => ProcessDirector.handlePdfUpdate(PathConvert.pptx.toPdf(pptxPath)));
  }

  /**
   * Handle creation or modification of a docx file
   * @param {String} docxPath local path of the updated docx file
   * @returns {Promise<any>}
   */
  static handleDocxUpdate(docxPath) {
    // convert to pdf first; then handle creation of the pdf file
    return TypeConverter
      .docx2pdf(docxPath)
      .then(() => ProcessDirector.handlePdfUpdate(PathConvert.docx.toPdf(docxPath)));
  }

  /**
   * Handle creation or modification of a pdf file
   * @param {String} pdfPath local path of the updated pdf file
   * @returns {Promise<any>}
   */
  static handlePdfUpdate(pdfPath) {
    // convert to png first; then extract terms from pdf and re-arrange png files by docId; finally update pages to DB
    return TypeConverter
      .pdf2png(pdfPath)
      .then(() => PdfUtil.extractTerms(pdfPath))
      .then(({ pages }) => ProcessDirector.reArrangePngs({ pages }))
      .then(({ pages }) => DbInterface.updateFile({ pages }));
  }

  /**
   * Handle deletion of a pptx file
   * @param {String} pptxPath local path of the deleted pptx file
   * @returns {Promise<any>}
   */
  static handlePptxDelete(pptxPath) {
    // update DB first and then delete related png files
    return DbInterface
      .deleteFile({ oriFilePath: pptxPath.substring(AppConfig.PATHS.PPTX_DIR.length + 1) })
      .then((docs) => ProcessDirector.handlePngDelete(docs));
  }

  /**
   * Handle deletion of a docx file
   * @param {String} docxPath local path of the deleted docx file
   * @returns {Promise<any>}
   */
  static handleDocxDelete(docxPath) {
    // update DB first and then delete related png files
    return DbInterface
      .deleteFile({ oriFilePath: docxPath.substring(AppConfig.PATHS.DOCX_DIR.length + 1) })
      .then((docs) => ProcessDirector.handlePngDelete(docs));
  }

  /**
   * Handle deletion of a pdf file
   * @param {String} pdfPath local path of the deleted pdf file
   * @returns {Promise<any>}
   */
  static handlePdfDelete(pdfPath) {
    // update DB first and then delete related png files
    return DbInterface
      .deleteFile({ oriFilePath: pdfPath.substring(AppConfig.PATHS.PDF_DIR.length + 1) })
      .then((docs) => ProcessDirector.handlePngDelete(docs));
  }

  /**
   * Handle deletion of png files related to a specific bunch of documents
   * , which usually represents pages of a deleted file
   * @param {String} docs DB records representing pages of the deleted file
   * @returns {Promise<any>}
   */
  static handlePngDelete(docs) {
    // for each DB doc(page) record, compose png path from it and then delete the png file
    return PromiseUtil.tolerateAllAndKeepResolved(
      docs.map(
        ({ docId }) => {
          const pngPath = `${AppConfig.PATHS.PNG_DIR}/${docId}.png`;
          if (fs.existsSync(pngPath)) {
            return new Promise(
              (resolve) => fs.unlink(pngPath, resolve),
            );
          }
          // if the png file does not exist, return a promise that will be resolved immediately
          return Promise.resolve(true);
        },
      ),
    );
  }

  /**
   * Move png files to "data/png/<docId>.png". This is to prevent leakage of folder structure to front-end
   * @param {object} param
   * @param {Array<Doc>} pages
   * @returns {Promise<Array<Doc>>} pages with new png paths
   */
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
              console.log('ERROR [ProcessDirector.reArrangePngs]: ', err);
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
    return PromiseUtil
      .tolerateAllAndKeepResolved(promises)
      .then(() => new Promise(
        (resolve) => {
          rmrf(pngDirPath, (err) => {
            if (err) {
              console.log('ERROR [ProcessDirector.reArrangePngs]: ', err);
            }
            resolve();
          });
        },
      ))
      .then(() => Promise.resolve({ pages: newPages }));
  }
}

export default ProcessDirector;
