/** @file ssptool web app.
 */

var express = require('express')
  , path = require('path')
  , favicon = require('serve-favicon')
  , logger = require('morgan')
  , package = require('./package.json')
  , routes = require('./lib/routes')
  , graphql = require('./lib/graphql')
  , loadConfig = require('./lib/config').load
  , loadOpenControl = require('./lib/opencontrol').load
  , mdparser = require('./lib/opencontrol/mdparser')
  , app = express()
  ;

function basepath (p) { return path.join(__dirname, p); }

/** Add logging middleware based on NODE_ENV
 */
function chooseLogger (app) {
    let env = app.get('env');
    if (env === 'development') {
        app.use(logger('dev'));
    } else if (env !== 'test') {
        app.use(logger('combined'));
    }
}

/** Terminal route handler.
 *  Issues 404 error if no other routes match.
 */
function notFoundHandler (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
}

/** Terminal error handler.
 *  Last handler in chain, shows error page.
 */
function errorHandler (err, req, res, next) {
    if (res.headersSent) { return next(err); }
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.locals.path = req.path;
    res.status(err.status || 500);
    res.render('error');
}

/** Route middleware for navinfo.
 *
 * Looks up req.path in the Sitemap,
 * sets res.locals.navinfo if found.
 * It is not an error if the path is not present in the sitemap;
 * res.locals.navinfo is null in that case.
 */
function navigationMiddleware (req, res, next) {
    const sitemap = req.app.get('sitemap');
    res.locals.navinfo = sitemap && sitemap.navinfo(req.path);
    next();
}

app.set('views', basepath('views'));
app.set('view engine', 'pug');

app.locals.appname = package.name;
app.locals.appversion = package.version;
app.locals.apphomepage = package.homepage;

/**
 * Initialize application.
 *
 * @param (Config) configuration.
 * @param (opencontrol.Database) db
 */
app.initialize = function (config, db) {
    app.use(favicon(basepath('public/favicon.ico')));
    chooseLogger(app);

    app.use(express.static(basepath('public'), { maxAge: 1000 * 60 * 60 }));
    app.use('/graphql', graphql.middleware);
    app.use(navigationMiddleware);
    app.use(routes.router);
    app.use('/pages',  express.static(config.docdir));
    app.use('/assets', express.static(config.assetsdir||'./assets'));
    app.post('/reload', reload);

    app.use(notFoundHandler);
    app.use(errorHandler);

    app.reinitialize(config, db);
};

/**
 * (re)initialize site map.
 *
 * @param (Config) config
 * @param (opencontrol.Database) db
 */
app.reinitialize = function (config, db) {
    const sitemap = routes.buildSite(config, db);

    app.set('config', config);
    app.set('db', db);
    app.set('sitemap', sitemap);

    app.locals.config = config;
    app.locals.appurl = routes.appurl;
    app.locals.linkto = routes.linkto;
    app.locals.markdown = mdparser.parse;
    app.locals.toplinks = sitemap.toplinks;
};

/** POST /reload
 */
function reload (req, res, next) {
    let returnPath = req.header('Referer') || routes.appurl('')
      , config = req.app.get('config')
      , reloadConfig = (config, cb) => config._configfile
        ? loadConfig(config._configfile, cb)
        : cb(null,config)
    ;

    reloadConfig(config, (err, config) =>
        err ? next(err) : loadOpenControl(config, (err, db) => {
            if (err) return next(err);
            app.reinitialize(config, db);
            res.redirect(303, returnPath);
        })
    );
}

module.exports = app;
