// 博物館 資料處理

print(db.resourceLock.remove({}));
printjson(db.users.updateMany({}, { $set: { 'services': {} } }));
printjson(db.violationCases.updateMany({}, { $set: { informer: '' } }));
printjson(db.violationCaseActionLogs.updateMany({ action: 'informerComment' }, { $set: { executor: '' } }));