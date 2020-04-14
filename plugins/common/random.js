const { buildMessage } = require('../../utils/message');
const { realRandomInt } = require('../../utils/random');

module.exports = {
    name: 'random',
    apply: ctx => {
        ctx.command('randint <min> <max>')
            .action(({ meta }, min, max) => {
                if (typeof min === 'undefined' || typeof max === undefined || min == null || max == null) {
                    return meta.$send(buildMessage(meta, '指令参数错误'));
                }
                if (min < -9007199254740991 || min > 9007199254740991 || max < -9007199254740991 || max > 9007199254740991) {
                    return meta.$send(buildMessage(meta, '参数超出安全值'));
                }
                if (min % 1 != 0) {
                    min = Math.floor(min);
                }
                if (max % 1 != 0) {
                    max = Math.floor(max);
                }
                return meta.$send(buildMessage(meta, realRandomInt(min, max)));
            });
    }
};