/**
 * A bunch of utility functions handling promises.
 */

const PromiseUtil = {
  /**
   * Tolerate rejection of a promise by turning rejection into a resolved form (probably with error in failed cases)
   * @param {Promise<any>} promise the input promise to be tolerated
   * @returns {Promise<Result>} a new promise that will always be resolved
   *
   * @example
   * // a "Result" object is in following structure
   * {
   *   resolved,                  // a boolean flag indicating success or failure of the promise
   *   value,                     // the resolved value of the original promise. This would be undefined when resolved === false
   *   error,                     // the error of the original promise when it is rejected. This would be undefined when resolved === true
   * }
   *
   */
  tolerate: (promise) => (promise.then(
    (value) => ({ value, resolved: true }),
    (error) => ({ error, resolved: false }),
  )),
  /**
   * Equivalent to a "Promise.all" that will be resolved when ALL sub-promises are either resolved or rejected.
   * The rejection of sub-promises will be omitted while only resolved values will be brought back as arguments of the callback function.
   * @param {Array<Promise<any>>} array of sub-promises to be executed
   * @returns {Promise<Array<any>>} a promise with values of all the resolved sub-promises
   */
  tolerateAllAndKeepResolved: (promises) => (
    Promise
      .all(promises.map(PromiseUtil.tolerate))
      .then(
        (results) => (
          results.filter(({ resolved }) => resolved).map(({ value }) => value)
        ),
      )
  ),
};

export default PromiseUtil;
