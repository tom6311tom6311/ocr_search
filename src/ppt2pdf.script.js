import toPdf from 'office-to-pdf';
import fs from 'fs';
import path from 'path';
import ProgressBar from 'progress';
import listDirRec from './util/listDirRec.func';
import TaskQueueManager from './util/TaskQueueManager.class';

const DATA_DIR = 'data';
const PPT_DIR = `${DATA_DIR}/ppt`;
const PDF_DIR = `${DATA_DIR}/pdf`;

console.log('INFO [ppt2pdf]: listing ppt files...');
const pptFileList = listDirRec(PPT_DIR).filter(f => f.toLowerCase().endsWith('ppt') || f.toLowerCase().endsWith('pptx'));

// console.log(pptFileList);
const progressBar = new ProgressBar('INFO [ppt2pdf]: converting to pdf [:bar] :percent', {
  complete: '=',
  incomplete: ' ',
  width: 20,
  total: pptFileList.length,
});

const convertManager = new TaskQueueManager(100000);
pptFileList.forEach((pptPath) => {
  convertManager.registerTask({
    job: (cb) => {
      const pptFile = fs.readFileSync(pptPath);
      const pdfPath = pptPath
        .replace(PPT_DIR, PDF_DIR)
        .replace('.PPTX', '.pdf')
        .replace('.PPT', '.pdf')
        .replace('.pptx', '.pdf')
        .replace('.ppt', '.pdf');
  
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
  
      if (!fs.existsSync(path.dirname(pdfPath))) {
        fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
      }
  
      toPdf(pptFile).then(
        (pdfFile) => {
          fs.writeFileSync(pdfPath, pdfFile);
          progressBar.tick();
          cb();
        }, (err) => {
          console.log(`ERROR [ppt2pdf]: ${err}`);
          cb();
        }
      );
    },
    failCallback: () => {
      console.log(`ERROR [ppt2pdf]: timeout during converting file '${pptPath}'`);
    },
  });
});
