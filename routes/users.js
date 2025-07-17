var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.get('/cool/:myid', function(req, res, next) {
  res.send(req.params.myid+"has copy");
});
module.exports = router;
