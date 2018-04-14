const fs = require('fs');
const path = require('path');

class FileSystem {

  remove(dirName) {
    const dirPath = path.join(__dirname, dirName);
    if(fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      files.forEach(file => {
        const filePath = path.join(__dirname, dirName, file);
        if (fs.statSync(filePath).isDirectory()) {
          this.remove(file);
        } else {
          fs.unlink(filePath);
        }
      });
    }
  }

  save(fd, firstLevelDirName, secondLevelDirname, fileName) {
    fd.pipe(fs.createWriteStream(path.join(__dirname, firstLevelDirName, secondLevelDirname, fileName)));
  }

  create(...args) {
    const dirPath = path.join(__dirname, ...args);
    if (fs.existsSync(dirPath)) {
      return;
    };

    fs.mkdirSync(dirPath);
  }
}

module.exports = FileSystem;
