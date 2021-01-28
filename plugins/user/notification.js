const path = require('path');
const fs = require('fs');
const moment = require('moment');

const pluginPath = path.resolve(__dirname, '../../run/notification');

if (!fs.existsSync(pluginPath)) {
  fs.mkdirSync(pluginPath, { recursive: true });
}

const storagePath = path.resolve(pluginPath, './notification.json');

let taskList = [];

if (fs.existsSync(storagePath)) {
  taskList = JSON.parse(fs.readFileSync(storagePath, { encoding: 'utf-8' }));
}

const saveList = () => {
  fs.writeFileSync(storagePath, JSON.stringify(taskList), { encoding: 'utf-8' });
};

class Scheduler {
  constructor(list) {
    this.list = list;
  }
  start() {
    this.timer = setInterval(() => {
      this.check();
    }, 1000);
  }
  stop() {
    clearInterval(this.timer);
  }
  check() {
    this.list.forEach((task, index) => {
      if (task.type === 'onetime') {
        if (new Date().valueOf() > task.time) {
          this.sender.sendPrivateMsg(
            task.target,
            `【提醒事项】${task.name}\n${task.message}`,
          );
        }
      } else if (task.type === 'daily') {
        if (task.startTime && task.startTime > new Date().valueOf()) {
          return;
        }
        if (task.endTime && task.endTime < new Date().valueOf()) {
          taskList[index] = null;
        }

        const time = moment();

        if (
          task.lastSend &&
          time.diff(moment(task.lastSend, 'YYYY-MM-DD HH:mm:ss'), 'days') < 1
        ) {
          return;
        }

        let reserveTime;
        try {
          reserveTime = moment(
            `${time.format('YYYY-MM-DD')} ${task.time}${task.time.length === 5 ? ':00' : ''}`,
            'YYYY-MM-DD HH:mm:ss',
          );
        } catch (err) { /* do nothing */ }

        if (reserveTime.valueOf() > time.valueOf()) {
          const toSend = task.message;
          this.sender.sendPrivateMsg(
            task.target,
            `【提醒事项】${task.name}\n${toSend}`,
          );
          // eslint-disable-next-line no-param-reassign
          task.lastSend = time.format('YYYY-MM-DD HH:mm:ss');
        }
      } else if (task.type === 'weekly') {
        // TODO 未完成
      }
    });
    saveList();
  }
  setSender(sender) {
    if (!this.sender) {
      this.sender = sender;
    }
  }
}

class Task {
  constructor(name) {
    this.name = name;
  }
}

const checkTime = (timeStr) => {
  const parts = timeStr.split(';');
  if (parts.length < 2) {
    return false;
  }
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (parts.length === 2) {
    // HH:mm
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  }
  if (parts.length === 3) {
    // HH:mm:ss
    const s = parseInt(parts[2], 10);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59 && s >= 0 && s <= 59;
  }
};

const scheduler = new Scheduler();
scheduler.start();

const userStatus = {};

module.exports = {
  name: 'notification',
  apply: (ctx) => {
    scheduler.setSender(ctx.sender);
    ctx.middleware((meta, next) => {
      // 跳过非好友私聊
      if (meta.messageType !== 'private' || meta.subType !== 'friend') {
        return next();
      }
      const message = meta.message.trim();
      const status = userStatus[meta.userId];
      if (!status || (status.time + 60 * 1000 < new Date().valueOf())) {
        if (message !== '创建提醒') {
          delete userStatus[meta.userId];
          return next();
        }
        userStatus[meta.userId] = { step: 'target', time: new Date().valueOf() };
        return meta.$send('提醒要发送给谁？（请输入对方的QQ号）');
      }
      // step是上一次执行的步骤
      const { step } = status;
      switch (step) {
        default:
          return next();
        case 'target': {
          const friendList = ctx.sender.getFriendList();
          const number = parseInt(message, 10);
          let found = false;
          for (let i = 0; i < friendList.length; i++) {
            if (friendList[i].userId === number) {
              found = true;
              break;
            }
          }
          if (!found) {
            delete userStatus[meta.userId];
            return meta.$send('很遗憾，对方没有添加我为好友');
          }
          userStatus[meta.userId].target = number;
          userStatus[meta.userId].step = 'name';
          userStatus[meta.userId].time = new Date().valueOf();
          return meta.$send('请告诉我提醒事件的名称');
        }
        case 'name':
          userStatus[meta.userId].time = new Date().valueOf();
          userStatus[meta.userId].task = new Task(message);
          userStatus[meta.userId].step = 'message';
          return meta.$send('请输入提醒的事项');
        case 'message':
          userStatus[meta.userId].step = 'type';
          userStatus[meta.userId].time = new Date().valueOf();
          userStatus[meta.userId].task.message = message;
          return meta.$send('请告诉我提醒的频率（一次/每天/每周）');
        case 'type':
          switch (message) {
            default:
              meta.$send('输入错误，请重新输入');
              break;
            case '一次':
              userStatus[meta.userId].task.type = 'onetime';
              meta.$send('你希望在什么时候提醒？（YYYY-MM-DD HH:mm:ss');
              break;
            case '每天':
              userStatus[meta.userId].task.type = 'daily';
              meta.$send('你希望在每天的什么时候提醒？（HH:mm/HH:mm:ss）');
              break;
            case '每周':
              userStatus[meta.userId].task.type = 'weekly';
              meta.$send('你希望每周的哪一天/几天提醒？（多天用逗号分隔）');
              break;
          }
          userStatus[meta.userId].step = 'time';
          userStatus[meta.userId].time = new Date().valueOf();
          break;
        case 'time':
          switch (status.task.type) {
            default:
              return next();
            case 'onetime': {
              const timeStr = message.replace(/：/g, ':');
              let time;
              try {
                time = moment(timeStr, 'YYYY-MM-DD HH:mm:ss');
              } catch (err) {
                return meta.$send('无法解析输入的时间，请重试');
              }
              userStatus[meta.userId].task.time = time.valueOf();
              taskList.push(userStatus[meta.userId].task);
              saveList();
              delete userStatus[meta.userId];
              return meta.$send('创建成功');
            }
            case 'daily': {
              const timeStr = message.replace(/：/g, ':');
              if (!checkTime(timeStr)) {
                return meta.$send('输入的时间格式不正确');
              }
              userStatus[meta.userId].task.time = timeStr;
              break;
            }
            case 'weekly':
              // TODO 未完成
              delete userStatus[meta.userId];
              return meta.$send('该功能暂未开放');
          }
          userStatus[meta.userId].step = 'startTime';
          userStatus[meta.userId].time = new Date().valueOf();
          return meta.$send('请输入提醒开始时间（现在/now/HH:mm:ss)');
        case 'startTime': {
          if (message !== '现在' && message !== 'now') {
            const timeStr = message.replace(/：/g, ':');
            let time;
            try {
              time = moment(timeStr, 'YYYY-MM-DD HH:mm:ss');
            } catch (err) {
              return meta.$send('无法解析输入的时间，请重试');
            }
            userStatus[meta.userId].task.startTime = time.valueOf();
          } else {
            userStatus[meta.userId].task.startTime = null;
          }
          userStatus[meta.userId].step = 'endTime';
          userStatus[meta.userId].time = new Date().valueOf();
          return meta.$send('请输入提醒结束时间（现在/now/HH:mm:ss)');
        }
        case 'endTime': {
          const timeStr = message.replace(/：/g, ':');
          let time;
          try {
            time = moment(timeStr, 'YYYY-MM-DD HH:mm:ss');
          } catch (err) {
            return meta.$send('无法解析输入的时间，请重试');
          }
          userStatus[meta.userId].task.endTime = time.valueOf();
          taskList.push(userStatus[meta.userId].task);
          saveList();
          delete userStatus[meta.userId];
          return meta.$send('创建成功');
        }
      }
    });
  },
};
