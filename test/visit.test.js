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

describe("Main areas", function () {
    it("/",             tryPage("/"))
    it("/controls",     tryPage("/controls"))
    it("/components",   tryPage("/components"))
});

describe("Control pages", function () {
    it("finds control pages", tryPage("/controls/AU-1"))
    it("returns proper error code for missing pages", function (done) {
        agent.get("/controls/XX-99").expect(404).end(done)
    })
});
describe("Component pages", function () {
    it("finds component pages", tryPage("/components/AU_policy"))
    it("returns proper error code for missing pages", function (done) {
        agent.get("/components/XX-Policy").expect(404).end(done)
    })
});
describe("Crawl the TOC", function () {
    const { NavIndex, NavItem } = require('../lib/navigation');
    const async = require('async');
    var navindex;
    it("has a navigation index", function () {
        navindex = app.get('navindex');
        expect(navindex).to.be.a(NavIndex);
        expect(navindex.toc).to.be.a(NavItem);
    });

    it("can serve all pages in the TOC", function (done) {
        var tasks = []
        for (var item = navindex.toc; item; item = item.next()) {
            tasks.push(tryPage(item.path))
        };
        async.series(tasks, done);
    });
});

