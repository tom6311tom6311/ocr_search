import { TesseractWorker } from 'tesseract.js';
import path from 'path';
import fs from 'fs';
import ProgressBar from 'progress';
import listDirRec from './util/listDirRec.func';
import TaskQueueManager from './util/TaskQueueManager.class';

const DATA_DIR = 'data';
const PNG_DIR = `${DATA_DIR}/png`;
const OCR_RESULT_PATH = `${DATA_DIR}/ocr_result.json`;

console.log('INFO [ocr]: listing image files...');
const pngFileList = listDirRec(PNG_DIR).filter((f) => f.toLowerCase().endsWith('png'));

console.log('INFO [ocr]: start character recognition');
const progressBar = new ProgressBar('INFO [ocr]: recognizing characters [:bar] :percent', {
  complete: '=',
  incomplete: ' ',
  width: 20,
  total: pngFileList.length,
});

const ocrWorker = new TesseractWorker();
const ocrManager = new TaskQueueManager(5 * 60 * 1000);
const ocrResult = {};
pngFileList.forEach((pngPath) => {
  ocrManager.registerTask({
    job: (cb) => {
      const fileName = path.dirname(pngPath).split(path.sep).pop();

      if (ocrResult[fileName] === undefined) {
        ocrResult[fileName] = {
          imgDirPath: path.dirname(pngPath),
          pages: [],
        };
      }

      ocrWorker
        .recognize(
          pngPath,
          'eng+chi_tra',
        )
        // .progress((p) => {
        //   console.log('progress', p);
        // })
        .then(
          ({ text }) => {
            // console.log(text);
            ocrWorker.terminate();
            ocrResult[fileName].pages.push({
              imgPath: pngPath,
              textList: text.split(' '),
            });
            progressBar.tick();
            if (progressBar.complete) {
              fs.writeFileSync(OCR_RESULT_PATH, JSON.stringify(ocrResult, null, 2));
              console.log(`INFO [ocr]: finished. Complete ocr result written to ${OCR_RESULT_PATH}`);
            }
            cb();
          },
          (err) => {
            console.log(`ERROR [ocr]: ${err}`);
            cb();
          },
        );
    },
    failCallback: () => {
      console.log(`ERROR [ocr]: timeout during recognizing '${pngPath}'`);
    },
  });
});
