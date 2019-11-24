import fs from 'fs';
import crypto from 'crypto';
import { spawn } from 'child_process';
import ProgressBar from 'progress';
import TaskQueueManager from '../util/TaskQueueManager.class';
import AppConfig from '../../config/AppConfig.const';
import PathConvert from '../util/PathConvert.const';
import Tokenizer from '../Tokenizer/Tokenizer.class';
import PromiseUtil from '../util/PromiseUtil.const';

/**
 * An instance handling serveral kind of operations on PDF files
 * This is based on the Poppler Utilites command line tool
 * @param {TaskQueueManager} extractionTaskManager a task manager making sure that text extraction tasks are done one after another
 */
class PdfUtil {
  constructor() {
    this.extractionTaskManager = new TaskQueueManager(AppConfig.TEXT_EXTRACT.TIMEOUT);
  }

  /**
   * Term extraction from a pdf file
   * @param {String} pdfPath path of the source pdf file
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
  extractTerms(pdfPath) {
    return new Promise((resolve) => {
      this.extractionTaskManager.registerTask({
        job: (cb) => {
          console.log(`INFO [PdfUtil.extractTerms]: start extraction from ${pdfPath}`);
          const pptxPath = PathConvert.pdf.toPptx(pdfPath);
          const docxPath = PathConvert.pdf.toDocx(pdfPath);
          const pngDirPath = PathConvert.pdf.toPngDir(pdfPath);
          let oriFilePath = pdfPath.substring(AppConfig.PATHS.PDF_DIR.length + 1);

          // if the corresponding pptx or docx file exists, it is the original file
          if (fs.existsSync(pptxPath)) oriFilePath = pptxPath.substring(AppConfig.PATHS.PPTX_DIR.length + 1);
          else if (fs.existsSync(docxPath)) oriFilePath = docxPath.substring(AppConfig.PATHS.DOCX_DIR.length + 1);

          const fileId = crypto.createHash('sha256').update(oriFilePath).digest('hex');

          this
            .getNumPages(pdfPath)
            .then((pageNum) => {
              const pages = [];
              const promises = [];
              const progressBar = new ProgressBar('[:bar] :current / :total ', { total: pageNum });
              const pushPage = (pageIdx, termFreqDict) => {
                progressBar.tick();
                pages[pageIdx - 1] = {
                  fileId,
                  docId: crypto
                    .createHash('sha256')
                    .update(`${oriFilePath}-${pageIdx.toString().padStart(pageNum.toString().length, '0')}`)
                    .digest('hex'),
                  oriFilePath,
                  pageIdx,
                  imgPath: `${pngDirPath}/p-${pageIdx.toString().padStart(pageNum.toString().length, '0')}.png`,
                  termFreqDict,
                };
              };
              // for each page, do text extraction and then tokenization
              for (let pageIdx = 1; pageIdx <= pageNum; pageIdx += 1) {
                promises.push(
                  this
                    .getPageContent(pdfPath, pageIdx)
                    .then((content) => Tokenizer.tokenize(content))
                    .then((termFreqDict) => pushPage(pageIdx, termFreqDict)),
                );
              }
              PromiseUtil
                .tolerateAllAndKeepResolved(promises)
                .then(() => {
                  resolve({ pages });
                  cb();
                });
            });
        },
        failCallback: () => {
          console.log(`ERROR [PdfUtil.extractTerms]: timeout during extracting '${pdfPath}'`);
          resolve({ pages: [] });
        },
      });
    });
  }

  /**
   * Get number of pages of a pdf file
   * @param {String} pdfPath path of the source pdf file
   * @returns {Promise<Number>} promise with number of pages
   */
  getNumPages(pdfPath) {
    return new Promise((resolve) => {
      try {
        let pageNum = 0;

        // call the "pdfinfo" command line tool to get number of pages
        const pdfInfoProcess = spawn('pdfinfo', [pdfPath]);

        pdfInfoProcess.stdout.on('data', (data) => {
          const metaText = data.toString();
          pageNum = parseInt(metaText.substring(metaText.indexOf('Pages:') + 6), 10) || pageNum;
        });

        pdfInfoProcess.stderr.on('data', (data) => {
          console.log(`WARNING [PdfUtil.getNumPages]: ${data}`);
        });

        pdfInfoProcess.on('exit', () => {
          resolve(pageNum);
        });
      } catch (err) {
        console.log('ERROR [PdfUtil.getNumPages]: ', err);
        resolve(0);
      }
    });
  }

  /**
   * Get text content of a pdf page
   * @param {String} pdfPath path of the source pdf file
   * @param {Number} pageIdx page index, starting from 1
   * @returns {Promise<String>} promise with number of pages
   */
  getPageContent(pdfPath, pageIdx) {
    return new Promise((resolve) => {
      try {
        const contentBufs = [];

        // call the "pdfinfo" command line tool to get number of pages
        const pdfToTextProcess = spawn('pdftotext', ['-f', `${pageIdx}`, '-l', `${pageIdx}`, pdfPath, '-']);

        pdfToTextProcess.stdout.on('data', (data) => {
          contentBufs.push(data);
        });

        pdfToTextProcess.stderr.on('data', (err) => {
          console.log('WARNING [PdfUtil.getPageContent]: ', err);
        });

        pdfToTextProcess.on('exit', () => {
          resolve(Buffer.concat(contentBufs).toString());
        });
      } catch (err) {
        console.log('ERROR [PdfUtil.getPageContent]: ', err);
        resolve('');
      }
    });
  }
}

export default new PdfUtil();
