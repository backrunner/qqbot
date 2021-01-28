/* eslint-disable no-param-reassign */
/* eslint-disable require-atomic-updates */
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
  fs.writeFileSync(storagePath, JSON.stringify(taskList, null, 2), { encoding: 'utf-8' });
};

const tillPattern = /{till:(end|\d{8})}/g;

const taskTypeMap = {
  onetime: '一次',
  daily: '每天',
  weekly: '每周',
};

class Scheduler {
  start() {
    this.timer = setInterval(() => {
      this.check();
    }, 1000);
  }
  stop() {
    clearInterval(this.timer);
  }
  check() {
    if (!taskList) {
      return;
    }
    taskList.forEach(async (task, index) => {
      if (task.failed >= 3) {
        if (moment().diff(moment(task.lastFailed, 'YYYY-MM-DD HH:mm:ss'), 'days') < 1) {
          return;
        } else {
          task.failed = 0;
        }
      }
      if (task.type === 'onetime') {
        if (new Date().valueOf() > task.time) {
          try {
            this.sender.sendPrivateMsg(
              task.target,
              `【提醒事项】${task.name}\n${task.message}`,
            );
            // delete after sent
            taskList[index] = null;
          } catch (err) {
            if (!task.failed) {
              task.failed = 1;
            } else {
              task.failed += 1;
            }
            task.lastFailed = moment().format('YYYY-MM-DD HH:mm:ss');
          }
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
          task.lastSend === time.format('YYYY-MM-DD')
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

        if (reserveTime.valueOf() <= time.valueOf()) {
          let toSend = task.message;
          const tillParts = [...toSend.matchAll(tillPattern)];
          if (tillParts) {
            tillParts.forEach((matched) => {
              if (matched[1] === 'end') {
                if (task.endTime) {
                  toSend = toSend.replace(matched[0], time.diff(moment(task.endTime), 'days'));
                }
              } else {
                try {
                  const tillDay = moment(matched[1], 'YYYYMMDD');
                  toSend = toSend.replace(matched[0], time.diff(tillDay, 'days'));
                } catch (err) { /* do nothing */ }
              }
            });
          }
          this.sender.sendPrivateMsg(
            task.target,
            `【提醒事项】${task.name}\n${toSend}`,
          );
          task.lastSend = time.format('YYYY-MM-DD');
        }
      } else if (task.type === 'weekly') {
        // TODO 未完成
      }
    });
    taskList = taskList.filter((task) => !!task);
    saveList();
  }
  setSender(sender) {
    if (!this.sender) {
      this.sender = sender;
    }
  }
}

const checkTime = (timeStr) => {
  const parts = timeStr.split(':');
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
    ctx.middleware(async (meta, next) => {
      // 跳过非好友私聊
      if (meta.messageType !== 'private' || meta.subType !== 'friend') {
        return next();
      }
      const message = meta.message.trim();
      const status = userStatus[meta.userId];
      if (status && message === '重置') {
        delete userStatus[meta.userId];
        return meta.$send('对话已重置');
      }
      if (!status || (status.time + 60 * 1000 < new Date().valueOf())) {
        if (message === '创建提醒') {
          userStatus[meta.userId] = { step: 'target', time: new Date().valueOf() };
          return meta.$send('提醒要发送给谁？（请输入对方的QQ号）');
        } else if (message === '删除提醒') {
          userStatus[meta.userId] = { step: 'delete_question', time: new Date().valueOf() };
          return meta.$send('请输入要删除的提醒（对方的QQ号,名称）');
        } else if (message === '我的提醒') {
          // list notification
          const tasks = taskList.filter((task) => {
            return task.creator === meta.userId;
          });
          let toSend = '';
          if (!tasks || tasks.length < 1) {
            return meta.$send('当前没有任何提醒');
          }
          tasks.forEach((task, index) => {
            if (toSend) {
              toSend += '\n';
            }
            toSend += `[${index + 1}] ${task.name}\nto: ${task.target}\n类型: ${taskTypeMap[task.type]}\n${task.message}`;
            if (task.type === 'daily') {
              if (task.startTime) {
                toSend += `\n开始时间: ${moment(task.startTime).format('YYYY-MM-DD HH:mm:ss')}`;
              }
              if (task.endTime) {
                toSend += `\n结束时间: ${moment(task.endTime).format('YYYY-MM-DD HH:mm:ss')}`;
              }
            }
          });
          return meta.$send(toSend);
        } else {
          delete userStatus[meta.userId];
          return next();
        }
      }
      // step是上一次执行的步骤
      const { step } = status;
      switch (step) {
        default:
          return next();
        // delete
        case 'delete_question': {
          const parts = message.replace(/，/g, ',').split(',');
          if (parts.length !== 2) {
            return meta.$send('输入的格式不正确，请重新输入');
          }
          parts[0] = parseInt(parts[0], 10);
          let found = false;
          for (let i = 0; i < taskList.length; i++) {
            const task = taskList[i];
            if (
              task.target === parts[0] &&
              task.name === parts[1] &&
              task.creator === meta.userId
            ) {
              taskList[i] = null;
              found = true;
              break;
            }
          }
          if (found) {
            taskList = taskList.filter((task) => !!task);
            saveList();
            delete userStatus[meta.userId];
            return meta.$send('任务已删除');
          } else {
            return meta.$send('未找到对应任务');
          }
        }
        // create
        case 'target': {
          const friendList = await ctx.sender.getFriendList();
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
          userStatus[meta.userId].task = {};
          userStatus[meta.userId].task.creator = meta.userId;
          userStatus[meta.userId].task.target = number;
          userStatus[meta.userId].step = 'name';
          userStatus[meta.userId].time = new Date().valueOf();
          return meta.$send('请告诉我提醒事件的名称');
        }
        case 'name':
          userStatus[meta.userId].time = new Date().valueOf();
          userStatus[meta.userId].task.name = message;
          userStatus[meta.userId].step = 'message';
          return meta.$send('请输入提醒事件的内容');
        case 'message':
          userStatus[meta.userId].step = 'type';
          userStatus[meta.userId].time = new Date().valueOf();
          userStatus[meta.userId].task.message = message;
          return meta.$send('请告诉我提醒的频率（一次/每天）');
        case 'type':
          switch (message) {
            default:
              meta.$send('输入错误，请重新输入');
              break;
            case '一次':
              userStatus[meta.userId].task.type = 'onetime';
              meta.$send('你希望在什么时候提醒？（YYYY-MM-DD HH:mm:ss）');
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
          return meta.$send('请输入提醒开始时间（现在/now/YYYY-MM-DD HH:mm:ss）');
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
          return meta.$send('请输入提醒结束时间（没有/null/YYYY-MM-DD HH:mm:ss）');
        }
        case 'endTime': {
          if (message !== '没有' && message !== 'null') {
            const timeStr = message.replace(/：/g, ':');
            let time;
            try {
              time = moment(timeStr, 'YYYY-MM-DD HH:mm:ss');
            } catch (err) {
              return meta.$send('无法解析输入的时间，请重试');
            }
            userStatus[meta.userId].task.endTime = time.valueOf();
          } else {
            userStatus[meta.userId].task.endTime = null;
          }
          taskList.push(userStatus[meta.userId].task);
          saveList();
          delete userStatus[meta.userId];
          return meta.$send('创建成功');
        }
      }
    });
  },
};
