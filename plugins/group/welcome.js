const { welcome_message } = require('../../bot.config');

module.exports = {
  name: 'welcome-message',
  apply: (ctx) => {
    // 注册对group-increase的监听
    ctx.receiver.on('group-increase', (meta) => {
      ctx.sender.sendGroupMsg(meta.groupId, `[CQ:at,qq=${meta.userId}] ${welcome_message}`);
    });
  },
};
