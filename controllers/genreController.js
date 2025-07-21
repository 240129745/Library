const Genre = require("../models/genre");
var Book = require("../models/book");
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");



// 显示所有的类别。
exports.genre_list = asyncHandler(async (req, res, next) => {
  try {
    let list_genre = await Genre.find()
      .sort({ name: 1 })
      .exec();

    res.render("genre_list", {
      title: "图书种类",
      genre_list: list_genre,
    });
  } catch (error) {
    next(error);
  }
});

// 显示特定类别的详情页。

// Display detail page for a specific Genre.
exports.genre_detail = [async function (req, res, next) {
  try {
    const id = req.params.myid;
    // 并行执行两个查询（使用 Promise.all 替代 async.parallel）
    const [genre, genre_books] = await Promise.all([
      Genre.findById(id).exec(), // 直接调用 exec() 返回 Promise
      Book.find({ genre: id }).exec(), // 直接调用 exec() 返回 Promise
    ]);

    if (genre == null) {
      // 未找到分类
      const err = new Error("Genre not found");
      err.status = 404;
      return next(err);
    }

    // 渲染页面
    res.render("genre_detail", {
      title: "类别详情",
      genre: genre,
      genre_books: genre_books,
    });
  } catch (err) {
    // 捕获错误并传递给 Express 错误处理中间件
    next(err);
  }
}]

// 通过 GET 显示创建类别。
exports.genre_create_get = asyncHandler(async (req, res, next) => {
  res.render("genre_form", { title: "新建类别" });
});

// 以 POST 方式处理创建类别。

exports.genre_create_post = [
  // 验证及清理名称字段
  body("name")
    .trim()
    .isLength({ min: 2 }).withMessage("类型至少要2个字符!")
    .escape(),

  // 处理验证及清理过后的请求
  asyncHandler(async (req, res, next) => {
    // 从请求中提取验证时产生的错误信息
    const errors = validationResult(req);

    // 使用经去除空白字符和转义处理的数据创建一个类型对象
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // 出现错误。使用清理后的值/错误信息重新渲染表单
      res.render("genre_form", {
        title: "新建类别",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // 表格中的数据有效
      // 检查是否存在同名的 Genre
      const genreExists = await Genre.findOne({ name: req.body.name })
        .collation({ locale: "en", strength: 2 })
        .exec();
      if (genreExists) {
        // 存在同名的 Genre，则重定向到详情页面
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        // 保存新创建的 Genre，然后重定向到类型的详情页面
        res.redirect(genre.url);
      }
    }
  }),
];


// 通过 GET 显示类别更新表单。
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  res.render("genre_form", { title: "更新类别", genre: await Genre.findById(req.params.id) });
});


// 处理 POST 上的类别更新。
exports.genre_update_post = [
  // 验证及清理名称字段
  body("name")
    .trim()
    .isLength({ min: 2 }).withMessage("类型至少要2个字符!")
    .escape(),

  // 处理验证及清理过后的请求
  asyncHandler(async (req, res, next) => {
    // 从请求中提取验证时产生的错误信息
    const errors = validationResult(req);

    // 使用经去除空白字符和转义处理的数据创建一个类型对象
    const genre = new Genre({ name: req.body.name, _id: req.params.id });

    if (!errors.isEmpty()) {
      // 出现错误。使用清理后的值/错误信息重新渲染表单
      res.render("genre_form", {
        title: "新建类别",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // 表格中的数据有效
      // 检查是否存在同名的 Genre
      const genreExists = await Genre.findOne({ name: req.body.name })
        .collation({ locale: "en", strength: 2 })
        .exec();
      if (genreExists) {
        res.render("genre_form", { title: "更新类别", genre: await Genre.findById(req.params.id), errors: [{ msg: "该类型已存在" }] });
      } else {

        // 更新作者信息
        await Genre.findByIdAndUpdate(req.params.id, genre);
        // 重定向到新的作者记录
        res.redirect(genre.url);

      }
    }
  }),
];

// 通过 GET 显示类别删除表单。
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  res.render("genre_delete", { title: "删除类别", books: await Book.find({ author: req.params.id }), genre: await Genre.findById(req.params.id) });
});
// 处理 POST 时的类别删除。
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  // res.send("未实现：类别删除 POST");



  let genre = await Genre.findById(req.body.genreid);
  let books = await Book.find({ genre: req.params.id });
  if (books.length > 0) {
    //这个类别还有书籍在引用，所以不能简单地直接删除，先显示他的书
    res.render("genre_delete", {
      title: "删除类别",
      genre,
      books,
    });
    return;
  }else{
    let result = await Genre.findOneAndDelete({
      _id: req.body.genreid
    });
    if (result) {
      res.redirect("/catalog/genres");
    } else {
      res.send("删除失败");
    }
  }

});

