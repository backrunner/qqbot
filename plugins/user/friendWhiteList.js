const { friendWhiteList } = require('../../bot.config');

module.exports = {
    name: 'friend-white-list',
    apply: ctx => {
        ctx.receiver.on('friend-add', (meta) => {
            if (friendWhiteList.includes(meta.$userId)) {
                meta.$approve();
            } else {
                meta.$reject("您并不在我的好友白名单内，无法添加好友");
            }
        });
    }
};