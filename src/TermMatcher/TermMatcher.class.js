import DbInterface from '../DbInterface/DbInterface.class';
import PromiseUtil from '../util/PromiseUtil.const';

/**
 * An class handling term matching, which is the core functionality of search API
 */
class TermMatcher {
  /**
   * Match search terms with documents (pages)
   * @param {Array<String>} searchTerms an array of tokenized search terms originated from user query
   * @returns {Promise<Array<doc>>} promise with returned array of documents, sorted by correlation score between it and the user query
   *
   * @example
   * // each doc is in following structure
   * {
   *   fileId,                    // an identifier generated from the raw file path (i.e. if "test.pdf" is generated from "test.docx", they share the same fileId)
   *   docId,                     // an identifier of the document (page)
   *   oriFilePath,               // original file path
   *   pageIdx,                   // page index (starting from 1)
   *   imgPath,                   // path of the corresponding png file. This is for front-end application to retrieve image
   *   score,                     // the correlation score between the document and the user query
   * }
   *
   */
  static match(searchTerms) {
    // for each search term, find its related documents and compute correlation score
    const scoreType = "BM25";
    //scoreType = "tfidf"
    if (scoreType == "simpleMatch") {
 
      return PromiseUtil
      .tolerateAllAndKeepResolved(
        searchTerms.map(
         (term) => (
            DbInterface
              .getDocsByTerm({ term })
              .then((docs) => (
                docs.map(({ tf, ...doc }) => ({ ...doc, score: tf }))
              ))
          ),
        ),
      )
      // merge all lists of documents found into a single list
      .then((docss) => {
        const docDict = {};
        const docsRaw = [].concat(...docss);
        docsRaw.forEach((doc) => {
          if (docDict[doc.docId] === undefined) {
           docDict[doc.docId] = doc;
          } else if (docDict[doc.docId].score < doc.score) {
            docDict[doc.docId].score = doc.score;
          }
        });
        return Object.values(docDict);
      })
      // sort the resulting documents by correlation score
      .then((docs) => docs.sort((a, b) => b.score - a.score));
    
    } else if ( scoreType  == "tfidf" ) {

       return DbInterface.getAllDocNum()
              .then((DocNum) => (
              PromiseUtil
    	      .tolerateAllAndKeepResolved(
     	        searchTerms.map(
                 ( term ) =>  (
 		   DbInterface
                    .getDocsByTerm({ term })
                    .then((docs) => (
       		         docs.map(({ tf, docId, allTermNum, ...doc }) => 		             
   		             ({ ...doc, docId,score: Math.log10( DocNum / (1+docs.length) ) * tf / allTermNum})			 
 		         )
  		     )
		   ) 
                 ),
                ),
               )
            ))
       // merge all lists of documents found into a single list
          .then((docss) => [].concat(...docss))
       // sort the resulting documents by correlation score
          .then((docs) => {
	    const docSumScore = {}
            for ( var i=0; i < docs.length; i++ ){
              if (Object.keys(docSumScore).includes(docs[i]['docId'])) {
                docSumScore[docs[i]['docId']]['score'] += docs[i]['score']
              }
              else{
                docSumScore[docs[i]['docId']] = docs[i];
	      }
	    }
	    return Object.values(docSumScore).sort((a, b) => b.score - a.score);
	  });
    } else if ( scoreType  == "BM25" ) {
       const k = 1.5;
       const b = 0.75;
       return DbInterface.getAllDocNum()
                .then((DocNum) => (
                PromiseUtil
                .tolerateAllAndKeepResolved(
                searchTerms.map(
                 ( term ) =>  (
                    DbInterface
                     .getDocsByTerm({ term })
                     .then((docs) => {
		       var avgdl = 0;
		       for ( var i=0; i < docs.length; i++ ){
		         avgdl += docs[i]['allTermNum'];
		       }
                       avgdl = avgdl/docs.length;
		       return (docs.map(({ tf, docId, allTermNum, ...doc }) => {
			 // console.log(Math.log10((DocNum - docs.length +0.5) / (docs.length + 0.5)) * (tf * (k+1)) / (tf + (k*(1-b+b*allTermNum/avgdl))));
			 return ({ ...doc, docId, score: Math.log10((DocNum - docs.length +0.5) / (docs.length + 0.5)) * (tf * (k+1)) / (tf + (k*(1-b+b*allTermNum/avgdl)))  })
                         
		         }
		       ))
                     }
                     )
                  ),
                ),
                )
              ))
           // merge all lists of documents found into a single list
              .then((docss) => [].concat(...docss))
           // sort the resulting documents by correlation score
              .then((docs) => {
                const docSumScore = {}
		for ( var i=0; i < docs.length; i++ ){
		  if (Object.keys(docSumScore).includes(docs[i]['docId'])) {
	            docSumScore[docs[i]['docId']]['score'] += docs[i]['score']
		  }  
		  else{
                    docSumScore[docs[i]['docId']] = docs[i];
		  }
		}
		return Object.values(docSumScore).sort((a, b) => b.score - a.score)
	      });
    }
	
  }
}

export default TermMatcher;
