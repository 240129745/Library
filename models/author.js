const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  first_name: { type: String, required: true, max: 100 },
  family_name: { type: String, required: true, max: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

// 虚拟属性'name'：表示作者全名
AuthorSchema.virtual("name").get(function () {
  return this.family_name + ", " + this.first_name;
});

// 虚拟属性'lifespan'：作者寿命
AuthorSchema.virtual("lifespan").get(function () {

  //有日期才可以判断寿命
  if (this.date_of_death && this.date_of_birth) {
    let life = (
      this.date_of_death.getYear() - this.date_of_birth.getYear()
    ).toString();
    return "享年"+life+"岁";
  } else {
    //出生死亡日期不全，返回指定文本
    return "享年不详";
  }
});

// 虚拟属性'url'：作者 URL
AuthorSchema.virtual("url").get(function () {
  return "/catalog/author/" + this._id;
});
AuthorSchema.virtual("date_of_birth_formatted").get(function () {
  let date = DateTime.fromJSDate(this.date_of_birth);
  return date.isValid ? date.toLocaleString(DateTime.DATE_MED) : "?";
});
AuthorSchema.virtual("date_of_death_formatted").get(function () {
  let date = DateTime.fromJSDate(this.date_of_death);
  if (!date.isValid) {
    return "?";
  }
  return date.toLocaleString(DateTime.DATE_MED);
  //return DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED);
});
// 导出 Author 模型
module.exports = mongoose.model("Author", AuthorSchema);
