import fs from 'fs';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { PDFExtract } from 'pdf.js-extract';
import TaskQueueManager from '../util/TaskQueueManager.class';
import AppConfig from '../../config/AppConfig.const';
import PathConvert from '../util/PathConvert.const';

class TermExtractor {
  constructor() {
    this.taskManager = new TaskQueueManager(AppConfig.TEXT_EXTRACT.TIMEOUT);
    this.pdfExtract = new PDFExtract();
  }

  extractFromPdf(pdfPath) {
    return new Promise((resolve, reject) => {
      this.taskManager.registerTask({
        job: (cb) => {
          const pptxPath = PathConvert.pdf.toPptx(pdfPath);
          const docxPath = PathConvert.pdf.toDocx(pdfPath);
          const pngDirPath = PathConvert.pdf.toPngDir(pdfPath);
          let oriFilePath = pdfPath.substring(AppConfig.PATHS.PDF_DIR.length + 1);

          if (fs.existsSync(pptxPath)) oriFilePath = pptxPath.substring(AppConfig.PATHS.PPTX_DIR.length + 1);
          else if (fs.existsSync(docxPath)) docxPath.substring(AppConfig.PATHS.DOCX_DIR.length + 1);

          this.pdfExtract.extract(
            pdfPath,
            {},
            (error, data) => {
              if (error) {
                console.log(`ERROR [TermExtractor]: ${error}`);
                reject();
              } else {
                const fileId = crypto.createHash('sha256').update(oriFilePath).digest('hex');
                const { pages: rawPages } = data;
                const pages = [];
                rawPages.forEach(({ content }, pageIdx) => {
                  const text = content
                    .map(({ str }) => str.replace(/|•|、/g, '').replace(/^ +| +$/g, ''))
                    .filter((str) => str !== '')
                    .join(', ')
                    .toLowerCase();
                  const tokenizingProcess = spawn('python3', ['src/py/tokenize_and_stem.py', text]);
                  tokenizingProcess.stdout.on('data', (buf) => {
                    const termFreqDict = JSON.parse(buf.toString());
                    pages.push({
                      fileId,
                      docId: crypto
                        .createHash('sha256')
                        .update(`${oriFilePath}-${(pageIdx + 1).toString().padStart(rawPages.length.toString().length, '0')}`)
                        .digest('hex'),
                      oriFilePath,
                      pageIdx: pageIdx + 1,
                      imgPath: `${pngDirPath}/p-${(pageIdx + 1).toString().padStart(rawPages.length.toString().length, '0')}.png`,
                      termFreqDict,
                    });
                    if (pages.length === rawPages.length) {
                      resolve({ pages });
                      cb();
                    }
                  });
                });
              }
            },
          );
        },
        failCallback: () => {
          console.log(`ERROR [TermExtractor]: timeout during extracting '${pdfPath}'`);
          reject();
        },
      });
    });
  }

  extractFromQuery(query) {
    return new Promise((resolve, reject) => {
      this.taskManager.registerTask({
        job: (cb) => {
          const text = query.replace(/|•|、/g, '').replace(/^ +| +$/g, '').toLowerCase();
          const tokenizingProcess = spawn('python3', ['src/py/tokenize_and_stem.py', text]);
          tokenizingProcess.stdout.on('data', (buf) => {
            const termFreqDict = JSON.parse(buf.toString());
            resolve(Object.keys(termFreqDict));
            cb();
          });
          tokenizingProcess.stdout.on('error', (error) => {
            console.log(`ERROR [TermExtractor]: ${error}`);
            reject();
            cb();
          });
        },
        failCallback: () => {
          console.log(`ERROR [TermExtractor]: timeout during extracting query '${query}'`);
          reject();
        },
      });
    });
  }

  // extractFromPng(pngDirPath, callback = () => {}, failCallback = () => {}) {}
}

export default new TermExtractor();
