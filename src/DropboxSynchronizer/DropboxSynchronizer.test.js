import fs from 'fs';
import rmrf from 'rimraf';
import DropboxSynchronizer from './DropboxSynchronizer.class';
import AppConfig from '../../config/AppConfig.const';

const cleanDataDir = () => {
  rmrf.sync(AppConfig.PATHS.PPTX_DIR);
  rmrf.sync(AppConfig.PATHS.DOCX_DIR);
  rmrf.sync(AppConfig.PATHS.PDF_DIR);
  rmrf.sync(AppConfig.PATHS.PNG_DIR);
};

afterAll(() => cleanDataDir());

test('local folder hierarchy is constructed when the synchronizer is accessed for the first time', () => {
  expect(fs.existsSync(AppConfig.PATHS.PPTX_DIR)).toBeTruthy();
  expect(fs.existsSync(AppConfig.PATHS.DOCX_DIR)).toBeTruthy();
  expect(fs.existsSync(AppConfig.PATHS.PDF_DIR)).toBeTruthy();
  expect(fs.existsSync(AppConfig.PATHS.PNG_DIR)).toBeTruthy();
});

test('the synchronizer can list files of remote folder', (done) => {
  DropboxSynchronizer.dbx.filesListFolder({
    path: '',
    recursive: true,
  })
    .then(({ entries }) => {
      expect(entries).toBeInstanceOf(Array);
      done();
    });
});
