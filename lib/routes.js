/** @file Defines webapp site structure and URI space.
 */

const _ = require('lodash')
  , navigation = require('../lib/navigation')
  , Sitemap = navigation.Sitemap
  , nest = require('./util').nest
  , reports = require('./reports')
  , debug = require('debug')('routes')
  ;

var router = require('express').Router()
  , sitemap = new Sitemap()
  ;

/************************************************************************
 ***
 *** Utilities
 ***
 ***/

/** Constructs an application url from path components
 *
 * Note: also available in res.locals (see app.initialize)
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

/**
 * Ensure that value is non-null, throws 404 error if not.
 * @param {?any} value
 * @return {!any} value
 * @throws {Error}
 */
function assertFound (value) {
    if (!value) {
        var err = new Error('not found');
        err.status = 404;
        throw err;
    }
    return value;
}

/** Route middleware constructor.
 *  Render specified view.
 *  If req.path is in the sitemap, navigation information will be added.
 */
function sendpage (view) {
    return function(req, res) {
        res.render(view);
    };
}

/** Response handler for TOC pages.
 *  All information is taken from the sitemap.
 */
function contentsPage (req, res, next) {
    if (res.locals.navinfo) {
        res.render('contents');
    } else {
        next(notfound('page', req.path));
    }
}

/** Route middleware constructor
 *
 *  @param {function(Database):Object} qf - query function.
 *
 * qf takes an opencontrol.Database and the query parameters
 * and returns a hash. All keys in the hash are added to res.locals.
 * qf may throw an exception to signal errors.
 */
function runquery (qf) {
    return function (req, res, next) {
        try {
            let db = req.app.get('db');
            let ans = qf(db, req.params);
            _.forEach(ans, (v,k) => res.locals[k] = v);
        } catch (err) {
          res.locals.params = req.params;
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
    control: assertFound(db.controls.findByKey(params.standard,params.control)),
    satisfied: db.satisfactions.chain()
        .filter({ standard_key: params.standard, control_key: params.control })
        .sortBy('component_key')
        .map(sat => db.satisfactions.populate(sat))
        .value(),
    certifications: db.certifications.chain()
        .filter({ standard_key: params.standard, control_key: params.control })
        .value(),
});

var findComponent = (db, params) => ({
    component: assertFound(db.components.findByKey(params.component)),
    satisfies: db.satisfactions.chain()
        .filter({ component_key: params.component })
        .sortBy(['standard_key', 'control_key'])
        .map(sat => db.satisfactions.populate(sat))
        .value(),
});

// NB: matched against route /pages/*, tail of path is params[0].
var findPage = (db, params) => ({
    page: assertFound(db.pages.chain().find({ relative: params[0] }).value())
});

var generateReport = (db, params) => {
    var report = assertFound(reports[params.report]);
    return {
        report: report,
        records: report.query(db)
    };
};

/************************************************************************
 ***
 *** Routes
 ***
 ***/

/** Constructs links to various application entities based on primary key.
 *  Note: also available in res.locals.
 */
const linkto = {
    component: (component)      => appurl('components', component),
    standard: (standard)        => appurl('standards', standard),
    control: (standard,control) => appurl('standards', standard, control),
    certification: (cert)       => appurl('certifications', cert),
    family: (standard,family)   => appurl('family', standard, family),
    page: (relative)            => '/pages/' + relative,

    // Controls may appear in multiple places -
    // primary location in /standards/:standard/:control,
    // secondary appearances under /certifications/
    pcontrol: (certification, standard_key, control_key) =>
        appurl('certifications', certification, standard_key, control_key),
};

appurl.component = component => linkto.component(component.key);
appurl.control = control => linkto.control(control.standard_key, control.key);
appurl.page = page => linkto.page(page.relative);

router.use(navigation.middleware(sitemap));

router.get('/', sendpage('index'));

router.get('/pages', contentsPage);
router.get('/pages/*', runquery(findPage), sendpage('page'));

router.get('/components', contentsPage);
router.get('/components/:component',
    runquery(findComponent), sendpage('component'));

router.get('/standards', contentsPage);
router.get('/standards/:standard_key', contentsPage);
router.get('/standards/:standard/:control',
        runquery(findControl), sendpage('control'));

router.get('/family/:standard_key/:family', contentsPage);

router.get('/certifications', contentsPage);
router.get('/certifications/:certification', contentsPage);
router.get('/certifications/:certification/:stdfamily', contentsPage);
router.get('/certifications/:certification/:standard/:control',
        runquery(findControl), sendpage('control'));

router.get('/reports', contentsPage);
router.get('/reports/:report', runquery(generateReport), sendpage('report'));

/************************************************************************
 ***
 *** Table of contents.
 ***
 ***/

/** Add 'Pages' section.
 */
function addPages (db, site) {
    site.begin('/pages', 'Pages').topmost = true;
    for (var page of db.pages.records) {
        site.add(appurl.page(page), page.stem, page.data.title);
    }
    site.end();
}

/** Add 'Components' section.
 */
function addComponents (db, site) {
    site.begin('/components', 'Components').topmost = true;
    for (var component of db.components.records) {
        site.add(appurl.component(component), component.key, component.name);
    }
    site.end();
}

/** Add 'Standards' section.
 */
function addStandards (db, site) {
    site.begin('/standards', 'Standards').topmost = true;
    _(nest(db.controls.records, ['standard_key', 'family']))
    .forEach(function (group, standard_key) {
        debug('creating toc for standard %s', standard_key);
        site.begin(linkto.standard(standard_key), standard_key).topmost=true;
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
}

/** Add 'Certifications' section.
 * @todo rename this 'Profiles'
 */
function addCertifications (db, site) {
    site.begin('/certifications', 'Certifications').topmost = true;
    db.controls.chain()
    .flatMap(control =>
        db.certifications.chain()
        .filter({ standard_key:control.standard_key, control_key:control.key })
        .map(certification => _.assign({},certification, control))
        .value())
    .groupBy('certification')
    .forEach(function (certcontrols, certification) {
        debug('creating toc for certification %s (%d controls)',
                certification, certcontrols.length);
        site.begin(linkto.certification(certification), certification).topmost = true;
        _(certcontrols)
        .groupBy(control => control.standard_key + '-' + control.family)
        .forEach(function (controls, stdfamily) {
            debug('creating tocentry for %s', stdfamily);
            var label = controls[0].family;
            site.begin(appurl('certifications', certification, stdfamily),label);
            controls.forEach(control =>
                site.add(
                    linkto.pcontrol(
                        certification,
                        control.standard_key,
                        control.key),
                    control.key, control.key + ' - ' + control.name));
            site.end();
        });
        site.end();
    }).value();
    site.end();
}

/** Add 'Reports' section
 */
function addReports (db, site) {
    site.begin(appurl('reports'), 'Reports').topmost = true;
    for (var key in reports) {
        site.add(appurl('reports', key), key, reports[key].title);
    }
    site.end();
}

/** Populates the sitemap from information in the database.
 *  @param {opencontrol.Database} db
 */
function buildSite (db) {
    var site = sitemap;

    site.begin(appurl(), '/', 'Home');
    addStandards(db, site);
    addCertifications(db, site);
    addComponents(db, site);
    addPages(db, site);
    addReports(db, site);
    site.end();

    return site;
}

module.exports.router = router;
module.exports.sitemap = sitemap;
module.exports.appurl = appurl;
module.exports.linkto = linkto;
module.exports.buildSite = buildSite;

