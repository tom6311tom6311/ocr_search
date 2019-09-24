import fs from 'fs';
import path from 'path';
import rmrf from 'rimraf';
import toPdf from 'office-to-pdf';
import PDF2Pic from 'pdf2pic';
import TaskQueueManager from '../util/TaskQueueManager.class';
import AppConfig from '../../config/AppConfig.const';

class TypeConverter {
  constructor() {
    this.convertManager = new TaskQueueManager(AppConfig.TYPE_CONVERT.TIMEOUT);
  }

  pptx2pdf(pptxPath, callback = () => {}) {
    this.convertManager.registerTask({
      job: (cb) => {
        console.log(`INFO [TypeConverter]: converting ${pptxPath} to pdf...`);
        const pptxFile = fs.readFileSync(pptxPath);
        const pdfPath = pptxPath
          .replace(AppConfig.PATHS.PPTX_DIR, AppConfig.PATHS.PDF_DIR)
          .replace('.pptx', '.pdf');

        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }

        if (!fs.existsSync(path.dirname(pdfPath))) {
          fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
        }

        toPdf(pptxFile).then(
          (pdfFile) => {
            fs.writeFileSync(pdfPath, pdfFile);
            callback();
            cb();
          }, (err) => {
            console.log(`ERROR [pptx2pdf]: ${err}`);
            cb();
          },
        );
      },
      failCallback: () => {
        console.log(`ERROR [pptx2pdf]: timeout during converting file '${pptxPath}'`);
      },
    });
  }

  pdf2png(pdfPath, callback = () => {}) {
    console.log(`INFO [TypeConverter]: converting ${pdfPath} to png...`);
    this.convertManager.registerTask({
      job: (cb) => {
        const pngDir = pdfPath
          .replace(AppConfig.PATHS.PDF_DIR, AppConfig.PATHS.PNG_DIR)
          .replace('.pdf', '');

        if (fs.existsSync(pngDir)) {
          rmrf.sync(pngDir);
        }

        if (!fs.existsSync(pngDir)) {
          fs.mkdirSync(pngDir, { recursive: true });
        }

        const pdf2pic = new PDF2Pic({
          density: 100,
          savename: path.basename(pngDir),
          savedir: pngDir,
          format: 'png',
        });

        pdf2pic.convertBulk(pdfPath)
          .then(
            () => {
              callback();
              cb();
            },
            (err) => {
              console.log(`ERROR [pdf2png]: ${err}`);
              cb();
            },
          );
      },
      failCallback: () => {
        console.log(`ERROR [pdf2png]: timeout during converting file '${pdfPath}'`);
      },
    });
  }
}

export default new TypeConverter();
