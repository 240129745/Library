const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const {
    body,
    validationResult
} = require("express-validator");
//const { body } = require("express-validator");

const asyncHandler = require("express-async-handler");
const book = require("../models/book");

exports.index = asyncHandler(async (req, res, next) => {
    // 并行获取书的详细信息、书实例、作者和体裁的数量
    const [
        numBooks,
        numBookInstances,
        numAvailableBookInstances,
        numAuthors,
        numGenres,
    ] = await Promise.all([
        Book.countDocuments({}).exec(),
        BookInstance.countDocuments({}).exec(),
        BookInstance.countDocuments({
            status: "Available"
        }).exec(),
        Author.countDocuments({}).exec(),
        Genre.countDocuments({}).exec(),
    ]);

    res.render("index", {
        title: "玉林图书馆",
        book_count: numBooks,
        book_instance_count: numBookInstances,
        book_instance_available_count: numAvailableBookInstances,
        author_count: numAuthors,
        genre_count: numGenres,
    });
    // res.send("异步在执行")
});

// 呈现数据库中所有书本的列表
exports.book_list = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, "title author")
        .sort({
            title: 1
        })
        .populate("author")
        .exec();

    res.render("book_list", {
        title: "书籍清单",
        book_list: allBooks
    });
});

// 显示特定书籍的详细信息页面。
exports.book_detail = asyncHandler(async (req, res, next) => {
    // 获取书籍的详细信息，以及特定书籍的实例
    const [book, bookInstances] = await Promise.all([
        Book.findById(req.params.id).populate("author").populate("genre").exec(),
        BookInstance.find({
            book: req.params.id
        }).exec(),
    ]);

    if (book === null) {
        // 没有结果。
        const err = new Error("Book not found");
        err.status = 404;
        return next(err);
    }

    res.render("book_detail", {
        title: book.title,
        book: book,
        book_instances: bookInstances,
    });
});

// 通过 GET 显示创建图书。
// Display book create form on GET.
exports.book_create_get = async function (req, res, next) {
    try {
        const authors = await Author.find({});
        const genres = await Genre.find({});
        res.render("book_form", {
            title: "新建图书",
            authors,
            genres
        });
    } catch (err) {
        return next(err);
    }

};

// 以 POST 方式处理创建图书。
// Handle book create on POST.
exports.book_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === "undefined")
                req.body.genre = [];
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate fields.
    body("title", "Title must not be empty.").isLength({
        min: 1
    }).trim(),
    body("author", "Author must not be empty.").isLength({
        min: 1
    }).trim(),
    body("summary", "Summary must not be empty.").isLength({
        min: 1
    }).trim(),
    body("isbn", "ISBN must not be empty").isLength({
        min: 1
    }).trim(),

    // Sanitize fields (using wildcard).
    body("*").trim().escape(),
    body("genre.*").escape(),
    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped and trimmed data.
        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre,
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function (callback) {
                    Author.find(callback);
                },
                genres: function (callback) {
                    Genre.find(callback);
                },
            },
                function (err, results) {
                    if (err) {
                        return next(err);
                    }

                    // Mark our selected genres as checked.
                    for (let i = 0; i < results.genres.length; i++) {
                        if (book.genre.indexOf(results.genres[i]._id) > -1) {
                            results.genres[i].checked = "true";
                        }
                    }
                    res.render("book_form", {
                        title: "新建图书",
                        authors: results.authors,
                        genres: results.genres,
                        book: book,
                        errors: errors.array(),
                    });
                },);
            return;
        } else {
            // Data from form is valid. Save book.
            book.save();
            //successful - redirect to new book record.
            res.redirect(book.url);

        }
    },
];

// 通过 GET 显示删除图书。
exports.book_delete_get = asyncHandler(async (req, res, next) => {
    let id = req.params.id;
    let book = await Book.findById(id);
    let bookInstances = await BookInstance.find({ book: id }).populate("book");

    if (!book) {
        res.send(`指定的${id}的书不存在`);
    }
    res.render("book_delete", {
        title: "删除图书",
        book: book,
        bookInstances: bookInstances
    });
});

// 以 POST 方式处理删除图书。
exports.book_delete_post = asyncHandler(async (req, res, next) => {
    let bookInstances = await BookInstance.find({ book: req.body.bookid }).populate("book");
    if (bookInstances.length == 0) {
        let result = await Book.findByIdAndDelete(req.body.bookid);
        if (result) {
            res.redirect("/catalog/books");
        }else{
            res.send("删除失败");
        }
    }

});

// 通过 GET 显示更新图书。
exports.book_update_get = asyncHandler(async (req, res, next) => {

    let book = await Book.findById(req.params.id).populate("author").populate("genre");
    let authors = await Author.find();
    let genres = await Genre.find();
    if (!book) {
        res.send(`指定的${req.params.id}的书不存在`);
    }

    for (let i = 0; i < genres.length; i++) {
        for (let j = 0; j < book.genre.length; j++) {
            if (
                genres[i]._id.toString() == book.genre[j]._id.toString()) {
                genres[i].checked = "true";
            }
        }
    }
    res.render("book_form", {
        title: "更新图书",
        authors: authors,
        genres: genres,
        book: book,
    });

});

// 处理 POST 时的更新图书。
exports.book_update_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === "undefined")
                req.body.genre = [];
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },
    body("title", "Title must not be empty.").isLength({
        min: 1
    }).trim(),
    body("author", "Author must not be empty.").isLength({
        min: 1
    }).trim(),
    body("summary", "Summary must not be empty.").isLength({
        min: 1
    }).trim(),
    body("isbn", "ISBN must not be empty").isLength({
        min: 1
    }).trim(),

    // Sanitize fields.
    body("title").trim().escape(),
    body("author").trim().escape(),
    body("summary").trim().escape(),
    body("isbn").trim().escape(),
    body("genre.*").trim().escape(),

    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
            _id: req.params.id, //This is required, or a new ID will be assigned!
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.


            async.parallel({
                authors: function (callback) {
                    Author.find(callback);
                },
                genres: function (callback) {
                    Genre.find(callback);
                },
            },
                function (err, results) {
                    if (err) {
                        return next(err);
                    }

                    // Mark our selected genres as checked.
                    for (let i = 0; i < results.genres.length; i++) {
                        if (book.genre.indexOf(results.genres[i]._id) > -1) {
                            results.genres[i].checked = "true";
                        }
                    }
                    res.render("book_form", {
                        title: "更新图书",
                        authors: results.authors,
                        genres: results.genres,
                        book: book,
                        errors: errors.array(),
                    });
                },);

            return;
        } else {
            // Data from form is valid. Update the record.
            Book.findByIdAndUpdate(req.params.id, book, {
                new: true
            }).then((thebook) => {
                if (!thebook) {
                    return res.status(422).send('Book not found');
                }
                res.redirect(thebook.url);
            })
                .catch((err) => {
                    return next(err);
                });
        }
    },

];
