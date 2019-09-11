import fs from 'fs';

// listDirRec returns a list of all files in a given dir and its sub-dirs
const listDirRec = (dir) => {
  const files = fs.readdirSync(dir);
  let fileList = [];
  files.forEach((file) => {
    if (fs.statSync(`${dir}/${file}`).isDirectory()) {
      fileList = fileList.concat(listDirRec(`${dir}/${file}`));
    } else {
      fileList.push(`${dir}/${file}`);
    }
  });
  return fileList;
};

export default listDirRec;
