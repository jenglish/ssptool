/* global describe, it, process */

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
  ;

function tryPage (url) {
    return function (done) {
        agent.get(url).expect(200).end(done);
    }
}

before(function (done) { mock.preflight(done); });
before(function (done) {
    opencontrol.load(mock.datadir, function (err, db) {
        if (err) { return done(err); }
        app.initialize(db);
        done();
    })
});

describe("Proper 404 handling", function () {
    it("returns 404 for missing pages", function (done) {
        agent.get("/no/such/page").expect(404).end(done)
    });
});

describe("Component pages", function () {
    it("finds component pages", tryPage("/components/AU_policy"))
    it("returns proper error code for missing pages", function (done) {
        agent.get("/components/XX-Policy").expect(404).end(done)
    })
});
describe("Crawl the whole site", function () {
    const { Sitemap, NavItem } = require('../lib/navigation/sitemap');
    const async = require('async');
    var sitemap;

    it("has a sitemap", function () {
        sitemap = app.get('sitemap');
        expect(sitemap).to.be.a(Sitemap);
    });

    it("can serve all pages in the sitemap", function (done) {
        var tasks = []
	for (var item in sitemap.items) {
            tasks.push(tryPage(item))
        };
        async.series(tasks, done);
    });
});

