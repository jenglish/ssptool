
const Sitemap = require('../lib/navigation/sitemap').Sitemap;
const _ = require('lodash');
const debug = require('debug')('routes');

var router = require('express').Router();

/************************************************************************
 ***
 *** Utilities
 ***
 ***/

/** Utility function for constructing an application url from path components
 *
 * @note also available in res.locals (see app.initialize)
 */

function appurl (...args) {
    return '/' + _.map(args, encodeURIComponent).join('/');
}

/** Construct a 404 Error that may be thrown from a query function
 *  or passed to next() from a middleware function
 *
 * @param what - type of thing that wasn't found
 * @param name - name of thing that wasn't found
 */

function notfound (what, name) {
    var err = new Error(what + ' ' + (name || '') + ' not found');
    err.status = 404;
    return err;
}

/** Multi-level _.groupBy.
*/
function nest (collection, keys) {
    var result = _.groupBy(collection, keys[0]);
    var rest = keys.slice(1);
    if (rest.length) {
        for (var group in result) {
            result[group] = nest(result[group], rest);
        }
    }
    return result;
}


/** Route middleware constructor.
 *  Render specified view.
 *  If req.path is in the sitemap, navigation information will be added.
 */
function sendpage (view) {
    return function(req, res) {
        var sitemap = req.app.get('sitemap');
        res.locals.toplinks = sitemap.toplinks;
        res.locals.nav = sitemap.navinfo(req.path);
        res.render(view);
    };
}

/** Route middleware constructor.
 *  Render specified view. req.path must be in the sitemap.
 */
function tocpage (view) {
    return function(req, res, next) {
        var sitemap = req.app.get('sitemap');
        res.locals.toplinks = sitemap.toplinks;
        res.locals.nav = sitemap.navinfo(req.path);
        if (res.locals.nav) {
            res.render(view);
        } else {
            next(notfound('page', req.path));
        }
    };
}

/** Route middleware constructor
 *
 *  @param qf - query function.
 *
 * qf takes an opencontrol#Database and the query parameters
 * and returns a hash. All keys in the hash are added to res.locals.
 */
function runquery (qf) {
    return function (req, res, next) {
        try {
            let db = req.app.get('db');
            let ans = qf(db, req.params);
            _.forEach(ans, (v,k) => res.locals[k] = v);
        } catch (err) {
          return next(err);
        }
        next();
    };
}

/************************************************************************
 ***
 *** Queries
 ***
 ***/

var findControl = (db, params) => ({
    control: db.controls.findByKey(params.standard, params.control)
});
var listComponents = (db, _params) => ({
    components: db.components.records
});
var findComponent = (db, params) => ({
    component: db.components.findByKey(params.component)
});

/************************************************************************
 ***
 *** Routes
 ***
 ***/

router.get('/', sendpage('index'));

router.get('/components',
    runquery(listComponents), sendpage('components'));

router.get('/components/:component',
    runquery(findComponent), sendpage('component'));
appurl.component = component => appurl('components', component.key);

router.get('/standards', tocpage('contents'));
router.get('/standards/:standard_key', tocpage('contents'));
appurl.standard = standard => appurl('standards', standard.key);

router.get('/standards/:standard/:control',
        runquery(findControl), sendpage('control'));
appurl.control = control =>
        appurl('standards', control.standard_key, control.key);

router.get('/family/:standard_key/:family', tocpage('contents'));
appurl.family = (standard_key, family) => appurl('family', standard_key, family);

/************************************************************************
 ***
 *** Table of contents.
 ***
 ***/

function sitemap (db) {
    var site = new Sitemap;

    site.begin('/components', 'Components');
    for (var component of db.components.records) {
        site.add(appurl.component(component), component.key, component.name);
    }
    site.end();

    site.begin('/standards', 'Standards');
    _(nest(db.controls.records, ['standard_key', 'family']))
    .forEach(function (group, standard_key) {
        debug('creating toc for standard %s', standard_key);
        site.begin(appurl('standards', standard_key), standard_key);
        _(group).forEach(function (controls, family) {
            debug('creating subtoc for family %s', family);
            site.begin(appurl.family(standard_key, family), family);
            _(controls).forEach(function (control) {
                debug('creating tocentry for %s', control.key);
                site.add(appurl.control(control),
                    control.key, control.key + ' - ' + control.name);
                });
            site.end();
        });
        site.end();
    });
    site.end();

    return site;
}

module.exports.router = router;
module.exports.sitemap = sitemap;
module.exports.appurl = appurl;

