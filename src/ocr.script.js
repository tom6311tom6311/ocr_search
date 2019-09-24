import { TesseractWorker } from 'tesseract.js';
import path from 'path';
import fs from 'fs';
import ProgressBar from 'progress';
import AppConfig from '../config/AppConfig.const';
import listDirRec from './util/listDirRec.func';
import TaskQueueManager from './util/TaskQueueManager.class';


console.log('INFO [ocr]: listing image files...');
const pngFileList = listDirRec(AppConfig.PATHS.PNG_DIR).filter((f) => f.endsWith('png'));

console.log('INFO [ocr]: start character recognition');
const progressBar = new ProgressBar('INFO [ocr]: recognizing characters  [:bar]  :current/:total ETA :etas', {
  complete: '=',
  incomplete: ' ',
  width: 20,
  total: pngFileList.length,
});

const ocrWorker = new TesseractWorker();
const ocrManager = new TaskQueueManager(5 * 60 * 1000);
const ocrResult = {};

if (fs.existsSync(AppConfig.PATHS.OCR_TMP_RESULT_PATH)) {
  fs.unlinkSync(AppConfig.PATHS.OCR_TMP_RESULT_PATH);
}

const ocrTmpResultWriter = fs.createWriteStream(AppConfig.PATHS.OCR_TMP_RESULT_PATH, {
  flags: 'a',
});

const recognize = (pngPath, pageIdx, lang, cb = () => {}) => {
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
      lang,
    )
    .then(
      ({ text /* paragraphs */ }) => {
        const textList = text.replace(/\n/g, ' ').split(' ');
        // const textList = [];
        // paragraphs.forEach(({ confidence: confiP, lines }) => {
        //   // if (confiP < OCR_CONFIDENCE_THRES) return;
        //   lines.forEach(({ confidence: confiL, words }) => {
        //     // if (confiL < OCR_CONFIDENCE_THRES) return;
        //     words.forEach(({ confiW, text }) => {
        //       // if (confiW < OCR_CONFIDENCE_THRES) return;
        //       textList.push(text);
        //     });
        //   });
        // });
        ocrTmpResultWriter.write(`${pngPath.substring(AppConfig.PATHS.PNG_DIR.length + 1)}\t${lang}\t[ ${textList} ]\n`);
        if (ocrResult[fileName].pages[pageIdx] === undefined) {
          ocrResult[fileName].pages[pageIdx] = {
            imgPath: pngPath.substring(AppConfig.PATHS.PNG_DIR.length + 1),
            // textList,
            joinedTerm: textList.join('').toLowerCase(),
          };
        } else {
          ocrResult[fileName].pages[pageIdx].pageIdx = pageIdx;
          ocrResult[fileName].pages[pageIdx].textList = ocrResult[fileName].pages[pageIdx].textList.concat(textList);
          ocrResult[fileName].pages[pageIdx].joinedTerm = `${ocrResult[fileName].pages[pageIdx].joinedTerm}${textList.join('').toLowerCase()}`;
        }
        cb();
      },
      (err) => {
        console.log(`ERROR [ocr]: ${err}`);
        cb();
      },
    );
};

pngFileList.forEach((pngPath) => {
  ocrManager.registerTask({
    job: (cb) => {
      const pageIdx = parseInt(pngPath.substring(pngPath.lastIndexOf('_') + 1), 10);
      recognize(pngPath, pageIdx, 'eng', cb);
      recognize(pngPath, pageIdx, 'chi_tra', cb);
      recognize(pngPath, pageIdx, 'chi_sim', () => {
        progressBar.tick();
        if (progressBar.complete) {
          fs.writeFileSync(AppConfig.PATHS.OCR_RESULT_PATH, JSON.stringify(ocrResult, null, 2));
          console.log(`INFO [ocr]: finished. Complete ocr result written to ${AppConfig.PATHS.OCR_RESULT_PATH}`);
        }
        cb();
      });
    },
    failCallback: () => {
      console.log(`ERROR [ocr]: timeout during recognizing '${pngPath}'`);
    },
  });
});
