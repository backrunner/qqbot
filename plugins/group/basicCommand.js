// 依赖
const nzh = require('nzh/cn');

// 开关
const { basic_command_reply } = require('../../bot.config');

const commands = [
  {
    key: 'ban',
    parser: /^(禁言)|(封禁)/,
  },
  {
    key: 'unban',
    parser: /^(解禁)|(解封)|(解除禁言)/,
  },
  {
    key: 'all_ban',
    parser: /^((开启)|(打开)|(启动)|(启用))?全体禁言$/,
  },
  {
    key: 'all_unban',
    parser: /^(解除)|(关闭)|(取消)全体禁言$/,
  },
];

const extract_qq = (message) => {
  const extract_regex = /\[CQ:at,qq=(\d+)\]/g;
  const splited = message.split(extract_regex);
  const res = [];
  // 抽出
  for (let i = 0; i < splited.length; i++) {
    if (/^\d+$/.test(splited[i])) {
      res.push(parseInt(splited[i], 10));
    }
  }
  // 去重
  return [...new Set(res)];
};

const extract_time = (message) => {
  const extract_regex = /(\d+|[\u4e00-\u9fa5]+)(天|个?小时|分(钟)?|秒)/g;
  const times = message.match(extract_regex);
  let seconds = 0;
  // 抽出数字
  for (let i = 0; i < times.length; i++) {
    let num = parseInt(times[i], 10);
    if (isNaN(num)) {
      // 需要转换中文数字抽出时间
      num = nzh.decodeS(times[i]);
    }
    if (times[i].includes('天')) {
      seconds += num * 24 * 60 * 60;
    } else if (times[i].includes('小时')) {
      seconds += num * 60 * 60;
    } else if (times[i].includes('分')) {
      seconds += num * 60;
    } else {
      seconds += num;
    }
  }
  return seconds;
};

module.exports = {
  name: 'basic-group-command',
  apply: (ctx) => {
    ctx.middleware((meta, next) => {
      // ==== 指令解析 ====

      // 基本群管指令只拦截标准信息
      if (meta.subType !== 'normal') {
        return next();
      }
      // 不是指令，跳过
      if (!meta.$parsed.atMe && !meta.$parsed.nickname) {
        return next();
      }
      // 解析后的信息
      const { message } = meta.$parsed;
      // 指令
      let key = null;
      // 匹配指令
      for (let i = 0; i < commands.length; i++) {
        if (commands[i].parser.test(message)) {
          key = commands[i].key;
          break;
        }
      }
      // 未匹配到指令，跳过
      if (!key) {
        return next();
      }
      // 权限检查
      if (meta.sender.role === 'member') {
        // 发送权限不足
        return meta.$send(`[CQ:at,qq=${meta.sender.userId}]，你的权限不足`);
      }

      // ==== 指令执行 ====

      if (key === 'ban') {
        const qq = extract_qq(message);
        const duration = extract_time(message);
        for (let i = 0; i < qq.length; i++) {
          ctx.sender.setGroupBan(meta.groupId, qq[i], duration);
        }
      } else if (key === 'unban') {
        const qq = extract_qq(message);
        for (let i = 0; i < qq.length; i++) {
          ctx.sender.setGroupBan(meta.groupId, qq[i], 0);
        }
      } else if (key === 'all_ban') {
        ctx.sender.setGroupWholeBan(meta.groupId);
      } else if (key === 'all_unban') {
        ctx.sender.setGroupWholeBan(meta.groupId, false);
      }

      if (basic_command_reply) {
        return meta.$send(`[CQ:at,qq=${meta.sender.userId}]，已执行操作`);
      }
    });
  },
};
