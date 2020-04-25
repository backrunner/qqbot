const { buildMessage } = require("../../utils/message.js");

module.exports = {
    name: "urlcode",
    apply: (ctx) => {
        ctx.command("urlcode")
            .option('-e, --encode <string>')
            .option('-d, --decode <code>')
            .action(({ meta, options }) => {
                if (options.encode && typeof options.encode != "boolean") {
                    let encode = options.encode.toString().trim();
                    if (encode.length < 1) {
                        return meta.$send(buildMessage(meta, "没有内容可以编码"));
                    }
                    return meta.$send(buildMessage(meta, encodeURIComponent(encode)));
                } else if (options.decode && typeof options.decode != "boolean") {
                    let code = options.decode.toString().trim();
                    if (code.length < 1) {
                        return meta.$send(buildMessage(meta, "没有内容可以解码"));
                    }
                    return meta.$send(buildMessage(meta, decodeURIComponent(code)));
                } else {
                    return meta.$send(buildMessage(meta, "对于你刚才发送的指令，我理解不能"));
                }
            });
    },
};
