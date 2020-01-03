import requests
import time
from pymongo import MongoClient
from bson.objectid import ObjectId
import random
from tqdm import tqdm
import json
import math

conn = MongoClient("mongodb://localhost:27017/")
db = conn.term_db
collection = db.term_freqs
'''
#cursor = collection.find({'docId': 'e610d309fc505c86246366e8b37f72291d88c679df842175b62d45a708382dd2'})
cursor = collection.find().distinct("docId")
docIds = [d for d in cursor]
print(len(docIds))
docTermDict = {}

for docId in tqdm(docIds):
    cur = collection.find({'docId': docId})
    terms = [c['term'] for c in cur]
    docTermDict[docId] = terms

with open('docIdTermsDict.json', 'w') as jsonfile:
    json.dump(docTermDict, jsonfile)
'''
'''
with open('docIdTermsDict.json', 'r') as jsonfile:
    data = json.load(jsonfile)



random.seed(1)
docIdsToUse = random.sample(data.keys(), int(len(data.keys())*0.8))


trainingDataDict = {}


for docIdToUse in tqdm(docIdsToUse):
    numTermsDict = {}
    for termNum in range(1, min(21, len(data[docIdToUse]))):
        termsList = []
        for randomTime in range(20):
            random.seed(100*termNum+randomTime)
            randonTerms = random.sample(data[docIdToUse], termNum)
            termsList.append(randonTerms)
        numTermsDict[termNum] = termsList
    trainingDataDict[docIdToUse] = numTermsDict

with open('trainingDataDict.json', 'w') as jsonfile:
    json.dump(trainingDataDict, jsonfile)
'''

with open('trainingDataDict.json', 'r') as jsonfile:
    trainingDataDict = json.load(jsonfile)

def ndcg(l, ans):
    dcg = 0
    for i in range(1,len(l)+1):
        if l[i-1] == ans:
            dcg += 1/math.log2(i+1)
    return dcg

result = {}
for docId in trainingDataDict.keys():
    testListDict = trainingDataDict[docId]
    numberScoreDict = {}
    for testListKey in tqdm(testListDict.keys()):
        ScoreList = []
        for testTerms in testListDict[testListKey]:
            to_search = ' '.join(testTerms)
            url = "http://localhost:7055/pages?searchTerm='{}'&maxReturn=2300".format(to_search)
            r = requests.get(url, verify=False)
            returnList = []
            for doc in  json.loads(r.text)['pageList']:
                if doc != {}:
                    returnList.append(doc['imgPath'][:-4])
            
            
            ScoreList.append(ndcg(returnList, docId))
        numberScoreDict[testListKey] = ScoreList
        
    result[docId] = numberScoreDict
    
    #print(result)
    with open('bm25sesult.json', 'w') as jsonfile:
        json.dump(result, jsonfile)

