const config = require('../../bot.config.js').auto_confirm_apply;
const enable = config.enable;
const all_enable = config.all_enable;
const enable_groups = config.enable_groups;

module.exports = {
    name: 'auto-confirm-apply',
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
            meta.$approve();
        });
    }
};