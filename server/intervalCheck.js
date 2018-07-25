import { UserStatus } from 'meteor/mizzao:user-status';

import { debug } from '/server/imports/utils/debug';


// 週期檢查工作內容
export function doIntervalWork() {
  debug.log('doIntervalWork');
  debug.clean();
  // 移除沒有IP地址的user connections
  UserStatus.connections.remove({ ipAddr: { $exists: false } });
}

