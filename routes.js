import { FlowRouter } from 'meteor/kadira:flow-router';


export const pageNameHash = {
  mainPage: '首頁',
  announcementList: '系統公告',
  announcementDetail: '系統公告',
  tutorial: '遊戲規則',
  companyList: '股市總覽',
  companyDetail: '公司資訊',
  advertising: '廣告宣傳',
  productCenterBySeason: '產品中心',
  productCenterByCompany: '產品中心',
  arenaInfo: '最萌亂鬥大賽',
  seasonalReport: '季度報告',
  accountInfo: '帳號資訊',
  ruleAgendaList: '規則討論',
  ruleAgendaDetail: '議程資訊',
  violationCaseList: '違規案件列表',
  violationCaseDetail: '違規案件內容',
  fscLogs: '金管會執行紀錄',
  fscStock: '金管會持股'
};

/**
 * 由於 redirection 會使部分 FlowRouter 之 reactive API 失效，
 * 使用此 ReactiveVar 配合 trigger 來反應目前頁面的 route name，
 * 並在 code 中全面取代 `FlowRouter.getRouteName()`。
 *
 * @see https://github.com/kadirahq/flow-router/issues/463
 */
const rCurrentPage = new ReactiveVar();

FlowRouter.triggers.enter([(context) => {
  rCurrentPage.set(context.route.name);
}]);

export function getCurrentPage() {
  return rCurrentPage.get();
}

export function getPageTitle(pageName) {
  return pageNameHash[pageName];
}

export function getCurrentPageTitle() {
  return getPageTitle(getCurrentPage());
}

export function getCurrentPageFullTitle(detailName) {
  if (getCurrentPage() === 'mainPage') {
    return Meteor.settings.public.websiteInfo.websiteName;
  }

  let title = `${getCurrentPageTitle()} - ${Meteor.settings.public.websiteInfo.websiteName}`;
  if (detailName) {
    title = `${detailName} - ${title}`;
  }

  return title;
}

FlowRouter.route('/', { name: 'mainPage' });

const announcementRoute = FlowRouter.group({ prefix: '/announcement' });
announcementRoute.route('/', { name: 'announcementList' });
announcementRoute.route('/view/:announcementId', { name: 'announcementDetail' });
announcementRoute.route('/reject/:announcementId', { name: 'rejectAnnouncement' });

const violationRoute = FlowRouter.group({ prefix: '/violation' });
violationRoute.route('/', { name: 'violationCaseList' });
violationRoute.route('/report', { name: 'reportViolation' });
violationRoute.route('/view/:violationCaseId', { name: 'violationCaseDetail' });

FlowRouter.route('/fscLogs', { name: 'fscLogs' });

FlowRouter.route('/fscStock', { name: 'fscStock' });

FlowRouter.route('/tutorial', { name: 'tutorial' });

const companyRoute = FlowRouter.group({ prefix: '/company' });
companyRoute.route('/:page?', {
  name: 'companyList',
  triggersEnter: [(context, redirect) => {
    const page = parseInt(context.params.page, 10);

    if (! page || page < 0) {
      redirect(context.route.name, { page: 1 });
    }
  }]
});
companyRoute.route('/detail/:companyId', { name: 'companyDetail' });

const productCenterRoute = FlowRouter.group({ prefix: '/productCenter' });
productCenterRoute.route('/season/:seasonId', { name: 'productCenterBySeason' });
productCenterRoute.route('/company/:companyId', { name: 'productCenterByCompany' });

FlowRouter.route('/advertising', { name: 'advertising' });

FlowRouter.route('/arenaInfo/:arenaId?', { name: 'arenaInfo' });

FlowRouter.route('/seasonalReport/:seasonId?', { name: 'seasonalReport' });

FlowRouter.route('/accountInfo/:userId?', { name: 'accountInfo' });

const ruleDiscussRoute = FlowRouter.group({ prefix: '/ruleDiscuss' });
ruleDiscussRoute.route('/', { name: 'ruleAgendaList' });
ruleDiscussRoute.route('/view/:agendaId', { name: 'ruleAgendaDetail' });
