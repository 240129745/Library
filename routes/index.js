var express = require('express');
var router = express.Router();

/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.send(new Date().toLocaleString());
// });
router.get("/", (req, res) => {
  res.redirect("/catalog");
});
module.exports = router;
