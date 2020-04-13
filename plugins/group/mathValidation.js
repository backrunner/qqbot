const Random = require('../../utils/random');

let answer = {};
let timer = {};

function createCalc() {
    let num_1 = Random.randomInt(0, 100);
    let num_2 = Random.randomInt(0, 100);
    let num_3 = Random.randomInt(0, 100);
    let op_1 = Random.randomOperator();
    let op_2 = Random.randomOperator();
    let answer = 0;
    if (op_1 == '+') {
        answer = num_1 + num_2;
    } else {
        answer = num_1 - num_2;
    }
    if (op_2 == '+') {
        answer += num_3;
    } else {
        answer -= num_3;
    }
    return {
        string: `${num_1} ${op_1} ${num_2} ${op_2} ${num_3} = ?`,
        answer: answer
    };
}

module.exports = {
    name: 'math-validation',
    apply: ctx => {
        // 监听加群事件，进行验证
        ctx.receiver.on('group-increase', (meta) => {
            let calc = createCalc();
            answer[`${meta.groupId},${meta.userId}`] = calc.answer;
            ctx.sender.sendGroupMsg(meta.groupId, `[CQ:at,qq=${meta.userId}] 请在一分钟内计算下面的算式，将答案发在群内，完成入群验证: \n${calc.string}`);
            // 设置timer
            timer[`${meta.groupId},${meta.userId}`] = setTimeout(() => {
                // 一分钟没有完成验证，踢出
                ctx.sender.sendGroupMsg(meta.groupId, `[CQ:at,qq=${meta.userId}] 很遗憾您没有完成验证，请下次再来`);
                ctx.sender.setGroupKick(meta.groupId, meta.userId, false);
                timer[`${meta.groupId},${meta.userId}`] = null;
            }, 60 * 1000);
        });
        // 监听普通消息
        ctx.middleware((meta, next) => {
            // 过滤非普通消息
            if (meta.subType != 'normal') {
                return next();
            }
            // 用户不需要验证，跳过
            if (!answer[`${meta.groupId},${meta.userId}`]) {
                return next();
            }
            // 只处理纯数字
            if (!(/^(-|\+)?\d+$/.test(meta.$parsed.message))) {
                return next();
            }
            if (answer[`${meta.groupId},${meta.userId}`] == parseInt(meta.$parsed.message)) {
                clearTimeout(timer[`${meta.groupId},${meta.userId}`]);
                answer[`${meta.groupId},${meta.userId}`] = null;
                return meta.$send(`[CQ:at,qq=${meta.userId}] 验证成功`);
            } else {
                return meta.$send(`[CQ:at,qq=${meta.userId}] 验证失败，请重试`);
            }
        });
        // 监听离群消息，及时清除相关的数据
        ctx.receiver.on('group-decrease', (meta) => {
            if (answer[`${meta.groupId},${meta.userId}`]) {
                answer[`${meta.groupId},${meta.userId}`] = null;
            }
            if (timer[`${meta.groupId},${meta.userId}`]) {
                clearTimeout(timer[`${meta.groupId},${meta.userId}`]);
                timer[`${meta.groupId},${meta.userId}`] = null;
            }
        });
    }
};