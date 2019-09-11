// import Tesseract from 'tesseract.js';

// const { TesseractWorker } = Tesseract;
// const worker = new TesseractWorker();

// worker
//   .recognize(
//     'https://tesseract.projectnaptha.com/img/eng_bw.png',
//     'eng+chi_tra',
//   )
//   .progress((p) => {
//     console.log('progress', p);
//   })
//   .then(({ text }) => {
//     console.log(text);
//     worker.terminate();
//   });

import toPdf from 'office-to-pdf';
import fs from 'fs';

const oriFile = fs.readFileSync('./data/TAcc+ Biotech-E-2018Q4.pptx');

toPdf(oriFile).then(
  (pdfFile) => {
    fs.writeFileSync("./test.pdf", pdfFile);
  }, (err) => {
    console.log(err);
  }
);
