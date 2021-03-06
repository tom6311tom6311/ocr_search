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
   * @param {String} pptxPath path of the source pptx file
   * @returns {Promise<Boolean>} a conversion promise with a boolean flag indicating if the it succeeds
   */
  pptx2pdf(pptxPath) {
    return new Promise((resolve) => {
      this.convertManager.registerTask({
        job: (cb) => {
          console.log(`INFO [TypeConverter.pptx2pdf]: converting ${pptxPath} to pdf...`);
          try {
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
            toPdf(pptxFile)
              .then((pdfFile) => {
                fs.writeFileSync(pdfPath, pdfFile);
                resolve(true);
                cb();
              })
              .catch((err) => {
                console.log('ERROR [TypeConverter.pptx2pdf]: ', err);
                resolve(false);
                cb();
              });
          } catch (err) {
            console.log('ERROR [TypeConverter.pptx2pdf]: ', err);
            resolve(false);
            cb();
          }
        },
        failCallback: () => {
          console.log(`ERROR [TypeConverter.pptx2pdf]: timeout during converting file '${pptxPath}'`);
          resolve(false);
        },
      });
    });
  }

  /**
   * Conversion from docx to pdf
   * @param {String} docxPath path of the source docx file
   * @returns {Promise<Boolean>} a conversion promise with a boolean flag indicating if the it succeeds
   */
  docx2pdf(docxPath) {
    return new Promise((resolve) => {
      this.convertManager.registerTask({
        job: (cb) => {
          console.log(`INFO [TypeConverter.docx2pdf]: converting ${docxPath} to pdf...`);
          try {
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
            toPdf(docxFile)
              .then((pdfFile) => {
                fs.writeFileSync(pdfPath, pdfFile);
                resolve(true);
                cb();
              })
              .catch((err) => {
                console.log('ERROR [TypeConverter.docx2pdf]: ', err);
                resolve(false);
                cb();
              });
          } catch (err) {
            console.log('ERROR [TypeConverter.docx2pdf]: ', err);
            resolve(false);
            cb();
          }
        },
        failCallback: () => {
          console.log(`ERROR [TypeConverter.docx2pdf]: timeout during converting file '${docxPath}'`);
          resolve(false);
        },
      });
    });
  }

  /**
   * Conversion from pdf to png
   * @param {String} pdfPath path of the source pdf file
   * @returns {Promise<any>}
   */
  pdf2png(pdfPath) {
    return new Promise((resolve) => {
      this.convertManager.registerTask({
        job: (cb) => {
          console.log(`INFO [TypeConverter.pdf2png]: converting ${pdfPath} to png...`);
          try {
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

            pdfToPngProcess.stderr.on('data', (err) => {
              console.log('WARNING [TypeConverter.pdf2png]: ', err.toString());
            });

            pdfToPngProcess.on('exit', (code) => {
              // verify conversion result by checking exist code
              switch (code) {
                case 0: // no error
                  resolve(true);
                  cb();
                  break;
                case 1: // error opening pdf file
                  console.log(`ERROR [TypeConverter.pdf2png]: error opening pdf file "${pdfPath}"`);
                  resolve(false);
                  cb();
                  break;
                case 2: // error opening an output file
                  console.log(`ERROR [TypeConverter.pdf2png]: error opening png files under "${pngDirPath}"`);
                  resolve(false);
                  cb();
                  break;
                case 3: // error related to pdf permissions
                  console.log(`ERROR [TypeConverter.pdf2png]: permission error with pdf file "${pdfPath}"`);
                  resolve(false);
                  cb();
                  break;
                default: // other error
                  console.log(`ERROR [TypeConverter.pdf2png]: child process ends with unknown exit code: ${code}`);
                  resolve(false);
                  cb();
                  break;
              }
            });
          } catch (err) {
            console.log('ERROR [TypeConverter.pdf2png]: ', err);
            resolve(false);
            cb();
          }
        },
        failCallback: () => {
          console.log(`ERROR [TypeConverter.pdf2png]: timeout during converting file '${pdfPath}'`);
          resolve(false);
        },
      });
    });
  }
}

export default new TypeConverter();
