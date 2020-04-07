function buildMessage(meta, message) {
    return (meta.messageType != 'private' ? `[CQ:at,qq=${meta.userId}] ` : '') + message;
}

module.exports = {
    name: 'base64',
    apply: ctx => {
        ctx.command('base64')
            .option('-e, --encode <string>')
            .option('-d, --decode <code>')
            .action(({ meta, options }) => {
                if (typeof options.encode != 'boolean') {
                    let encode = options.encode.trim();
                    if (encode.length < 1) {
                        meta.$send(buildMessage(meta, '没有内容可以编码'));
                        return;
                    }
                    meta.$send(buildMessage(meta, Buffer.from(options.encode, 'utf-8').toString('base64')));
                } else if (typeof options.decode != 'boolean') {
                    let code = options.decode.trim();
                    if (code.length < 1) {
                        meta.$send(buildMessage(meta, '没有内容可以解码'));
                        return;
                    }
                    meta.$send(buildMessage(meta, Buffer.from(options.decode, 'base64').toString('utf-8')));
                } else {
                    meta.$send(buildMessage(meta, '对于你刚才发送的指令，我理解不能'));
                }
            });
    }
};