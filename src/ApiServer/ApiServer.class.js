import express from 'express';
import ApiHandler from './ApiHandler.const';

class ApiServer {
  constructor() {
    this.app = null;
  }

  start(port) {
    this.app = express();
    this.app.use(express.json());
    ApiHandler.forEach(({ method, path, handlers }) => {
      this.app[method](path, ...handlers);
    });
    this.app.listen(
      port,
      () => {
        console.log(`INFO [ApiServer]: start listening on port ${port}`);
      },
    );
  }
}

export default ApiServer;
