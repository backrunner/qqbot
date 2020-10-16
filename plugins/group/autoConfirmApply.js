const config = require('../../bot.config.js').auto_confirm_apply;

const { enable } = config;
const { all_enable } = config;
const { enable_groups } = config;

module.exports = {
  name: 'auto-confirm-apply',
  apply: (ctx) => {
    ctx.receiver.on('request/group/add', (meta) => {
      if (!enable) {
        return;
      }
      if (!all_enable) {
        if (!enable_groups.includes(meta.groupId)) {
          return;
        }
      }
      meta.$approve();
    });
  },
};
