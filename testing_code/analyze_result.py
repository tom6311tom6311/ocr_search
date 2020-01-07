import json
import numpy as np

with open('bm25sesult.json', 'r') as jsonfile:
    bm25 = json.load(jsonfile)

#print(bm25.keys())

numCount = np.zeros(20)
numAverage = np.zeros(20)
for k in bm25.keys():
    #print(k)
    for num in bm25[k].keys():
    #    print('num', num, np.mean(bm25[k][num]))
        n = int(num)-1
        numAverage[n] += np.mean(bm25[k][num])
        numCount[n] = numCount[n]+1

for i in range(20):
    print(numAverage[i]/numCount[i], numCount[i], i+1)

