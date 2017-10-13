
process.env.NODE_ENV = 'test';

/**
 * Purpose: try visiting all of the routes,
 * verify that no errors are raised.
 */
var supertest = require('supertest')
  , expect = require('expect.js')
  , app = require('../app')
  , agent = supertest.agent(app)
  , opencontrol = require('../lib/opencontrol')
  , mock = require('../mock')
  , expected = mock.expected
  ;

function tryPage (path) {
    return function (done) {
        agent.get(path)
            .expect(200)
            .expect('content-type', /html/)
            .end(done);
    };
}

/**
 * Check for correct 404 responses.
 */
function badPage (url) {
    return function (done) {
        agent.get(url)
            .expect(404)
            .expect('content-type', /html/)
            .end(done);
    };
}

before(function (done) { mock.preflight(done); });
before(function (done) {
    opencontrol.load(mock.datadir, function (err, db) {
        if (err) { return done(err); }
        app.initialize(db);
        done();
    });
});

// SEEALSO: routes.js, keep in sync.
describe('Proper 404 handling', function () {
    it('returns 404 for missing pages', badPage('/no/such/page'));
    it('handles missing components', badPage('/components/XX-Policy'));
    it('handles missing standards',  badPage('/standards/no-such-standard'));
});

describe('Pages', function () {
    it('can load the root page', tryPage('/'));
    it('finds component pages', tryPage('/components/AU_policy'));
});

describe('Crawl the whole site', function () {
    const { Sitemap } = require('../lib/navigation/sitemap');
    const async = require('async');
    var sitemap;

    it('has a sitemap', function () {
        sitemap = app.get('sitemap');
        expect(sitemap).to.be.a(Sitemap);
    });

    it('can serve all pages in the sitemap', function (done) {
        var tasks = [];
        for (var item in sitemap.items) {
            tasks.push(tryPage(item));
        }
        async.series(tasks, done);
    });

    it('can find all expected controls', function (done) {
        const appurl = app.locals.appurl;
        const standard_key = expected.standard;
        var tasks = [];
        expected.controls.forEach(control_key =>
            tasks.push(tryPage(appurl('standards',standard_key,control_key))));
        async.series(tasks, done);
    });
});

