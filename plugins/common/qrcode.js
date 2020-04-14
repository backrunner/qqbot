const axios = require('axios');

const { buildMessage, extractImage } = require('../../utils/message');
const { COMMON_API } = require('../../api.config');

let timer_decode = {};

const regex_encode = /^(((生成)|(创建)|(制造|作))二维码)/;
const regex_decode = /^(((解析?)|(识别))二维码)/;

function requestAPI(meta, params) {
    return new Promise((resolve, reject) => {
        axios.post(COMMON_API + '/qrcode/decode', params, {timeout: 5000})
            .then(res => {
                if (!res) {
                    clearTimeout(timer_decode[`${(meta.messageType == 'group' ? meta.groupId : 'user')},${meta.userId}`]);
                    timer_decode[`${(meta.messageType == 'group' ? meta.groupId : 'user')},${meta.userId}`] = null;
                    meta.$send(buildMessage(meta, '无法处理你发送的图片'));
                    resolve(false);
                }
                if (res.data.code !== 200) {
                    meta.$send(buildMessage(meta, '无法识别图片中的内容'));
                    resolve(false);
                }
                meta.$send(buildMessage(meta, `解码结果: ${res.data.data}`));
                resolve(true);
            })
            .catch(() => {
                meta.$send(buildMessage(meta, '无法处理你发送的图片'));
                resolve(false);
            });
    });
}

module.exports = {
    name: 'qrcode',
    apply: ctx => {
        // 指令
        ctx.command('qrcode')
            .option('-e, --encode <text>')
            .option('-d, --decode <base64>')
            .option('-u, --url <url>')
            .action(async ({ meta, options }) => {
                if (typeof options.encode == 'string') {
                    return meta.$send(buildMessage(meta, `${COMMON_API}/qrcode/encode?text=${encodeURIComponent(options.encode)}`));
                } else if (typeof options.decode == 'string') {
                    return await requestAPI(meta, {base64: options.decode});
                } else if (typeof options.url == 'string') {
                    return await requestAPI(meta, {url: options.url});
                } else {
                    return meta.$send(buildMessage(meta, '指令错误'));
                }
            });
        // 编码中间件
        ctx.middleware(async (meta, next) => {
            // 群聊消息没有触发就跳过
            if (meta.messageType == 'group' && !timer_decode[`${meta.groupId},${meta.userId}`]) {
                if (!meta.$parsed.atMe && !meta.$parsed.nickname) {
                    return next();
                }
            }
            if (!(regex_encode.test(meta.$parsed.message))) {
                return next();
            }
            // 信息抽出
            let message = meta.$parsed.message.replace(regex_encode, '').trim();
            if (message.length < 1) {
                return meta.$send(buildMessage(meta, '请输入有效的编码信息'));
            }
            return meta.$send(buildMessage(meta, `${COMMON_API}/qrcode/encode?text=${encodeURIComponent(message)}`));
        });
        // 解码中间件
        ctx.middleware(async (meta, next) => {
            // 群聊消息没有触发就跳过
            if (meta.messageType == 'group' && !timer_decode[`${meta.groupId},${meta.userId}`]) {
                if (!meta.$parsed.atMe && !meta.$parsed.nickname) {
                    return next();
                }
            }
            // 检查用户是否已经设置了timer，即触发了解码
            if (timer_decode[`${meta.groupId},${meta.userId}`]) {
                let image = extractImage(meta.$parsed.message);
                if (!image) {
                    return next();
                }
                return await requestAPI(meta, {url: image});
            } else {
                // 匹配到关键词才触发逻辑
                if (!(regex_decode.test(meta.$parsed.message))) {
                    return next();
                }
                // 设置timer
                timer_decode[`${(meta.messageType == 'group' ? meta.groupId : 'user')},${meta.userId}`] = setTimeout(() => {
                    timer_decode[`${(meta.messageType == 'group' ? meta.groupId : 'user')},${meta.userId}`] = null;
                }, 30 * 1000);
            }
        });
    }
};