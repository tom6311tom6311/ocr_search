import fs from 'fs';
import path from 'path';
import rmrf from 'rimraf';
import ProgressBar from 'progress';
import PDF2Pic from 'pdf2pic';
import listDirRec from './util/listDirRec.func';
import TaskQueueManager from './util/TaskQueueManager.class';

const DATA_DIR = 'data';
const PDF_DIR = `${DATA_DIR}/pdf`;
const PNG_DIR = `${DATA_DIR}/png`;

console.log('INFO [pdf2png]: listing pdf files...');
const pdfFileList = listDirRec(PDF_DIR).filter(f => f.toLowerCase().endsWith('pdf'));

console.log('INFO [pdf2png]: start conversion from pdf to png');
const progressBar = new ProgressBar('INFO [pdf2png]: converting to png [:bar] :percent', {
  complete: '=',
  incomplete: ' ',
  width: 20,
  total: pdfFileList.length,
});

const convertManager = new TaskQueueManager(5*60*1000);
pdfFileList.forEach((pdfPath) => {
  convertManager.registerTask({
    job: (cb) => {
      const pngDir = pdfPath
        .replace(PDF_DIR, PNG_DIR)
        .replace('.PDF', '')
        .replace('.pdf', '');
  
      if (fs.existsSync(pngDir)) {
        rmrf.sync(pngDir);
      }
  
      if (!fs.existsSync(pngDir)) {
        fs.mkdirSync(pngDir, { recursive: true });
      }

      const pdf2pic = new PDF2Pic({
        density: 100,           // output pixels per inch
        savename: path.basename(pngDir),   // output file name
        savedir: pngDir,    // output file location
        format: "png",          // output file format
      });
  
      pdf2pic.convertBulk(pdfPath)
        .then(
          () => {
            progressBar.tick();
            cb();
          }, (err) => {
            console.log(`ERROR [pdf2png]: ${err}`);
            cb();
          }
        );
    },
    failCallback: () => {
      console.log(`ERROR [pdf2png]: timeout during converting file '${pdfPath}'`);
    },
  });
});
