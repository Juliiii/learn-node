const config = require('./config');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const FileSystem = require('./fileSystem');
const async = require('async');
const fileSystem = new FileSystem();

class Sprider {
  constructor() {
    this.urlMap = new Map();
  }

  async getCategories() {
    const { data } = await axios.get(config.url);
    const dom = new JSDOM(data);
    let children = Array.from(dom.window.document.getElementById('menu-nav').children).slice(1);
    children.forEach(_ => {
      this.urlMap.set(_.children[0].innerHTML, _.children[0].getAttribute('href'));
    });

    children = Array.from(dom.window.document.getElementsByClassName('subnav')[0].children);

    children.forEach(_ => {
      this.urlMap.set(_.innerHTML, _.getAttribute('href'));
    });
  }

  async getOneCategory(url) {
    const { data } = await axios.get(url);
    let dom = new JSDOM(data);
    let document = dom.window.document;
    let pages = Array.from(document.getElementsByClassName('page-numbers'));
    if (!pages.length) {
      pages = [url];
    } else {
      const allPagesNum = Number(pages.slice(-2)[0].getAttribute('href').split('/').slice(-2)[0]);
      const flag = url.lastIndexOf('/') === url.length - 1;
      pages = [url];
      for (let i = 2; i <= allPagesNum; i++) {
        pages.push(flag ? `${url}page/${i}/` : `${url}/page/${i}/`);
      }
    }

    let res = [];
    for (const page of pages) {
      const { data } = await axios.get(page);
      dom = new JSDOM(data);
      document = dom.window.document;
      const pins = Array.from(document.getElementById('pins').children);
      let pinsUrl;
      if (pins.length) {
        pinsUrl = pins.map(pin => pin.children[0].getAttribute('href'));
      }
      res = res.concat(pinsUrl);
    }

    return Promise.resolve(res);
  }

  getOneCategoryAllImgUrls(urls) {
    return new Promise((resolve) => {
      let res = new Map();
      let dom, document;
      async.mapLimit(urls, 10, async (url) => {
        const { data } = await axios.get(url);
        dom = new JSDOM(data);
        document = dom.window.document;
        const title = document.getElementsByClassName('main-title')[0].innerHTML;
        const firstImg = document.getElementsByClassName('main-image')[0].children[0].children[0].children[0];
        let firstImgUrl = firstImg.getAttribute('src');
        const pagesDom = Array.from(document.getElementsByClassName('pagenavi')[0].children).top();
  
        let arr = [];
        if (!pagesDom.length) {
          arr = [firstImgUrl];
        } else {
          const pages = Number(pagesDom.slice(-2)[0].children[0].innerHTML);
          let firstImgUrl_1 = firstImgUrl.substr(0, firstImgUrl.lastIndexOf('.') - 2);
          let firstImgUrl_2 = firstImgUrl.substr(firstImgUrl.lastIndexOf('.'));
          for (let i = 1; i <= pages; i++) {
  
            arr.push(i < 10 ? `${firstImgUrl_1}${'0' +  i}${firstImgUrl_2}` : `${firstImgUrl_1}${i}${firstImgUrl_2}`);
          }
        }
        console.log(`${title}目录获取完成`);
        return [title, arr];
      }, (err, res) => {
        if (!err) {
          let map = new Map();
          for (const [title, arr] of res) {
            map.set(title, arr);
          }
          resolve(map);
        } else {
          console.log(err);
        }
      });
    });
  }

  getOneCategoryAllImgs(entries, firsetLevelDirname) {
    async.mapLimit(entries, 1, async ([secondLevelDirname, urls]) => {
      fileSystem.create(firsetLevelDirname, secondLevelDirname);
      async.mapLimit(urls, 5, async (url) => {
        try {
          const { data } = await axios.get(url, {
            responseType: 'stream',
            headers: {
              'Referer': 'http://www.mzitu.com/'
            }
          });
          const fileName = url.substr(url.lastIndexOf('/'));
          fileSystem.save(data, firsetLevelDirname, secondLevelDirname, url.substr(url.lastIndexOf('/')));
        } catch(err) {
          console.log(secondLevelDirname, err.response.status);
        }
      }, (err, res) => {
        console.log('------------华丽分割线-----------');
        console.log(`${secondLevelDirname}图片获取完成`)
      });
    }, (err, res) => {
      console.log('------------华丽分割线-----------');
      console.log(`${firsetLevelDirname}图片获取完成`)
    });
  }

  async _run(category) {
    const dirName = config[category];
    const url = this.urlMap.get(dirName);
    if (!url) return;
    fileSystem.remove(dirName);
    fileSystem.create(dirName);

    switch(dirName) {
      case config.japen:
      case config.taiwan:
      case config.sexy:
      case config.pure:
      case config.latest:
      case config.hottest:
      case config.recommend:
        const itemUrls = await this.getOneCategory(url);
        const imgUrls = await this.getOneCategoryAllImgUrls(itemUrls);
        this.getOneCategoryAllImgs(imgUrls, dirName);
        break;

      case config.topics:
        break;
      case config.selfie:
        break;

      case config.updata:
        break;
      
    }


  }


  async run(target) {
    await this.getCategories();
    if (typeof target === 'string') {
      this._run(target);
    } else if (Array.isArray(target)) {
      target.forEach(_ => this.run(_));
    }
  }
}

module.exports = Sprider;
