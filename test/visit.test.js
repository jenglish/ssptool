/* global describe, it, process */

process.env.NODE_ENV = 'test';

/**
 * Purpose: try visiting all of the routes, 
 * verify that no errors are raised.
 */
var supertest = require('supertest')
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
        app.set('db', db);
        done(err, db);
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
