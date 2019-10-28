import { MongoClient } from 'mongodb';
import AppConfig from '../../config/AppConfig.const';

class DbInterface {
  constructor() {
    this.dbClient = null;
    this.connectDb()
      .then((dbClient) => {
        this.dbClient = dbClient;
      })
      .catch((error) => {
        console.error(`ERROR [DbInterface]: ${error}`);
      });
  }

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

  updateFile({ pages }) {
    return Promise.all(
      pages.map((page) => this.updatePage(page)),
    );
  }

  getFilePages(oriFilePath) {
    return (
      this.dbClient
        .db(AppConfig.MONGO_DB.DB_NAME)
        .collection(AppConfig.MONGO_DB.COLLECTION_NAME.DOCS)
        .find({ oriFilePath })
        .toArray()
    );
  }

  deleteFile({ oriFilePath }) {
    return (
      this.getFilePages(oriFilePath)
        .then((docs) => (
          Promise
            .all(docs.map(({ docId }) => this.deleteDoc({ docId })))
            .then(() => docs)
        ))
    );
  }

  updatePage({ docId, termFreqDict, ...params }) {
    return (
      this
        .updateDoc({ docId, ...params })
        .then(() => Promise.all(
          Object.entries(termFreqDict).map(
            ([term, tf]) => (
              this
                .updateTermFreq({ docId, term, tf })
                .then(() => this.updateTermCorrelations({ term }))
            ),
          ),
        ))
    );
  }

  updateTermCorrelations({ term }) {
    return (
      this.getDocsByTerm({ term })
        .then((docs) => (
          Promise.all(docs.map(({ docId }) => this.getTermsByDoc({ docId })))
        ))
        .then((termss) => [].concat(...termss).filter(((t) => t !== term)))
        .then((terms) => Promise.all(terms.map(
          (t) => this.computeTermCorrelation(t, term)
            .then((tcr) => this.updateTermCorrelation({ terms: [t, term], tcr })),
        )))
    );
  }

  updateTermCorrelation({ terms, tcr }) {
    return (
      Promise.all([
        this.dbClient
          .db(AppConfig.MONGO_DB.DB_NAME)
          .collection(AppConfig.MONGO_DB.COLLECTION_NAME.TERM_CORRELATIONS)
          .updateOne(
            { term1: terms[0], term2: terms[1] },
            { $set: { term1: terms[0], term2: terms[1], tcr } },
            { upsert: true },
          ),
        this.dbClient
          .db(AppConfig.MONGO_DB.DB_NAME)
          .collection(AppConfig.MONGO_DB.COLLECTION_NAME.TERM_CORRELATIONS)
          .updateOne(
            { term1: terms[1], term2: terms[0] },
            { $set: { term1: terms[1], term2: terms[0], tcr } },
            { upsert: true },
          ),
      ])
    );
  }

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
    );
  }

  getDocById({ docId }) {
    return (
      this.dbClient
        .db(AppConfig.MONGO_DB.DB_NAME)
        .collection(AppConfig.MONGO_DB.COLLECTION_NAME.DOCS)
        .findOne({ docId })
    );
  }

  getDocsByTerm({ term }) {
    return (
      this.dbClient
        .db(AppConfig.MONGO_DB.DB_NAME)
        .collection(AppConfig.MONGO_DB.COLLECTION_NAME.TERM_FREQS)
        .find({ term })
        .toArray()
        .then(
          (entries) => (
            Promise.all(
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
    );
  }

  deleteDoc({ docId }) {
    return (
      Promise.all([
        this.dbClient
          .db(AppConfig.MONGO_DB.DB_NAME)
          .collection(AppConfig.MONGO_DB.COLLECTION_NAME.DOCS)
          .deleteMany({ docId }),
        this.dbClient
          .db(AppConfig.MONGO_DB.DB_NAME)
          .collection(AppConfig.MONGO_DB.COLLECTION_NAME.TERM_FREQS)
          .deleteMany({ docId }),
      ])
    );
  }

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
    );
  }

  getTermsByDoc({ docId }) {
    return (
      this.dbClient
        .db(AppConfig.MONGO_DB.DB_NAME)
        .collection(AppConfig.MONGO_DB.COLLECTION_NAME.TERM_FREQS)
        .find({ docId })
        .toArray()
        .then((entries) => entries.map(({ term }) => term))
    );
  }

  findClosestTerms({ term }, num = 5) {
    return (
      this.dbClient
        .db(AppConfig.MONGO_DB.DB_NAME)
        .collection(AppConfig.MONGO_DB.COLLECTION_NAME.TERM_CORRELATIONS)
        .find({ term1: term })
        .sort({ tcr: -1 })
        .toArray()
        .then((entries) => entries.map(({ term2, tcr }) => ({ term: term2, tcr }).slice(0, num)))
    );
  }

  computeTermCorrelation(term1, term2) {
    return Promise
      .all([
        this.dbClient
          .db(AppConfig.MONGO_DB.DB_NAME)
          .collection(AppConfig.MONGO_DB.COLLECTION_NAME.TERM_FREQS)
          .find({ term: term1 })
          .toArray(),
        this.dbClient
          .db(AppConfig.MONGO_DB.DB_NAME)
          .collection(AppConfig.MONGO_DB.COLLECTION_NAME.TERM_FREQS)
          .find({ term: term2 })
          .toArray(),
      ])
      .then(([entries1, entries2]) => {
        let accumScore = 0;
        entries1.forEach(({ docId: docId1, tf: tf1 }) => {
          const { tf: tf2 } = entries2.find(({ docId: docId2 }) => docId1 === docId2) || {};
          accumScore += (tf1 || 0) * (tf2 || 0);
        });
        return accumScore;
      });
  }
}

export default new DbInterface();
