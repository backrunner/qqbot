const { App } = require('koishi');
const koishi_config = require('./koishi.config');

const app = new App(koishi_config);

app.start();
