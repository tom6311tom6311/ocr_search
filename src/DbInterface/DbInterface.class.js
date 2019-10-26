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
    const promises = [];
    pages.forEach(({
      docId,
      termFreqDict,
      ...params
    }) => {
      promises.push(
        this.updateDoc({ docId, ...params }),
      );
      Object.entries(termFreqDict).forEach(([
        term,
        tf,
      ]) => {
        promises.push(
          this.updateTermFreq({ docId, term, tf }),
        );
      });
    });
    return Promise.all(promises);
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
        .then((docs) => Promise.all(docs.map(({ docId }) => this.deleteDoc({ docId }))))
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
        .then((entries) => Promise.all(entries.map(({ docId }) => this.getDocById({ docId }))))
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
}

export default new DbInterface();
