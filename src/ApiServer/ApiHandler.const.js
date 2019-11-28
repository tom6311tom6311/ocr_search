import express from 'express';
import AppConfig from '../../config/AppConfig.const';
import TermMatcher from '../TermMatcher/TermMatcher.class';
import Tokenizer from '../Tokenizer/Tokenizer.class';
import DbInterface from '../DbInterface/DbInterface.class';

/**
 * A list of API handlers defining how server should response given a http request.
 * The API reference can be found in README
 */
const ApiHandler = [
  {
    method: 'get',
    path: '/pages',
    /**
     * The search-pages API letting user search for pages by keywords
     */
    handlers: [
      (req, res) => {
        const { searchTerm: query, maxReturn } = req.query;
        if (typeof query !== 'string') {
          res.status(400).send({ message: 'search term is not specified or is in wrong format' });
        } else if (maxReturn !== undefined && !new RegExp(/^[1-9]\d*$/).test(maxReturn)) {
          res.status(400).send({ message: 'maxReturn should be a positive integer' });
        } else {
          // tokenize terms from query and then match them with pages in the DB.
          // Return a list of related pages, sorted by correlation (from high to low)
          Tokenizer
            .tokenize(query)
            .then((termFreqDict) => {
              const termFreqDictString = JSON.stringify(termFreqDict);
              DbInterface.updateSearchHistory(termFreqDictString);
	      return Object.keys(termFreqDict);
	    })
            .then((searchTerms) => TermMatcher.match(searchTerms))
            .then((pageList) => {
              res.end(JSON.stringify({
                pageList: pageList.map(({ oriFilePath, pageIdx, imgPath }) => ({ oriFilePath, pageIdx, imgPath })).slice(0, parseInt(maxReturn, 10) || AppConfig.API_SERVER.NUM_SEARCH_RETURN),
              }));
            })
            .catch((err) => {
              console.log('ERROR [ApiHandler.get.pages]: ', err);
              res.status(500).send({ message: 'internal server error' });
            });
        }
      },
    ],
  },
  {
    method: 'use',
    path: '/pageImg',
    /**
     * The get-page-image API letting user download page image given a path returned by the search-pages API
     */
    handlers: [
      express.static('data/png'),
    ],
  },
];

export default ApiHandler;
