import leven from 'leven';
import DbInterface from '../DbInterface/DbInterface.class';

const similarity = (term1, term2) => Math.max(term1.length, term2.length) - leven(term1, term2);

class TermMatcher {
  constructor() {
    this.searchBuffer = {};
  }

  match(searchTerm, callback = () => {}, failCallback = () => {}) {
    if (this.searchBuffer[searchTerm] !== undefined) callback(this.searchBuffer[searchTerm]);
    DbInterface.findPages(searchTerm, (pages) => {
      const result = pages
        .sort((a, b) => similarity(b.term, searchTerm) - similarity(a.term, searchTerm));
      this.searchBuffer[searchTerm] = result;
      callback(result);
    }, failCallback);
  }
}

export default new TermMatcher();
