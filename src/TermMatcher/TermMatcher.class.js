import DbInterface from '../DbInterface/DbInterface.class';

class TermMatcher {
  static match(searchTerms) {
    return Promise
      .all(searchTerms.map((term) => DbInterface.findClosestTerms({ term })))
      .then((termss) => ([...new Set(searchTerms.map((term) => ({ term, tcr: 1 })).concat(...termss))]))
      .then((expandedTerms) => (
        Promise.all(
          expandedTerms.map(
            ({ term, tcr }) => (
              DbInterface
                .getDocsByTerm({ term })
                .then((docs) => (
                  docs.map(({ tf, ...doc }) => ({ ...doc, score: tcr * tf }))
                ))
            ),
          ),
        )
      ))
      .then((docss) => [].concat(...docss))
      .then((docs) => docs.sort((a, b) => b.score - a.score));
  }
}

export default TermMatcher;
