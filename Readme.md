# 空格的三号机（qqbot）

该项目是一个基于CQHTTP + Koishi V1打造的QQ机器人，取代之前的二号机项目。

得益于Koishi V1的插件架构，我在这个项目内把每一个独立的功能模块都拆分成了一个独立的插件。

## 使用方式

克隆本项目代码后，参照Koishi的文档，或使用Koishi提供的CLI工具创建配置文件koishi.config.js

运行：
```
koishi run
```

即可启动该机器人。请确保你同时运行了酷Q，且酷Q安装了CQHTTP应用。

建议根据plugins目录下的子目录名称来定义插件的上下文。

## 插件列表

### 通用

- base64编解码（base64）
- urlencode/urlcode（urlcode）
- 二维码生成与扫描（qrcode）
- 随机数生成（random）

### 用户

- 好友白名单（friendWhiteList）

### 群聊

- 基本的群管指令（basicCommand）
- 群聊新成员欢迎信息（welcome）
- 自动同意入群（autoConfirmApply）
- 数学算式验证（mathValidation）
- 复读机（repeater）
- 敏感词过滤（sensitiveWord）

如果你只是想用我们项目中的某一个功能模块，你可以自行在koishi.config.js里调整加载的插件。

当然，你也可以把我们的插件整合到你自己的机器人中，在Koishi的插件架构下我们的所有插件都能独立运行。

## 插件说明

对于类似二维码生成与扫描这样的插件，由于我暂时使用的是酷Q Air，所以并没有做直接发送图片的功能。

插件的功能使用了一个统一的API，对于API，我们默认使用的是[tools-server](https://github.com/pwp-app/tools-server)

## 许可证

Apache 2.0
