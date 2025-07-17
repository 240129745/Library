require("dotenv").config();
const mongoose = require("mongoose");

// 设置默认 mongoose 连接
const mongoDB =  process.env.mongodburi;
mongoose.connect(mongoDB);

// 取得默认连接
const db = mongoose.connection;
//console.log(db)
// 将连接与错误事件绑定（以获得连接错误的提示）
db.on("error", console.error.bind(console, "MongoDB 连接错误："));

