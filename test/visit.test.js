
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

/**
 * add context to error messages.
 */
function errorContext (context, next) {
    return function (err, ans) {
        if (err) { err.message = context + ': ' + err.message; }
        next(err, ans);
    };
}

function tryPage (path) {
    return function (done) {
        agent.get(path)
            .expect(200)
            .expect('content-type', /html/)
            .end(errorContext(path, done));
    };
}

/**
 * Check for correct 404 responses.
 */
function badPage (path) {
    return function (done) {
        agent.get(path)
            .expect(404)
            .expect('content-type', /html/)
            .end(errorContext(path,done));
    };
}

before(function (done) { mock.preflight(done); });
before(function (done) {
    opencontrol.load(mock.config, function (err, db) {
        if (err) { return done(err); }
        app.initialize(mock.config, db);
        done();
    });
});

// SEEALSO: routes.js, keep in sync.
describe('Proper 404 handling', function () {
    it('returns 404 for missing pages', badPage('/no/such/page'));
    it('handles missing components', badPage('/components/XX-Policy'));
    it('handles missing standards',  badPage('/standards/no-such-standard'));
    it('handles missing pages',  badPage('/pages/no-such-page'));
    it('handles missing reports',  badPage('/reports/no-such-report'));
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
        this.timeout(5000); // can take a while on slow machines
        var tasks = [];
        for (var item in sitemap.items) {
            tasks.push(tryPage(item));
        }
        async.series(tasks, done);
    });

    it('can find all expected controls', function (done) {
        const linkto = app.locals.linkto;
        const standard_key = expected.standard;
        var tasks = [];
        expected.controls.forEach(control_key =>
            tasks.push(tryPage(linkto.control(standard_key, control_key))));
        async.series(tasks, done);
    });

    it('serves non-markdown assets in /pages', function (done) {
        var path = '/pages/docs/Waterfall_model.png';
        agent.get(path)
            .expect(200)
            .expect('content-type', /png/)
            .end(errorContext(path, done));
    });

    it('serves non-markdown assets in /assets', function (done) {
        var path = '/assets/cat-picture.svg';
        agent.get(path)
            .expect(200)
            .expect('content-type', /svg/)
            .end(errorContext(path, done));
    });

    it('serves JSON schema documents', function (done) {
        async.series(
            ['standard', 'certification', 'component'].map(schema => k => {
                agent.get('/schemas/' + schema + '.json')
                    .expect(200)
                    .end(k);
            }), done);
    });

});

describe('See if documents work', function () {
    it('can build and send a document', function (done) {
        const linkto = app.locals.linkto;
        tryPage(linkto.document('doc1'))(done);
    });
});

describe('See if reload works', function () {
    it('responds to /reload route', function (done) {
        agent.post('/reload')
            .expect(303)
            .expect('location', '/')
            .end(done);
    });
});

