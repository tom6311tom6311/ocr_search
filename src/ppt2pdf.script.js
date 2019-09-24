import toPdf from 'office-to-pdf';
import fs from 'fs';
import path from 'path';
import ProgressBar from 'progress';
import AppConfig from '../config/AppConfig.const';
import listDirRec from './util/listDirRec.func';
import TaskQueueManager from './util/TaskQueueManager.class';


console.log('INFO [pptx2pdf]: listing pptx files...');
const pptxFileList = listDirRec(AppConfig.PATHS.PPTX_DIR).filter((f) => f.endsWith('pptx'));

const progressBar = new ProgressBar('INFO [pptx2pdf]: converting to pdf [:bar] :percent', {
  complete: '=',
  incomplete: ' ',
  width: 20,
  total: pptxFileList.length,
});

const convertManager = new TaskQueueManager(100000);
pptxFileList.forEach((pptxPath) => {
  convertManager.registerTask({
    job: (cb) => {
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
          progressBar.tick();
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
});
