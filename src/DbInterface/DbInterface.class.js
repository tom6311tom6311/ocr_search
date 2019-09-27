import { MongoClient } from 'mongodb';
import AppConfig from '../../config/AppConfig.const';
import escapeRegExp from '../util/escapeRegExp.func';

class DbInterface {
  constructor() {
    this.dbClient = null;
    this.connectDb();
  }

  connectDb() {
    MongoClient.connect(
      AppConfig.MONGO_DB.URL,
      {
        poolSize: AppConfig.MONGO_DB.POOL_SIZE,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
      (error, dbClient) => {
        if (error) {
          console.error(`ERROR [DbInterface]: ${error}`);
        } else {
          this.dbClient = dbClient;
        }
      },
    );
  }

  updatePages(pages, callback = () => {}, failCallback = () => {}) {
    let numExecuted = 0;
    let numUpdated = 0;
    pages.forEach(({
      id,
      ...params
    }) => {
      this.dbClient
        .db(AppConfig.MONGO_DB.DB_NAME)
        .collection(AppConfig.MONGO_DB.COLLECTION_NAME)
        .updateOne(
          { id },
          { $set: { id, ...params } },
          { upsert: true },
          (error) => {
            numExecuted += 1;
            if (error) {
              console.log(`ERROR [DbInterface]: ${error}`);
            } else {
              numUpdated += 1;
            }
            if (numExecuted === pages.length) {
              if (numUpdated === numExecuted) callback();
              else failCallback();
            }
          },
        );
    });
  }

  deletePages(idPrefix, callback = () => {}, failCallback = () => {}) {
    this.dbClient
      .db(AppConfig.MONGO_DB.DB_NAME)
      .collection(AppConfig.MONGO_DB.COLLECTION_NAME)
      .deleteMany(
        { id: new RegExp(`^${escapeRegExp(idPrefix)}+`, 'g') },
        {},
        (error) => {
          if (error) {
            console.log(`ERROR [DbInterface]: ${error}`);
            failCallback();
          } else {
            callback();
          }
        },
      );
  }

  findPages(searchTerm, callback = () => {}, failCallback = () => {}) {
    this.dbClient
      .db(AppConfig.MONGO_DB.DB_NAME)
      .collection(AppConfig.MONGO_DB.COLLECTION_NAME)
      .find(
        { term: new RegExp(`${escapeRegExp(searchTerm).replace(' ', '|')}`, 'g') },
      )
      .toArray((error, pages) => {
        if (error) {
          console.log(`ERROR [DbInterface]: ${error}`);
          failCallback();
        } else {
          callback(pages);
        }
      });
  }
}

export default new DbInterface();
