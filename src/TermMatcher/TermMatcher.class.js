import DbInterface from '../DbInterface/DbInterface.class';
import PromiseUtil from '../util/PromiseUtil.const';

/**
 * An class handling term matching, which is the core functionality of search API
 */
class TermMatcher {
  /**
   * Match search terms with documents (pages)
   * @param {Array<string>} searchTerms an array of tokenized search terms originated from user query
   * @returns {Promise<Array<doc>>} promise with returned array of documents, sorted by correlation score between it and the user query
   *
   * @example
   * // each doc is in following structure
   * {
   *   fileId,                    // an identifier generated from the raw file path (i.e. if "test.pdf" is generated from "test.docx", they share the same fileId)
   *   docId,                     // an identifier of the document (page)
   *   oriFilePath,               // original file path
   *   pageIdx,                   // page index (starting from 1)
   *   imgPath,                   // path of the corresponding png file. This is for front-end application to retrieve image
   *   score,                     // the correlation score between the document and the user query
   * }
   *
   */
  static match(searchTerms) {
    // for each search term, find its related documents and compute correlation score
    return PromiseUtil
      .tolerateAllAndKeepResolved(
        searchTerms.map(
          (term) => (
            DbInterface
              .getDocsByTerm({ term })
              .then((docs) => (
                docs.map(({ tf, ...doc }) => ({ ...doc, score: tf }))
              ))
          ),
        ),
      )
      // merge all lists of documents found into a single list
      .then((docss) => {
        const docDict = {};
        const docsRaw = [].concat(...docss);
        docsRaw.forEach((doc) => {
          if (docDict[doc.docId] === undefined) {
            docDict[doc.docId] = doc;
          } else if (docDict[doc.docId].score < doc.score) {
            docDict[doc.docId].score = doc.score;
          }
        });
        return Object.values(docDict);
      })
      // sort the resulting documents by correlation score
      .then((docs) => docs.sort((a, b) => b.score - a.score));

    // workaround: disable term-correlation computation for now
    // TODO: improve term-correlation computation

    // return PromiseUtil
    //   // expand each search term
    //   .tolerateAllAndKeepResolved(searchTerms.map((term) => DbInterface.findClosestTerms({ term })))
    //   // merge all the expanded term lists into a single list called "expandedTerms"
    //   .then((termss) => ([...new Set(searchTerms.map((term) => ({ term, tcr: 1 })).concat(...termss))]))
    //   .then((expandedTerms) => (
    //     // for each of the expanded terms, find its related documents and compute correlation scores
    //     PromiseUtil.tolerateAllAndKeepResolved(
    //       expandedTerms.map(
    //         ({ term, tcr }) => (
    //           DbInterface
    //             .getDocsByTerm({ term })
    //             .then((docs) => (
    //               docs.map(({ tf, ...doc }) => ({ ...doc, score: tcr * tf }))
    //             ))
    //         ),
    //       ),
    //     )
    //   ))
    //   // merge all lists of documents found into a single list
    //   .then((docss) => [].concat(...docss))
    //   // sort the resulting documents by correlation score
    //   .then((docs) => docs.sort((a, b) => b.score - a.score));
  }
}

export default TermMatcher;
