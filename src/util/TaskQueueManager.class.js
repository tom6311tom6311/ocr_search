import Queue from './DataStructure/Queue.class';

class TaskQueueManager {
  constructor(taskDuration, numParallel = 1) {
    this.taskDuration = taskDuration;
    this.numParallel = Math.max(numParallel, 1);
    this.taskQueue = new Queue();
    this.taskTimeouts = {};
    this.lastTaskParams = undefined;
    this.initTaskTimeouts();
  }

  clear() {
    this.taskQueue.clear();
    this.clearTaskTimeouts();
  }

  initTaskTimeouts() {
    for (let i = 0; i < this.numParallel; i += 1) {
      this.taskTimeouts[i.toString()] = -1;
    }
  }

  clearTaskTimeouts() {
    for (let i = 0; i < this.numParallel; i += 1) {
      if (this.taskTimeouts[i.toString()] !== -1) {
        clearTimeout(this.taskTimeouts[i.toString()]);
        this.taskTimeouts[i.toString()] = -1;
      }
    }
  }

  registerTask(task) {
    this.taskQueue.enqueue(task);
    this.digestTask();
  }

  digestTask() {
    // wait for callstack to be cleared
    setTimeout(() => {
      if (this.taskQueue.isEmpty()) return;
      const taskTimeoutIdxStr = Object
        .keys(this.taskTimeouts)
        .find(idxStr => this.taskTimeouts[idxStr] === -1);
      if (taskTimeoutIdxStr === undefined) return;

      const { job, failCallback, params } = this.taskQueue.dequeue();

      this.taskTimeouts[taskTimeoutIdxStr] = setTimeout(() => {
        failCallback();
        this.taskTimeouts[taskTimeoutIdxStr] = -1;
        this.digestTask();
      }, this.taskDuration);

      this.lastTaskParams = params;

      job(() => {
        clearTimeout(this.taskTimeouts[taskTimeoutIdxStr]);
        this.taskTimeouts[taskTimeoutIdxStr] = -1;
        this.digestTask();
      });
    }, 0);
  }

  getLastTaskParams() {
    return this.lastTaskParams;
  }
}

export default TaskQueueManager;
