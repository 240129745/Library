const Author = require("../models/author");
const asyncHandler = require("express-async-handler");
const Book = require("../models/book");
const {
    body,
    validationResult
} = require("express-validator");
// 显示完整的作者列表
// Display list of all Authors.
exports.author_list = async function (req, res, next) {

    try {
        let list_authors = await Author.find()
            .sort({
                family_name: 1
            })
            .exec();

        res.render("author_list", {
            title: "名家榜",
            author_list: list_authors,
        });
    } catch (error) {
        next(error);
    }

};

// 为每位作者显示详细信息的页面

// 呈现指定作者的详情页。
exports.author_detail = asyncHandler(async (req, res, next) => {
    // （并行地）获取作者的详细信息及其所有作品
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id),
        Book.find({
            author: req.params.id
        }, "title summary"),
    ]);

    if (author === null) {
        // 没有结果。
        const err = new Error("Author not found");
        err.status = 404;
        return next(err);
    }

    res.render("author_detail", {
        title: "作者详情页",
        author: author,
        author_books: allBooksByAuthor,
    });
});

// 由 GET 显示创建作者的表单

exports.author_create_get = (req, res, next) => {
    res.render("author_form", {
        title: "新建作者"
    });
};

// 处理 POST 方法提交的创建作者表单
exports.author_create_post = [
    // 验证并且清理字段
    body("first_name")
        .trim()
        .isLength({
            min: 1
        })
        .escape()
        .withMessage("First name must be specified."),
    body("family_name")
        .trim()
        .isLength({
            min: 1
        })
        .escape()
        .withMessage("Family name must be specified."),
    body("date_of_birth", "Invalid date of birth")
        .optional({
            values: "falsy"
        })
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid date of death")
        .optional({
            values: "falsy"
        })
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid date of death")
        .optional({
            values: "falsy"
        })
        .isISO8601()
        .toDate(),

    // 在验证和修整完字段后处理请求
    asyncHandler(async (req, res, next) => {
        // 从请求中提取验证错误
        const errors = validationResult(req);

        // 使用经转义和去除空白字符处理的数据创建作者对象
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
        });

        if (!errors.isEmpty()) {
            // 出现错误。使用清理后的值/错误信息重新渲染表单
            res.render("author_form", {
                title: "新建作者",
                author: author,
                errors: errors.array(),
            });
            return;
        } else {
            // 表格中的数据有效

            // 保存作者信息
            await author.save();
            // 重定向到新的作者记录
            res.redirect(author.url);
        }
    }),
];

// 由 GET 显示删除作者的表单
exports.author_delete_get = asyncHandler(async (req, res, next) => {
    //res.send("未实现：删除作者的 Get,但已收到你传过来的id:" + req.params.id);
    let author = await Author.findById(req.params.id);
    let authors_books = await Book.find({
        author: req.params.id
    });
    if (!author) {
        res.redirect("/catalog/authors");
    }
    res.render("author_delete", {
        title: "删除作者",
        author: author,
        author_books: authors_books,
    });
});

// 由 POST 处理作者删除操作
exports.author_delete_post = asyncHandler(async (req, res, next) => {
    try {
        // res.send("未实现：删除作者的 POST,但已收到你传过来的id:" + req.params.id);
        let author = await Author.findById(req.body.authorid);
        if (!author) {
            res.send("没找到这位作者！");
        }
        let books = await Book.find({
            author: req.body.authorid
        });
        if (books.length > 0) {
            //这个作者还有书籍在引用，所以不能简单地直接删除，先显示他的书
            res.render("author_delete", {
                title: "删除作者",
                author: author,
                author_books: books,
            });
            return;
        } else {

            let result = await Author.findOneAndDelete({
                _id: req.body.authorid
            });
            if (result) {
                res.redirect("/catalog/authors");
            } else {
                res.send("删除失败");
            }

        }
    } catch (err) {
        res.send("操作失败，可能是网络中断了。", err.message);
    }

});

// 由 GET 显示更新作者的表单
// exports.author_update_get = asyncHandler(async (req, res, next) => {
//     // res.send("未实现：更新作者的 GET");
//     var author = await Author.findById(req.params.id).exec();


//     var plainAuthor = author.toObject();//将mongoose对象转换为普通对象,不然不好写入
//     if (plainAuthor.date_of_birth instanceof Date && !isNaN(plainAuthor.date_of_birth)) {
//         plainAuthor.date_of_birth = plainAuthor.date_of_birth.toISOString().split('T')[0];//.toISOString().split('T')[0]取得YYYY-MM-DD格式才能正确显示

//     }
//     if (plainAuthor.date_of_death instanceof Date && !isNaN(plainAuthor.date_of_death)) {
//         plainAuthor.date_of_death = plainAuthor.date_of_death.toISOString().split('T')[0];//.toISOString().split('T')[0]取得YYYY-MM-DD格式才能正确显示

//     }
//     res.render("author_form", {
//         title: "更新作者",
//         author
//     });
// });

// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
  const author = await Author.findById(req.params.id).exec();
  if (author === null) {
    // No results.
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }

  res.render("author_form", { title: "Update Author", author });
});


// 由 POST 处理作者更新操作
exports.author_update_post = asyncHandler(async (req, res, next) => {
    res.send("未实现：更新作者的 POST");
});
