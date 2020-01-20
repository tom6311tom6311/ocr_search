import { spawn } from 'child_process';
import AppConfig from '../../config/AppConfig.const';
import TaskQueueManager from '../util/TaskQueueManager.class';

/**
 * An instance handling tokenization of terms from a string
 * @param {TaskQueueManager} taskManager a task manager making sure that tasks are done one after another
 */
class Tokenizer {
  constructor() {
    this.taskManager = new TaskQueueManager(AppConfig.TOKENIZE.TIMEOUT);
  }

  /**
   * Tokenize a string
   * @param {String} rawText the string to be tokenized, which can be in English, Chinese, or mixed
   * @returns {Promise<TermFreqDict>}
   *
   * @example
   * // a "TermFreqDict" object is a mapping from terms to their occurrences (term frequency) in rawText
   * // a "TermFreqDict" object is in following structure
   * {
   *   [term]: term_frequency,
   *   ...
   * }
   *
   */
  tokenize(rawText) {
    return new Promise((resolve) => {
      this.taskManager.registerTask({
        job: (cb) => {
          try {
            // strip strange characters and leading/lagging spaces;
            // then convert to lower case and perform tokenization and stemming on it by calling
            // "src/py/tokenize_and_stem.py"
            const text = rawText
              .replace(/|•|、/g, '').replace(/^ +| +$/g, '')
              .toLowerCase();
            const bufs = [];
            const tokenizingProcess = spawn('python3', ['src/py/tokenize_and_stem.py', text]);
            tokenizingProcess.stdout.on('data', (buf) => {
              // push the received buffer to an array instead of parse it immediately.
              // thprint(tokenlize('apple'))
	      // is is to avoid the case that output data size exceeds stdout limit
              // and being segmented forcibly
              bufs.push(buf);
            });
            // tokenizingProcess.stderr.on('data', (err) => {
            //   console.log('WARNING [Tokenizer.tokenize]: ', err.toString());
            // });
            tokenizingProcess.on('exit', () => {
              try {
                // concatenate the buffers and try to parse it as a JSON string
                const termFreqDict = JSON.parse(Buffer.concat(bufs).toString());
                resolve(termFreqDict);
                cb();
              } catch (err) {
                console.log('ERROR [Tokenizer.tokenize]: ', err);
                console.log('ERROR [Tokenizer.tokenize]: data returned from tokenizing process: ', Buffer.concat(bufs).toString());
                resolve({});
                cb();
              }
            });
          } catch (err) {
            console.log('ERROR [Tokenizer.tokenize]: ', err);
            resolve({});
            cb();
          }
        },
        failCallback: () => {
          console.log('ERROR [Tokenizer.tokenize]: timeout during tokenization');
          resolve({});
        },
      });
    });
  }
  
  
  tokenizeFromServer(rawText) {
    return new Promise((resolve) => {
      this.taskManager.registerTask({
        job: (cb) => {
          try {
            // strip strange characters and leading/lagging spaces;
            // then convert to lower case and perform tokenization and stemming on it by calling
            // "src/py/tokenize_and_stem.py"
            const text = rawText
              .replace(/|•|、/g, '').replace(/^ +| +$/g, '')
              .toLowerCase();
            const bufs = [];
	        const tokenizingProcess = spawn('curl', ['http://localhost:4567/"'+text+'"']);
            tokenizingProcess.stdout.on('data', (buf) => {
              // push the received buffer to an array instead of parse it immediately.
              // thprint(tokenlize('apple'))
	      // is is to avoid the case that output data size exceeds stdout limit
              // and being segmented forcibly
              bufs.push(buf);
            });
            // tokenizingProcess.stderr.on('data', (err) => {
            //   console.log('WARNING [Tokenizer.tokenize]: ', err.toString());
            // });
            tokenizingProcess.on('exit', () => {
              try {
                // concatenate the buffers and try to parse it as a JSON string
                const termFreqDict = JSON.parse(Buffer.concat(bufs).toString());
                resolve(termFreqDict);
                cb();
              } catch (err) {
                console.log('ERROR [Tokenizer.tokenize]: ', err);
                console.log('ERROR [Tokenizer.tokenize]: data returned from tokenizing process: ', Buffer.concat(bufs).toString());
                resolve({});
                cb();
              }
            });
          } catch (err) {
            console.log('ERROR [Tokenizer.tokenize]: ', err);
            resolve({});
            cb();
          }
        },
        failCallback: () => {
          console.log('ERROR [Tokenizer.tokenize]: timeout during tokenization');
          resolve({});
        },
      });
    });
  }
}

export default new Tokenizer();
