import express from 'express';
import TermMatcher from '../TermMatcher/TermMatcher.class';
import TermExtractor from '../TermExtractor/TermExtractor.class';

const ApiHandler = [
  {
    method: 'get',
    path: '/pages',
    handlers: [
      (req, res) => {
        const { searchTerm: query } = req.query;
        if (typeof query !== 'string') {
          res.status(400).send({ message: 'search term is not specified or is in wrong format' });
        } else {
          TermExtractor
            .extractFromQuery(query)
            .then((searchTerms) => TermMatcher.match(searchTerms))
            .then((pageList) => {
              res.end(JSON.stringify({
                pageList: pageList.map(({ oriFilePath, pageIdx, imgPath }) => ({ oriFilePath, pageIdx, imgPath })),
              }));
            })
            .catch((error) => {
              console.log(`ERROR [ApiHandler]: ${error}`);
              res.status(500).send({ message: 'internal server error' });
            });
        }
      },
    ],
  },
  {
    method: 'use',
    path: '/pageImg',
    handlers: [
      express.static('data/png'),
    ],
  },
];

export default ApiHandler;
