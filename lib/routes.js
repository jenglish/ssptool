
const Sitemap = require('../lib/navigation/sitemap').Sitemap;
const _ = require('lodash');
const { nest } = require('./util');
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

/** Response handler for TOC pages.
 *  All information is taken from the sitemap.
 */
function contentsPage (req, res, next) {
    var sitemap = req.app.get('sitemap');
    res.locals.toplinks = sitemap.toplinks;
    res.locals.nav = sitemap.navinfo(req.path);
    if (res.locals.nav) {
        res.render('contents');
    } else {
        next(notfound('page', req.path));
    }
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

function populateSatisfaction(db, sat) {
    try {
        sat.control = db.controls.findByKey(sat.standard_key,sat.control_key);
    } catch (err) { debug('this is not an error', err); }
    sat.component = db.components.findByKey(sat.component_key); // can't fail
    return sat;
}

var findControl = (db, params) => ({
    control: db.controls.findByKey(params.standard, params.control),
    satisfied: db.satisfactions.chain()
        .filter({ standard_key: params.standard, control_key: params.control })
        .sortBy('component_key')
        .map(sat => populateSatisfaction(db, sat))
        .value(),
    certifications: db.certifications.chain()
        .filter({standard_key: params.standard, control_key: params.control })
        .value(),
});

var findComponent = (db, params) => ({
    component: db.components.findByKey(params.component),
    satisfies: db.satisfactions.chain()
        .filter({ component_key: params.component })
        .sortBy(['standard_key', 'control_key'])
        .map(sat => populateSatisfaction(db, sat))
        .value(),
});

/************************************************************************
 ***
 *** Routes
 ***
 ***/

/** Constructs links to various application entities based on primary key.
 *  @note also available in res.locals.
 */
const linkto = {
    component: (component)      => appurl('components', component),
    standard: (standard)        => appurl('standards', standard),
    control: (standard,control) => appurl('standards', standard, control),
    family: (standard,family)   => appurl('family', standard, family),
};

appurl.component = component => linkto.component(component.key);
appurl.control = control => linkto.control(control.standard_key, control.key);

router.get('/', sendpage('index'));

router.get('/components', contentsPage);
router.get('/components/:component',
    runquery(findComponent), sendpage('component'));

router.get('/standards', contentsPage);
router.get('/standards/:standard_key', contentsPage);
router.get('/standards/:standard/:control',
        runquery(findControl), sendpage('control'));

router.get('/family/:standard_key/:family', contentsPage);

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
            site.begin(linkto.family(standard_key, family), family);
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
module.exports.linkto = linkto;
