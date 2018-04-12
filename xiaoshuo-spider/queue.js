const config = require('./config');
const Spider = require('./spider');

class Queue {
  constructor() {
    this.tasks = [];
    this.spider = new Spider();
  }

  task(taskName) {
    if (typeof taskName !== 'string') {
      throw new Error('taskName should be string');
    }

    const url = config[taskName];
    this.tasks.push({
      taskName,
      url
    });

    return this;
  }

  async start() {
    for (const task of this.tasks) {
      await this.spider.run(task);
    }
  }
  
}

module.exports = Queue;
