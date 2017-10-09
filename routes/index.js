
const { NavItem, NavIndex } = require('../lib/navigation');
const _ = require('lodash');
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
        var navindex = req.app.get('navindex');
        res.locals.nav = navindex.navinfo(req.path);
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
router.get('/controls', runquery(listControls), sendpage('controls'));
router.get('/components', runquery(listComponents), sendpage('components'));

router.get('/controls/:control', runquery(findControl), sendpage('control'));
router.get('/components/:component', runquery(findComponent), sendpage('component'));

/************************************************************************
 ***
 *** Table of contents.
 ***
 ***/

function navindex (db) {
    var toc = new NavItem('/', '/');
    var item;

    item = new NavItem('/components', 'Components');
    for (component of _.values(db.components)) {
        item.add(new NavItem(appurl('components', component.key),
                component.key, component.name));
    }
    toc.add(item)

    item = new NavItem('/controls', 'Controls');
    for (control of _.values(db.controls)) {
        item.add(new NavItem(appurl('controls', control.key),
                control.key, control.key + " - " + control.name));
    }
    toc.add(item)

    return new NavIndex(toc);
}

module.exports.router = router;
module.exports.navindex = navindex;
module.exports.appurl = appurl;

