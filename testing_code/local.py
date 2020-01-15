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

cursor = collection.find({'docId': 'e610d309fc505c86246366e8b37f72291d88c679df842175b62d45a708382dd2'})

#cursor = collection.find().distinct("docId")
docIds = [d for d in cursor]

termList = []
for doc in docIds:
    termList.append(doc['term'])
print(termList)
result = []

for tNum in tqdm(range(1,21)):
    resTime = 0
    for re in range(20):
        random.seed(tNum*100+re)
        testTerms = random.sample(termList,tNum)
        to_search = ' '.join(testTerms)
        #print(to_search)
        url = "http://localhost:7055/pages?searchTerm='{}'".format(to_search)
        st = time.time()
        r = requests.get(url, verify=False)
        et = time.time()
        resTime += (et-st)
    result.append(resTime*1000/20)


print(result)
