const welcomeMessage = "欢迎入群~";

module.exports = {
    name: 'welcome-message',
    apply: ctx => {
        // 注册对group-increase的监听
        ctx.receiver.on('group-increase', (meta) => {
            console.log(meta);
            ctx.sender.sendGroupMsg(meta.groupId, `[CQ:at,qq=${meta.userId}] ${welcomeMessage}`);
        });
    }
};