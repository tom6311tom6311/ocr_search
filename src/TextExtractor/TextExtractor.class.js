import fs from 'fs';
import path from 'path';
import { PDFExtract } from 'pdf.js-extract';
import TaskQueueManager from '../util/TaskQueueManager.class';
import AppConfig from '../../config/AppConfig.const';
import PathConvert from '../util/PathConvert.const';

class TextExtractor {
  constructor() {
    this.taskManager = new TaskQueueManager(AppConfig.TEXT_EXTRACT.TIMEOUT);
    this.pdfExtract = new PDFExtract();
  }

  extractFromPdf(pdfPath, callback = () => {}, failCallback = () => {}) {
    this.taskManager.registerTask({
      job: (cb) => {
        const pptxPath = PathConvert.pdf.toPptx(pdfPath);
        const pngDirPath = PathConvert.pdf.toPngDir(pdfPath);
        const oriFilePath = fs.existsSync(pptxPath) ? pptxPath.substring(AppConfig.PATHS.PPTX_DIR.length + 1) : pdfPath.substring(AppConfig.PATHS.PDF_DIR.length + 1);
        this.pdfExtract.extract(
          pdfPath,
          {},
          (error, data) => {
            if (error) {
              console.log(`ERROR [TextExtractor]: ${error}`);
              failCallback();
            } else {
              const { pages: rawPages } = data;
              const pages = [];
              rawPages.forEach(({ content }) => {
                const pageIdx = pages.length + 1;
                const textList = content
                  .map(({ str }) => str.replace(/|•|、/g, '').replace(/^ +| +$/g, ''))
                  .filter((str) => str !== '');
                pages.push({
                  id: `${oriFilePath}_${pageIdx}`,
                  oriFilePath,
                  pageIdx,
                  imgPath: `${pngDirPath.substring(AppConfig.PATHS.PNG_DIR.length + 1)}/${path.basename(pngDirPath)}_${pageIdx}.png`,
                  textList,
                  term: textList.join(', ').toLowerCase(),
                });
              });
              callback({ pages });
              cb();
            }
          },
        );
      },
      failCallback: () => {
        console.log(`ERROR [TextExtractor]: timeout during extracting '${pdfPath}'`);
        failCallback();
      },
    });
  }

  // extractFromPng(pngDirPath, callback = () => {}, failCallback = () => {}) {}
}

export default new TextExtractor();
