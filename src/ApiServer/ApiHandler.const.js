import express from 'express';
import TermMatcher from '../TermMatcher/TermMatcher.class';

const ApiHandler = [
  {
    method: 'get',
    path: '/pages',
    handlers: [
      (req, res) => {
        const { searchTerm } = req.query;
        if (typeof searchTerm !== 'string') {
          res.status(400).send({ message: 'search term is not specified or is in wrong format' });
        } else {
          TermMatcher.match(
            searchTerm,
            (pageList) => {
              res.end(JSON.stringify({
                pageList: pageList.map(({ oriFilePath, pageIdx, imgPath }) => ({ oriFilePath, pageIdx, imgPath })),
              }));
            },
            () => {
              res.status(500).send({ message: 'internal server error' });
            },
          );
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
