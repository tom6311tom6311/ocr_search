import fs from 'fs';
import path from 'path';
import rmrf from 'rimraf';
import ProgressBar from 'progress';
import PDF2Pic from 'pdf2pic';
import AppConfig from '../config/AppConfig.const';
import listDirRec from './util/listDirRec.func';
import TaskQueueManager from './util/TaskQueueManager.class';


console.log('INFO [pdf2png]: listing pdf files...');
const pdfFileList = listDirRec(AppConfig.PATHS.PDF_DIR).filter((f) => f.toLowerCase().endsWith('pdf'));

console.log('INFO [pdf2png]: start conversion from pdf to png');
const progressBar = new ProgressBar('INFO [pdf2png]: converting to png [:bar] :percent', {
  complete: '=',
  incomplete: ' ',
  width: 20,
  total: pdfFileList.length,
});

const convertManager = new TaskQueueManager(5 * 60 * 1000);
pdfFileList.forEach((pdfPath) => {
  convertManager.registerTask({
    job: (cb) => {
      const pngDir = pdfPath
        .replace(AppConfig.PATHS.PDF_DIR, AppConfig.PATHS.PNG_DIR)
        .replace('.PDF', '')
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
            progressBar.tick();
            cb();
          }, (err) => {
            console.log(`ERROR [pdf2png]: ${err}`);
            cb();
          },
        );
    },
    failCallback: () => {
      console.log(`ERROR [pdf2png]: timeout during converting file '${pdfPath}'`);
    },
  });
});
