/*! vim: set et sw=4 :*/

var express = require('express')
  , path = require('path')
  , favicon = require('serve-favicon')
  , logger = require('morgan')
  , package = require('./package.json')
  ;

var basepath = function (p) { return path.join(__dirname, p); }

var index = require('./routes/index');

var app = express();

app.set('views', basepath('views'));
app.set('view engine', 'pug');

app.use(favicon(basepath('public/favicon.ico')));
app.use(logger('dev'));
app.use(express.static(basepath('public')));

app.locals.appname = package.name;
app.locals.appversion = package.version;

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
