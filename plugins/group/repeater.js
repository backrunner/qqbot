const Random = require('../../utils/random');

const latest_message = {};
const repeat_count = {};

const trigger_rate = 0.75;

module.exports = {
  name: 'group-repeater',
  apply: (ctx) => {
    ctx.prependMiddleware((meta, next) => {
      // 不是普通信息，跳过
      if (meta.subType !== 'normal') {
        return next();
      }
      // 没有记录最后一次信息，跳过
      if (!latest_message[meta.groupId]) {
        latest_message[meta.groupId] = meta;
        repeat_count[meta.groupId] = 0;
        return next();
      }
      // 不是同一句话，清空计数，中断逻辑
      if (latest_message[meta.groupId].message !== meta.message) {
        latest_message[meta.groupId] = meta;
        repeat_count[meta.groupId] = 0;
        return next();
      }
      // 计数，只有不同用户复读才计数
      if (latest_message[meta.groupId].sender.userId !== meta.sender.userId) {
        repeat_count[meta.groupId] += 1;
      }
      latest_message[meta.groupId] = meta;
      // 大于2次才触发复读逻辑
      if (repeat_count[meta.groupId] < Random.randomInt(2, 5)) {
        return next();
      }
      if (Math.random() < trigger_rate) {
        meta.$send(meta.message);
      }
      return next();
    });
  },
};
