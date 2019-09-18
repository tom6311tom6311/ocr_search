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
          res.send({
            pageList: TermMatcher.match(searchTerm),
          });
        }
      },
    ],
  },
];

export default ApiHandler;
