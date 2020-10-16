module.exports = {
  basic_command_reply: true,
  welcome_message: '欢迎入群~',
  auto_confirm_apply: {
    enable: false,
    all_enable: true,
    enable_groups: [],
  },
  auto_reject_apply: {
    enable: true,
    all_enable: true,
    enable_groups: [],
    reject_message: '',
  },
  sensitive_words: {
    deleteMsg: false,
    banUser: true,
    banTime: 300,
    word_list: [],
  },
  friendWhiteList: [],
  qrcode: {
    timeout: 30,
  },
};
