const config = require('../../bot.config').auto_reject_apply;

const { enable } = config;
const { all_enable } = config;
const { enable_groups } = config;
const { reject_message } = config;

module.exports = {
  name: 'auto-reject-apply',
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
      if (reject_message && reject_message.length) {
        meta.$reject(reject_message);
      } else {
        meta.$reject();
      }
    });
  },
};
