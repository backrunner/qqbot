const all_enable = true;
const enable_groups = [];

module.exports = {
    name: 'auto-confirm-apply',
    apply: ctx => {
        ctx.receiver.on('request/group/add', (meta) => {
            if (all_enable) {
                // 自动同意申请
                meta.$approve();
            } else {
                if (enable_groups.includes(meta.groupId)) {
                    meta.$approve();
                }
            }
        });
    }
};