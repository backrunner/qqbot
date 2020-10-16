// 加载敏感词库（正则表达式组成的数组）
const { sensitive_words } = require('../../bot.config');

// 配置
const { deleteMsg, banUser, banTime, word_list } = sensitive_words;

module.exports = {
  name: 'sensitive-word',
  apply: (ctx) => {
    ctx.middleware((meta, next) => {
      // 过滤掉notice
      if (meta.subType === 'notice') {
        return next();
      }
      // 过滤掉群主
      if (meta.sender.role === 'owner') {
        return next();
      }
      for (const pattern of word_list) {
        if (pattern.test(meta.$parsed.message)) {
          // 检测到敏感词
          if (deleteMsg) {
            meta.$delete();
          }
          if (banUser) {
            meta.$ban(banTime);
          }
          return meta.$send(`[CQ:at,qq=${meta.userId}] 检测到敏感词`);
        }
      }
    });
  },
};
