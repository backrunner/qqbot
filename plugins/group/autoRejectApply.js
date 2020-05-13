const config = require('../../bot.config').auto_reject_apply;

const enable = config.enable;
const all_enable = config.all_enable;
const enable_groups = config.enable_groups;
const reject_message = config.reject_message;

module.exports = {
    name: 'auto-reject-apply',
    apply: ctx => {
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
    }
};