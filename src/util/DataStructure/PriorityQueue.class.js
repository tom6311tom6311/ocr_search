class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(item, priority) {
    const newElement = { item, priority };
    if (this.isEmpty()) {
      this.items.push(newElement);
    } else {
      let added = false;
      for (let i = 0; i < this.items.length; i += 1) {
        if (newElement.priority < this.items[i].priority) {
          this.items.splice(i, 0, newElement);
          added = true;
          break;
        }
      }

      if (!added) {
        this.items.push(newElement);
      }
    }
  }

  dequeue() {
    return this.items.shift();
  }

  front() {
    return this.items[0].item;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  clear() {
    this.items = [];
  }

  size() {
    return this.items.length;
  }

  findIndex(condition) {
    return this.items.map((e) => e.item).findIndex(condition);
  }

  forEach(func) {
    return this.items.map((e) => e.item).forEach(func);
  }

  map(condition) {
    return this.items.map((e) => e.item).map(condition);
  }

  filter(condition) {
    return this.items.map((e) => e.item).filter(condition);
  }

  update(idx, newItem, priority) {
    const { item } = this.items.splice(idx, 1)[0];
    this.enqueue({ ...item, ...newItem }, priority);
  }

  updateAll(params) {
    this.items = this.items.map((element) => ({
      ...element,
      item: {
        ...element.item,
        ...params,
      },
    }));
  }

  getItem(idx) {
    return this.items[idx].item;
  }

  delete(idx) {
    this.items.splice(idx, 1);
  }
}

export default PriorityQueue;
