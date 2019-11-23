import fs from 'fs';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { PDFExtract } from 'pdf.js-extract';
import TaskQueueManager from '../util/TaskQueueManager.class';
import AppConfig from '../../config/AppConfig.const';
import PathConvert from '../util/PathConvert.const';

/**
 * An instance handling extraction of terms from file pages or user query
 * @param {TaskQueueManager} taskManager a task manager making sure that tasks are done one after another
 * @param {PDFExtract} pdfExtract a instance handling extraction of text from pdf files. [>> ref <<](https://www.npmjs.com/package/pdf.js-extract)
 */
class TermExtractor {
  constructor() {
    this.taskManager = new TaskQueueManager(AppConfig.TEXT_EXTRACT.TIMEOUT);
    this.pdfExtract = new PDFExtract();
  }

  /**
   * Term extraction from a pdf file
   * @param {string} pdfPath path of the source pdf file
   * @returns {Promise<{ pages }>}
   *
   * @example
   * // each entry of "pages" is in following structure
   * {
   *   fileId,                    // an identifier generated from the raw file path (i.e. if "test.pdf" is generated from "test.docx", they share the same fileId)
   *   docId,                     // an identifier of the document (page)
   *   oriFilePath,               // original file path
   *   pageIdx,                   // page index (starting from 1)
   *   imgPath,                   // path of the corresponding png file. This is for front-end application to retrieve image
   *   termFreqDict: {            // a mapping from terms to their occurrences (term frequency) in the page
   *     [term]: term_frequency,
   *     ...
   *   },
   * }
   *
   */
  extractFromPdf(pdfPath) {
    return new Promise((resolve, reject) => {
      this.taskManager.registerTask({
        job: (cb) => {
          console.log(`ERROR [TermExtractor.extractFromPdf]: start extraction from ${pdfPath}`);

          const pptxPath = PathConvert.pdf.toPptx(pdfPath);
          const docxPath = PathConvert.pdf.toDocx(pdfPath);
          const pngDirPath = PathConvert.pdf.toPngDir(pdfPath);
          let oriFilePath = pdfPath.substring(AppConfig.PATHS.PDF_DIR.length + 1);

          // if the corresponding pptx or docx file exists, it is the original file
          if (fs.existsSync(pptxPath)) oriFilePath = pptxPath.substring(AppConfig.PATHS.PPTX_DIR.length + 1);
          else if (fs.existsSync(docxPath)) oriFilePath = docxPath.substring(AppConfig.PATHS.DOCX_DIR.length + 1);

          // extract text from pdf
          this.pdfExtract.extract(
            pdfPath,
            {},
            (error, data) => {
              if (error) {
                console.log(`ERROR [TermExtractor.extractFromPdf]: ${error}`);
                reject();
              } else {
                const fileId = crypto.createHash('sha256').update(oriFilePath).digest('hex');
                const { pages: rawPages } = data;
                const pages = [];
                // for each of the parsed page, strip strange characters and leading/lagging spaces;
                // then convert to lower case and perform tokenization and stemming on it by calling
                // "src/py/tokenize_and_stem.py"
                rawPages.forEach(({ content }, pageIdx) => {
                  const text = content
                    .map(({ str }) => str.replace(/|•|、/g, '').replace(/^ +| +$/g, ''))
                    .filter((str) => str !== '')
                    .join(', ')
                    .toLowerCase();
                  const bufs = [];
                  const tokenizingProcess = spawn('python3', ['src/py/tokenize_and_stem.py', text]);
                  tokenizingProcess.stdout.on('data', (buf) => {
                    // push the received buffer to an array instead of parse it immediately.
                    // this is to avoid the case that output data size exceeds stdout limit
                    // and being segmented forcibly
                    bufs.push(buf);
                  });
                  tokenizingProcess.on('close', () => {
                    try {
                      // concatenate the buffers and try to parse it as a JSON string
                      const termFreqDict = JSON.parse(Buffer.concat(bufs).toString());
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
                      // if all pages are parsed successfully, resolve the promise with the parsed "pages"
                      if (pages.length === rawPages.length) {
                        resolve({ pages });
                        cb();
                      }
                    } catch (err) {
                      console.log(`ERROR [TermExtractor.extractFromPdf]: ${err}`);
                      reject();
                      cb();
                    }
                  });
                });
              }
            },
          );
        },
        failCallback: () => {
          console.log(`ERROR [TermExtractor.extractFromPdf]: timeout during extracting '${pdfPath}'`);
          reject();
        },
      });
    });
  }

  /**
   * Term extraction from a user query string
   * @param {string} query given by user
   * @returns {Array<string>} an array of extracted terms
   */
  extractFromQuery(query) {
    return new Promise((resolve, reject) => {
      this.taskManager.registerTask({
        job: (cb) => {
          // strip strange characters and leading/lagging spaces; then convert to lower case
          // and perform tokenization and stemming on it by calling "src/py/tokenize_and_stem.py"
          const text = query.replace(/|•|、/g, '').replace(/^ +| +$/g, '').toLowerCase();
          const tokenizingProcess = spawn('python3', ['src/py/tokenize_and_stem.py', text]);
          tokenizingProcess.stdout.on('data', (buf) => {
            // try to parse the returned buffer as a JSON string
            const termFreqDict = JSON.parse(buf.toString());
            resolve(Object.keys(termFreqDict));
            cb();
          });
          tokenizingProcess.stdout.on('error', (error) => {
            console.log(`ERROR [TermExtractor.extractFromQuery]: ${error}`);
            reject();
            cb();
          });
        },
        failCallback: () => {
          console.log(`ERROR [TermExtractor.extractFromQuery]: timeout during extracting query '${query}'`);
          reject();
        },
      });
    });
  }

  // TODO: the OCR way of text extraction
  // extractFromPng(pngDirPath) {}
}

export default new TermExtractor();
