const BookInstance = require("../models/bookinstance");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

var Book = require("../models/book");
// 显示所有的 BookInstances
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.find().populate("book").exec();

  res.render("bookinstance_list", {
    title: "馆藏图书列表",
    bookinstance_list: allBookInstances,
  });
});
// 显示特定 BookInstance 的详情页

exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();

  if (bookInstance === null) {
    // 没有结果。
    const err = new Error("Book copy not found");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_detail", {
    title: "图书详情:",
    bookinstance: bookInstance,
  });
});

// 由 GET 显示创建 BookInstance 的表单
// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  let result = await Book.find({}, "title").exec();
  res.render("bookinstance_form", { title: "新建藏本", book_list: result });
});



// 由 POST 处理创建 BookInstance
// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate fields.
  body("book", "Book must be specified").isLength({ min: 1 }).trim(),
  body("imprint", "Imprint must be specified").isLength({ min: 1 }).trim(),
  body("due_back", "Invalid date").optional({ checkFalsy: true }).isISO8601(),

  // Sanitize fields.
  body("book").trim().escape(),
  body("imprint").trim().escape(),
  body("status").trim().escape(),
  body("due_back").toDate(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    var bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      try {
        let books = await Book.find({}, "title").exec();
        res.render("bookinstance_form", {
          title: "新建藏本",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance: bookinstance,
        });
      } catch (error) {
        return next(error);
      }

    } else {
      // Data from form is valid.
      try {
       await bookinstance.save();
		res.redirect(bookinstance.url);
      } catch (error) {
        return next(error);
      }

    }
  },
];


// 由 GET 显示删除 BookInstance 的表单
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  res.send("未实现：BookInstance 删除 GET");
});

// 由 POST 删除 BookInstance
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  res.send("未实现：BookInstance 删除 POST");
});

// 由 GET 显示更新 BookInstance 的表单
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  res.send("未实现：BookInstance 更新 GET");
});

// 由 POST 处理更新 BookInstance
exports.bookinstance_update_post = asyncHandler(async (req, res, next) => {
  res.send("未实现：BookInstance 更新 POST");
});
