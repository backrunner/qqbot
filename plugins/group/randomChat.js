const config = require('../../bot.config').random_chat;
const TencentAI = require('tencent-ai-nodejs-sdk');

const { enable, app_id: appId, app_key: appKey, triggerRate } = config;
const tencentAI = new TencentAI(appId, appKey);

const checkMessage = (message) => {
  if (
    message.includes('CQ:image') ||
    message.includes('CQ:face') ||
    message.includes('CQ:at')
  ) {
    return false;
  }
  return true;
};

module.exports = {
  name: 'group-random-chat',
  apply: (ctx) => {
    ctx.middleware(async (meta, next) => {
      // 未启用 调过
      if (!enable) {
        return next();
      }
      // 不是普通信息，跳过
      if (meta.subType !== 'normal') {
        return next();
      }
      const { message } = meta;
      // 检查是否为合法信息
      if (!checkMessage(message)) {
        return next();
      }
      const ret = await tencentAI.nlpTextChat(message.trim());
      // eslint-disable-next-line no-console
      console.log('AI chat: ', ret);
      if (!ret || !ret.data || !ret.data.answer) {
        return next();
      }
      if (Math.random() < triggerRate) {
        meta.$send(ret.data.answer);
      }
      return next();
    });
  },
};
