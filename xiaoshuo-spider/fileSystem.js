const fs = require('fs');
const util = require('util');
const path = require('path');

class FileSystem {
  constructor() {
    this._mkdir = util.promisify(fs.mkdir);
    this._save = util.promisify(fs.writeFile);
  }

  async mkdir(dirName) {
    const dirPath = path.resolve(__dirname, dirName);
    if (fs.existsSync(dirPath)) {
      fs.rmdirSync(dirPath);
    }
    await this._mkdir(path.resolve(__dirname, dirName));
  }

  async save(dirName, fileName, data) {
    await this._save(`${path.resolve(__dirname, dirName, fileName)}.txt`, data);
  }

  remove(dirName) {
    const dirPath = path.resolve(__dirname, dirName);
    if (fs.existsSync(path.resolve(dirPath))) {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const filePath = path.resolve(__dirname, dirName, file);
        if (fs.statSync(filePath).isDirectory()) {
          this.remove(file);
        } else {
          fs.unlinkSync(filePath);
        }
      }
    }
  }
}

module.exports = FileSystem;
