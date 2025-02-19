const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// 添加这行来解析JSON请求体
app.use(bodyParser.json());

// ... 其余代码 ... 