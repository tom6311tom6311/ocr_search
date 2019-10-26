import DbInterface from '../DbInterface/DbInterface.class';

class TermMatcher {
  constructor() {
    this.searchBuffer = {};
  }

  clearBuffer() {
    this.searchBuffer = {};
  }

  match(searchTerms) {
    const promises = [];
    let documents = [];
    searchTerms.forEach((term) => {
      if (this.searchBuffer[term] !== undefined) documents = documents.concat(this.searchBuffer[term]);
      else {
        promises.push(
          DbInterface
            .getDocsByTerm({ term })
            .then((docs) => {
              // console.log(term, docs);
              documents = documents.concat(docs);
              this.searchBuffer[term] = docs;
            }),
        );
      }
    });
    return Promise
      .all(promises)
      .then(() => documents.sort((a, b) => b.tf - a.tf));
  }
}

export default new TermMatcher();
