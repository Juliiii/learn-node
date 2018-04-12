const request = require('request');
const iconv = require('iconv-lite');
const cheerio = require('cheerio');
const util = require('util');
const FileSystem = require('./fileSystem');
const fileSystem = new FileSystem();

class Spider {
  constructor() {
    this._request = util.promisify(request); 
  }

  async _queue(num, urls, url, taskName) {
    for (let i = 0; i < urls.length; i+=num) {
      const end = urls.length > num ? num : urls.length;
      const tasks = [];
      for (let j = 0; j < end; j++) {
        tasks.push(this._save(urls[i + j], url, taskName));
      }

      await Promise.all(tasks);

      // await this._save(urls[i], url, taskName);
    }
  }

  async run({taskName, url}) {
    const urls = await this._get(url);
    fileSystem.remove(taskName);
    await fileSystem.mkdir(taskName);
    this._queue(3, urls, url, taskName);
  }

  async _get(url) {
    const res = await this._request({
      url,
      encoding: null
    });
    const urls = [];
    const $ = cheerio.load(iconv.decode(res.body, 'gb2312'), {decodeEntities: false});
    $('ul li a').each((index, el) => {
      urls.push(el.attribs.href);
    });
    return Promise.resolve(urls);
  }

  _save(url, preifx, taskName) {

    return new Promise(async (resolve, reject) => {
      const res = await this._request({
        url : `${preifx.substr(0, preifx.lastIndexOf('/') + 1)}${url}`,
        encoding: null
      });
      const $ = cheerio.load(iconv.decode(res.body, 'gb2312'), {decodeEntities: false});
      await fileSystem.save(taskName, `${$('h1').text()}`, $.text());
      console.log(`${taskName}/${$('h1').text()} 已完成`);
      resolve();
    });
  }

}

module.exports = Spider;
