import { UserStatus } from 'meteor/mizzao:user-status';

import { debug } from '/server/imports/utils/debug';

//週期檢查工作內容
export function doIntervalWork() {
  debug.log('doIntervalWork');
  //移除所有debug紀錄
  debug.clean();
  //移除沒有IP地址的user connections
  UserStatus.connections.remove({
    ipAddr: {
      $exists: false
    }
  });
}
