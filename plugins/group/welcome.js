const welcomeMessage = "欢迎入群~";

module.exports = {
    name: 'welcome-message',
    apply: ctx => {
        // 注册对group-increase的监听
        ctx.receiver.on('group-increase', (meta) => {
            meta.$send(`[CQ:at,qq=${meta.userId}] ${welcomeMessage}`);
        });
    }
};