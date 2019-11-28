import { MongoClient } from 'mongodb';
import AppConfig from '../../config/AppConfig.const';
import PromiseUtil from '../util/PromiseUtil.const';

/**
 * An instance handling creat, read, update, delete (CRUD) operations on the Mongo database
 * @param {Db} dbClient a connected MongoDB instance [>> ref <<](http://mongodb.github.io/node-mongodb-native/2.0/api/Db.html)
 */
class DbInterface {
  constructor() {
    this.dbClient = null;
    this.connectDb()
      .then((dbClient) => {
        this.dbClient = dbClient;
      })
      .catch((err) => {
        console.error('ERROR [DbInterface]: ', err);
      });
  }

  /**
   * Connect to database. The MongoDB url can be configured with "MONGO_DB.URL" in "config/AppConfig.const.js"
   * @returns {Promise<Db>}
   */
  connectDb() {
    return MongoClient.connect(
      AppConfig.MONGO_DB.URL,
      {
        poolSize: AppConfig.MONGO_DB.POOL_SIZE,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );
  }

  /**
   * Create or update a file in the database
   * @param {object} param
   * @param {Array<Doc>} param.pages the pages (documents) that belong to the file to be updated
   * @returns {Promise<any>}
   *
   * @example
   * // each "Doc" is in following structure
   * {
   *   fileId,                    // an identifier generated from the raw file path (i.e. if "test.pdf" is generated from "test.docx", they share the same fileId)
   *   docId,                     // an identifier of the document (page)
   *   oriFilePath,               // original file path
   *   pageIdx,                   // page index (starting from 1)
   *   imgPath,                   // path of the corresponding png file. This is for front-end application to retrieve image
   *   termFreqDict: {            // a mapping from terms to their occurrences (term frequency) in the page
   *     [term]: term_frequency,
   *     ...
   *   },
   * }
   *
   */
  updateFile({ pages }) {
    return PromiseUtil.tolerateAllAndKeepResolved(
      pages.map((page) => this.updatePage(page)),
    );
  }

  /**
   * Given original file's path, get all the pages (documents) belonging to it
   * @param {String} oriFilePath original file path (i.e. if a pdf was generated from a docx, the docx file is the original one)
   * @returns {Promise<Array<Doc>>}
   *
   * @example
   * // each "Doc" is in following structure
   * {
   *   fileId,                    // an identifier generated from the raw file path (i.e. if "test.pdf" is generated from "test.docx", they share the same fileId)
   *   docId,                     // an identifier of the document (page)
   *   oriFilePath,               // original file path
   *   pageIdx,                   // page index (starting from 1)
   *   imgPath,                   // path of the corresponding png file. This is for front-end application to retrieve image
   * }
   *
   */
  getFilePages(oriFilePath) {
    return (
      this.dbClient
        .db(AppConfig.MONGO_DB.DB_NAME)
        .collection(AppConfig.MONGO_DB.COLLECTION_NAME.DOCS)
        .find({ oriFilePath })
        .toArray()
        .catch((err) => {
          console.log('ERROR [DbInterface.getFilePages]: ', err);
          return Promise.resolve([]);
        })
    );
  }

  /**
   * Given original file's path, delete all its belonging pages (documents)
   * @param {String} oriFilePath original file path (i.e. if a pdf was generated from a docx, the docx file is the original one)
   * @returns {Promise<Array<Doc>>}
   *
   * @example
   * // each "Doc" is in following structure
   * {
   *   fileId,                    // an identifier generated from the raw file path (i.e. if "test.pdf" is generated from "test.docx", they share the same fileId)
   *   docId,                     // an identifier of the document (page)
   *   oriFilePath,               // original file path
   *   pageIdx,                   // page index (starting from 1)
   *   imgPath,                   // path of the corresponding png file. This is for front-end application to retrieve image
   * }
   *
   */
  deleteFile({ oriFilePath }) {
    return (
      this.getFilePages(oriFilePath)
        .then((docs) => (
          PromiseUtil
            .tolerateAllAndKeepResolved(docs.map(({ docId }) => this.deleteDoc({ docId })))
            .then(() => docs)
        ))
    );
  }

  /**
   * Create or update a page (document) and compute term correlation scores related to it
   * @param {Doc} doc an object describing the page (document)
   * @returns {Promise<any>}
   *
   * @example
   * // the "Doc" is in following structure
   * {
   *   fileId,                    // an identifier generated from the raw file path (i.e. if "test.pdf" is generated from "test.docx", they share the same fileId)
   *   docId,                     // an identifier of the document (page)
   *   oriFilePath,               // original file path
   *   pageIdx,                   // page index (starting from 1)
   *   imgPath,                   // path of the corresponding png file. This is for front-end application to retrieve image
   *   termFreqDict: {            // a mapping from terms to their occurrences (term frequency) in the page
   *     [term]: term_frequency,
   *     ...
   *   },
   * }
   *
   */
  updatePage({ docId, termFreqDict, ...params }) {
    return (
      this
        .updateDoc({ docId, ...params })
        .then(() => PromiseUtil.tolerateAllAndKeepResolved(
          Object.entries(termFreqDict).map(
            ([term, tf]) => (
              this
                .updateTermFreq({ docId, term, tf })
                // workaround: disable term-correlation computation for now
                // TODO: improve term-correlation computation
                // .then(() => this.updateTermCorrelations({ term }))
            ),
          ),
        ))
    );
  }

  /**
   * Compute and update correlations between a term and all others
   * @param {String} term
   * @returns {Promise<any>}
   */
  updateTermCorrelations({ term }) {
    return (
      // get all documents containing this term
      this.getDocsByTerm({ term })
        .then((docs) => (
          // for each document, get all of its terms
          PromiseUtil.tolerateAllAndKeepResolved(docs.map(({ docId }) => this.getTermsByDoc({ docId })))
        ))
        // concatenate the resulted term lists into a single list
        // filter out the term itself and deduplicate repeated terms
        .then((termss) => [...new Set([].concat(...termss).filter(((t) => t !== term)))])
        .then((terms) => PromiseUtil.tolerateAllAndKeepResolved(terms.map(
          // compute and update term correlation
          (t) => this.computeTermCorrelation(t, term)
            .then((tcr) => this.updateTermCorrelation({ terms: [t, term], tcr })),
        )))
    );
  }

  /**
   * Update correlation between 2 terms
   * @param {object} param
   * @param {Array<String>} param.terms [term1, term2]
   * @param {number} param.tcr correlation between term1 and term2
   * @returns {Promise<any>}
   */
  updateTermCorrelation({ terms, tcr }) {
    return (
      PromiseUtil.tolerateAllAndKeepResolved([
        this.dbClient
          .db(AppConfig.MONGO_DB.DB_NAME)
          .collection(AppConfig.MONGO_DB.COLLECTION_NAME.TERM_CORRELATIONS)
          .updateOne(
            { term1: terms[0], term2: terms[1] },
            { $set: { term1: terms[0], term2: terms[1], tcr } },
            { upsert: true },
          )
          .catch((err) => {
            console.log('ERROR [DbInterface.updateTermCorrelation]: ', err);
            return Promise.resolve();
          }),
        this.dbClient
          .db(AppConfig.MONGO_DB.DB_NAME)
          .collection(AppConfig.MONGO_DB.COLLECTION_NAME.TERM_CORRELATIONS)
          .updateOne(
            { term1: terms[1], term2: terms[0] },
            { $set: { term1: terms[1], term2: terms[0], tcr } },
            { upsert: true },
          )
          .catch((err) => {
            console.log('ERROR [DbInterface.updateTermCorrelation]: ', err);
            return Promise.resolve();
          }),
      ])
    );
  }

  /**
   * Create or update a page (document)
   * @param {Doc} doc an object describing the page (document)
   * @returns {Promise<any>}
   *
   * @example
   * // the "Doc" is in following structure
   * {
   *   fileId,                    // an identifier generated from the raw file path (i.e. if "test.pdf" is generated from "test.docx", they share the same fileId)
   *   docId,                     // an identifier of the document (page)
   *   oriFilePath,               // original file path
   *   pageIdx,                   // page index (starting from 1)
   *   imgPath,                   // path of the corresponding png file. This is for front-end application to retrieve image
   * }
   *
   */
  updateDoc({ docId, ...params }) {
    return (
      this.dbClient
        .db(AppConfig.MONGO_DB.DB_NAME)
        .collection(AppConfig.MONGO_DB.COLLECTION_NAME.DOCS)
        .updateOne(
          { docId },
          { $set: { docId, ...params } },
          { upsert: true },
        )
        .catch((err) => {
          console.log('ERROR [DbInterface.updateDoc]: ', err);
          return Promise.resolve();
        })
    );
  }

  /**
   * Get a document (page) by its docId
   * @param {object} param
   * @param {String} param.docId
   * @returns {Promise<Doc>}
   *
   * @example
   * // the "Doc" is in following structure
   * {
   *   fileId,                    // an identifier generated from the raw file path (i.e. if "test.pdf" is generated from "test.docx", they share the same fileId)
   *   docId,                     // an identifier of the document (page)
   *   oriFilePath,               // original file path
   *   pageIdx,                   // page index (starting from 1)
   *   imgPath,                   // path of the corresponding png file. This is for front-end application to retrieve image
   * }
   *
   */
  getDocById({ docId }) {
    return (
      this.dbClient
        .db(AppConfig.MONGO_DB.DB_NAME)
        .collection(AppConfig.MONGO_DB.COLLECTION_NAME.DOCS)
        .findOne({ docId })
        .catch((err) => {
          console.log('ERROR [DbInterface.getDocById]: ', err);
          return Promise.resolve(null);
        })
    );
  }

  /**
   * Get all documents (pages) containing a term, also return the term frequency of this term in each document
   * @param {object} param
   * @param {String} param.term
   * @returns {Promise<Array<DocWithTf>>}
   *
   * @example
   * // the "DocWithTf" is in following structure
   * {
   *   fileId,                    // an identifier generated from the raw file path (i.e. if "test.pdf" is generated from "test.docx", they share the same fileId)
   *   docId,                     // an identifier of the document (page)
   *   oriFilePath,               // original file path
   *   pageIdx,                   // page index (starting from 1)
   *   imgPath,                   // path of the corresponding png file. This is for front-end application to retrieve image
   *   tf,                        // term frequency (i.e. occurrences of this term in the document)
   * }
   *
   */
  getDocsByTerm({ term }) {
    return (
      this.dbClient
        .db(AppConfig.MONGO_DB.DB_NAME)
        .collection(AppConfig.MONGO_DB.COLLECTION_NAME.TERM_FREQS)
        .find({ term })
        .toArray()
        .then(
          (entries) => (
            PromiseUtil
              .tolerateAllAndKeepResolved(
                entries.map(
                  ({ docId, tf }) => (
                    this
                      .getDocById({ docId })
                      .then((doc) => ({ ...doc, tf }))
                  ),
                ),
              )
          ),
        )
        .catch((err) => {
          console.log('ERROR [DbInterface.getDocsByTerm]: ', err);
          return Promise.resolve([]);
        })
    );
  }

  /**
   * Delete a document (page) by its docId
   * @param {object} param
   * @param {String} param.docId
   * @returns {Promise<any>}
   */
  deleteDoc({ docId }) {
    return (
      PromiseUtil.tolerateAllAndKeepResolved([
        this.dbClient
          .db(AppConfig.MONGO_DB.DB_NAME)
          .collection(AppConfig.MONGO_DB.COLLECTION_NAME.DOCS)
          .deleteMany({ docId })
          .catch((err) => {
            console.log('ERROR [DbInterface.deleteDoc]: ', err);
            return Promise.resolve();
          }),
        this.dbClient
          .db(AppConfig.MONGO_DB.DB_NAME)
          .collection(AppConfig.MONGO_DB.COLLECTION_NAME.TERM_FREQS)
          .deleteMany({ docId })
          .catch((err) => {
            console.log('ERROR [DbInterface.deleteDoc]: ', err);
            return Promise.resolve();
          }),
      ])
    );
  }

  /**
   * Update term frequency (i.e. occurrences of a term in a document)
   * @param {object} param
   * @param {String} param.docId
   * @param {String} param.term
   * @param {number} param.tf term frequency
   * @returns {Promise<any>}
   */
  updateTermFreq({ docId, term, tf }) {
    return (
      this.dbClient
        .db(AppConfig.MONGO_DB.DB_NAME)
        .collection(AppConfig.MONGO_DB.COLLECTION_NAME.TERM_FREQS)
        .updateOne(
          { docId, term },
          { $set: { docId, term, tf } },
          { upsert: true },
        )
        .catch((err) => {
          console.log('ERROR [DbInterface.updateTermFreq]: ', err);
          return Promise.resolve();
        })
    );
  }

  /**
   * Get all terms occurring in a document
   * @param {object} param
   * @param {String} param.docId
   * @returns {Promise<Array<String>>} promise with a list of terms
   */
  getTermsByDoc({ docId }) {
    return (
      this.dbClient
        .db(AppConfig.MONGO_DB.DB_NAME)
        .collection(AppConfig.MONGO_DB.COLLECTION_NAME.TERM_FREQS)
        .find({ docId })
        .toArray()
        .then((entries) => entries.map(({ term }) => term))
        .catch((err) => {
          console.log('ERROR [DbInterface.getTermsByDoc]: ', err);
          return Promise.resolve([]);
        })
    );
  }

  /**
   * Given a term ,find the terms with highest correlation to it
   * @param {object} param
   * @param {String} param.term
   * @param {number} num maximum number of closest terms to return
   * @returns {Promise<Array<{term, tcr}>>} promise with a list of terms with term correlation (tcr)
   */
  findClosestTerms({ term }, num = 5) {
    return (
      this.dbClient
        .db(AppConfig.MONGO_DB.DB_NAME)
        .collection(AppConfig.MONGO_DB.COLLECTION_NAME.TERM_CORRELATIONS)
        .find({ term1: term })
        .sort({ tcr: -1 })
        .toArray()
        .then((entries) => entries.map(({ term2, tcr }) => ({ term: term2, tcr }).slice(0, num)))
        .catch((err) => {
          console.log('ERROR [DbInterface.findClosestTerms]: ', err);
          return Promise.resolve([]);
        })
    );
  }

  /**
   * Compute correlation between 2 terms. The computation is based on cosine similarity metric
   * @param {String} term1
   * @param {String} term2
   * @returns {Promise<number>}
   */
  computeTermCorrelation(term1, term2) {
    return PromiseUtil
      .tolerateAllAndKeepResolved([
        this.dbClient
          .db(AppConfig.MONGO_DB.DB_NAME)
          .collection(AppConfig.MONGO_DB.COLLECTION_NAME.TERM_FREQS)
          .find({ term: term1 })
          .toArray()
          .catch((err) => {
            console.log('ERROR [DbInterface.computeTermCorrelation]: ', err);
            return Promise.resolve([]);
          }),
        this.dbClient
          .db(AppConfig.MONGO_DB.DB_NAME)
          .collection(AppConfig.MONGO_DB.COLLECTION_NAME.TERM_FREQS)
          .find({ term: term2 })
          .toArray()
          .catch((err) => {
            console.log('ERROR [DbInterface.computeTermCorrelation]: ', err);
            return Promise.resolve([]);
          }),
      ])
      .then(([entries1, entries2]) => {
        let accumScore = 0;
        entries1.forEach(({ docId: docId1, tf: tf1 }) => {
          const { tf: tf2 } = entries2.find(({ docId: docId2 }) => docId1 === docId2) || {};
          accumScore += (tf1 || 0) * (tf2 || 0);
        });
        const length1 = Math.sqrt(entries1.reduce((total, { tf }) => (total + tf * tf), 0)) || 1;
        const length2 = Math.sqrt(entries2.reduce((total, { tf }) => (total + tf * tf), 0)) || 1;
        return accumScore / length1 / length2;
      })
      .catch((err) => {
        console.log('ERROR [DbInterface.computeTermCorrelation]: ', err);
        return Promise.resolve(0);
      });
  }

  /**
   * Update the search history. Insert timestamp and the string of termFreqDict.
   * @param {String} termFreqDictString
   * @param {String} query
   * @returns {Promise<any>}
   */
  updateSearchHistory(termFreqDictString, query) {
      return (
          PromiseUtil.tolerateAllAndKeepResolved([
            this.dbClient
              .db(AppConfig.MONGO_DB.DB_NAME)
              .collection(AppConfig.MONGO_DB.COLLECTION_NAME.SEARCH_HISTORY)
              .insertOne(
                  {
                    time: Date.now(),
                    search_terms: termFreqDictString,
                    search_query: query,
                  }
                )
                .catch((err) => {
                  console.log('ERROR [DbInterface.updateSearchHistory]: ', err);
                  return Promise.resolve();
                }),
            ])
          );
    }



}

export default new DbInterface();
