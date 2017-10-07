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
  , path = require('path')
  , datadir = path.join(__dirname, 'opencontrols')
  ;

function tryPage (url) {
    return function (done) {
	agent.get(url).expect(200).end(done);
    }
}

before(function (done) {
    opencontrol.load(datadir, function (err, db) {
	app.set('db', db);
	done(err, db);
    })
});

describe("Main areas", function () {
    it("/", 		tryPage("/"))
    it("/controls",	tryPage("/controls"))
    it("/components",	tryPage("/components"))
});
