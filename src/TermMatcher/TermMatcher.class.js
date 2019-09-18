import leven from 'leven';
import randomChoice from '../util/randomChoice.func';

const similarity = (term1, term2) => Math.max(term1.length, term2.length) - leven(term1, term2);

class TermMatcher {
  constructor() {
    this.termLib = null;
    this.searchBuffer = null;
  }

  loadTermLib(ocrData) {
    this.termLib = [];
    this.searchBuffer = {};
    Object.keys(ocrData).forEach((fileName) => {
      const { pages } = ocrData[fileName];
      pages.forEach((page) => {
        if (!page) return;
        const { pageIdx, imgPath, joinedTerm: term } = page;
        this.termLib.push({
          term,
          params: {
            fileName,
            pageIdx,
            imgPath,
          },
        });
      });
    });
  }

  match(searchTerm) {
    if (this.termLib === null || this.termLib.length === 0) return [];
    if (searchTerm === '') {
      return randomChoice(
        this.termLib.map(({ params }) => params),
      );
    }
    if (this.searchBuffer[searchTerm] !== undefined) return this.searchBuffer[searchTerm];
    const result = this.termLib
      .sort((a, b) => similarity(b.term, searchTerm) - similarity(a.term, searchTerm))
      .map(({ params }) => params);
    this.searchBuffer[searchTerm] = result;
    return result;
  }
}

export default new TermMatcher();
