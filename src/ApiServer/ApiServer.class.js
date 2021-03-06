import express from 'express';
import ApiHandler from './ApiHandler.const';

/**
 * An API server instance taking care of handling client requests
 * @param {func} app an express server instance [>> ref <<](http://expressjs.com/en/api.html)
 */
class ApiServer {
  constructor() {
    this.app = null;
  }

  /**
   * start the API server
   * @param {number} port the port on which the API server will listen
   */
  start(port) {
    this.app = express();
    this.app.use(express.json());
    ApiHandler.forEach(({ method, path, handlers }) => {
      this.app[method](path, ...handlers);
    });
    this.app.listen(
      port,
      () => {
        console.log(`INFO [ApiServer.start]: start listening on port ${port}`);
      },
    );
  }
}

export default ApiServer;
