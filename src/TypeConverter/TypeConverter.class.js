import fs from 'fs';
import path from 'path';
import rmrf from 'rimraf';
import toPdf from 'office-to-pdf';
import { spawn } from 'child_process';
import TaskQueueManager from '../util/TaskQueueManager.class';
import AppConfig from '../../config/AppConfig.const';
import PathConvert from '../util/PathConvert.const';

/**
 * An instance handling the conversion between several file types: `pptx, docx, pdf, png`
 * @param {TaskQueueManager} convertManager a task manager making sure that tasks are done one after another
 */
class TypeConverter {
  constructor() {
    this.convertManager = new TaskQueueManager(AppConfig.TYPE_CONVERT.TIMEOUT);
  }

  /**
   * Conversion from pptx to pdf
   * @param {string} pptxPath path of the source pptx file
   * @returns {Promise<any>}
   */
  pptx2pdf(pptxPath) {
    return new Promise((resolve, reject) => {
      this.convertManager.registerTask({
        job: (cb) => {
          console.log(`INFO [TypeConverter.pptx2pdf]: converting ${pptxPath} to pdf...`);
          const pptxFile = fs.readFileSync(pptxPath);
          const pdfPath = PathConvert.pptx.toPdf(pptxPath);

          // if the target file already exists, remove it
          if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
          }

          // if the directory where the target file should be placed does not exist, construct it
          if (!fs.existsSync(path.dirname(pdfPath))) {
            fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
          }

          // convert and save to the corresponding pdf path
          toPdf(pptxFile).then(
            (pdfFile) => {
              fs.writeFileSync(pdfPath, pdfFile);
              resolve();
              cb();
            }, (err) => {
              console.log(`ERROR [TypeConverter.pptx2pdf]: ${err}`);
              reject();
              cb();
            },
          );
        },
        failCallback: () => {
          console.log(`ERROR [TypeConverter.pptx2pdf]: timeout during converting file '${pptxPath}'`);
          reject();
        },
      });
    });
  }

  /**
   * Conversion from docx to pdf
   * @param {string} docxPath path of the source docx file
   * @returns {Promise<any>}
   */
  docx2pdf(docxPath) {
    return new Promise((resolve, reject) => {
      this.convertManager.registerTask({
        job: (cb) => {
          console.log(`INFO [TypeConverter.docx2pdf]: converting ${docxPath} to pdf...`);
          const docxFile = fs.readFileSync(docxPath);
          const pdfPath = PathConvert.docx.toPdf(docxPath);

          // if the target file already exists, remove it
          if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
          }

          // if the directory where the target file should be placed does not exist, construct it
          if (!fs.existsSync(path.dirname(pdfPath))) {
            fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
          }

          // convert and save to the corresponding pdf path
          toPdf(docxFile).then(
            (pdfFile) => {
              fs.writeFileSync(pdfPath, pdfFile);
              resolve();
              cb();
            }, (err) => {
              console.log(`ERROR [TypeConverter.docx2pdf]: ${err}`);
              reject();
              cb();
            },
          );
        },
        failCallback: () => {
          console.log(`ERROR [TypeConverter.docx2pdf]: timeout during converting file '${docxPath}'`);
          reject();
        },
      });
    });
  }

  /**
   * Conversion from pdf to png
   * @param {string} pdfPath path of the source pdf file
   * @returns {Promise<any>}
   */
  pdf2png(pdfPath) {
    return new Promise((resolve, reject) => {
      this.convertManager.registerTask({
        job: (cb) => {
          console.log(`INFO [TypeConverter.pdf2png]: converting ${pdfPath} to png...`);
          const pngDirPath = PathConvert.pdf.toPngDir(pdfPath);

          // if the target png directory already exists, remove it
          if (fs.existsSync(pngDirPath)) {
            rmrf.sync(pngDirPath);
          }
          // construct the target png directory
          fs.mkdirSync(pngDirPath, { recursive: true });

          // call the "pdftoppm" command line tool to perform type conversion
          const pdfToPngProcess = spawn('pdftoppm', ['-png', pdfPath, `${pngDirPath}/p`]);

          pdfToPngProcess.stdout.on('data', (data) => {
            console.log(`INFO [TypeConverter.pdf2png]: ${data}`);
          });

          pdfToPngProcess.stderr.on('data', (data) => {
            console.log(`ERROR [TypeConverter.pdf2png]: ${data}`);
          });

          pdfToPngProcess.on('close', (code) => {
            // verify conversion result by checking exist code
            switch (code) {
              case 0: // no error
                resolve();
                cb();
                break;
              case 1: // error opening pdf file
                console.log(`ERROR [TypeConverter.pdf2png]: error opening pdf file "${pdfPath}"`);
                reject();
                cb();
                break;
              case 2: // error opening an output file
                console.log(`ERROR [TypeConverter.pdf2png]: error opening png files under "${pngDirPath}"`);
                reject();
                cb();
                break;
              case 3: // error related to pdf permissions
                console.log(`ERROR [TypeConverter.pdf2png]: permission error with pdf file "${pdfPath}"`);
                reject();
                cb();
                break;
              default: // other error
                console.log('ERROR [TypeConverter.pdf2png]: unknown error');
                reject();
                cb();
                break;
            }
          });
        },
        failCallback: () => {
          console.log(`ERROR [TypeConverter.pdf2png]: timeout during converting file '${pdfPath}'`);
          reject();
        },
      });
    });
  }
}

export default new TypeConverter();
