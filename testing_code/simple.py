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

with open('simple.json', 'r') as jsonfile:
    result = json.load(jsonfile)

with open('bm25sesult.json', 'r') as jsonfile:
    bm25 = json.load(jsonfile)

with open('trainingDataDict.json', 'r') as jsonfile:
    trainingDataDict = json.load(jsonfile)

def ndcg(l, ans):
    dcg = 0
    for i in range(1,len(l)+1):
        if l[i-1] == ans:
            dcg += 1/math.log2(i+1)
    return dcg

for docId in bm25.keys():
    if docId in result.keys():
        print("docId:",docId,"already exists")
        continue
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
    with open('simple.json', 'w') as jsonfile:
        json.dump(result, jsonfile)

