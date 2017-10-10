
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
    return "/" + _.map(args, encodeURIComponent).join("/");
}

/** Route middleware constructor
 */
function sendpage (view) {
    return function(req, res, next) {
        var sitemap = req.app.get('sitemap');
        res.locals.nav = sitemap.navinfo(req.path);
	res.locals.toplinks = sitemap.toplinks;
        res.render(view);
    }
}

/** Route middleware constructor
 *
 *  @param qf - query function.
 *
 * qf takes a @{link opencontrol.Database} and the query parameters
 * and returns a hash. All keys in the hash are added to res.locals.
 */
function runquery (qf) {
    return function (req, res, next) {
        try {
            let db = req.app.get('db');
            let ans = qf(db, req.params)
            _.forEach(ans, (v,k) => res.locals[k] = v);
        } catch (err) {
          return next(err);
        }
        next();
    }
}

/** Construct a 404 Error that may be thrown from a query function
 *
 * @param what - type of thing that wasn't found
 * @param name - name of thing that wasn't found
 */

function notfound (what, name) {
    var err = new Error(what + ' ' + name + ' not found');
    err.status = 404;
    return err;
}

/************************************************************************
 ***
 *** Queries
 ***
 ***/
function findByKey(what, collection, params) {
    var key = params[what], ans = {};
    if (_.has(collection, key)) {
        ans[what] = collection[key];
    } else {
        throw notfound('control', key);
    }
    return ans;
}

function listControls (db, params) {
    return { controls: _.values(db.controls) }
}
function findControl (db, params) {
    return findByKey('control', db.controls, params);
}
function listComponents (db, params) {
    return { components: _.values(db.components) }
}
function findComponent (db, params) {
    return findByKey('component', db.components, params);
}

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

router.get('/standards', sendpage('contents'));
router.get('/standards/:standard_key', sendpage('contents'));
appurl.standard = standard => appurl('standards', standard.key);

router.get('/standards/:standard_key/:control',
        runquery(findControl), sendpage('control'))
appurl.control = control =>
        appurl('standards', control.standard_key, control.key);

router.get('/family/:standard_key/:family', sendpage('contents'));
appurl.family = (standard_key, family) => appurl('family', standard_key, family);

/************************************************************************
 ***
 *** Table of contents.
 ***
 ***/

function sitemap (db) {
    var site = new Sitemap;

    site.begin('/components', 'Components');
    for (component of _.values(db.components)) {
        site.add(appurl.component(component), component.key, component.name);
    }
    site.end();

    site.begin('/standards', 'Standards');
    _(db.controls)
    .values()
    .groupBy('standard_key')
    .forEach(function (controls, standard_key) {
        site.begin(appurl('standards', standard_key), standard_key);
        _(controls).groupBy('family')
        .forEach(function (controls, family) {
            site.begin(appurl.family(standard_key, family), family);
            _(controls).forEach(function (control) {
                site.add(appurl.control(control),
                    control.key, control.key + " - " + control.name)
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

