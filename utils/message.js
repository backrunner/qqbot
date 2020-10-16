const re = {
  cqimg: /\[CQ:image,file=([^,]+),url=([^\]]+)\]/,
};

module.exports = {
  buildMessage(meta, message) {
    return (meta.messageType !== 'private' ? `[CQ:at,qq=${meta.userId}] ` : '') + message;
  },
  extractImage(message) {
    if (message.match(re.cqimg)) {
      return RegExp.$2;
    }
    return null;
  },
};
