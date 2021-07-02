
var expect = require('expect.js')
  , mock = require('../mock')
  , expected = mock.expected
  , opencontrol = require('../lib/opencontrol')
  , { graphql } = require('graphql')
  , { schema, rootValue } = require('../lib/graphql.js')
  ;

var db;

/** Unwrap a graphql.ExecutionResult
 */
function gqlAnswer(result) {
    return new Promise((resolve, reject) =>
        result.errors ? reject(result.errors) : resolve(result.data));
}

/** Run GraphQL query against ssptool schema and mock database.
 *  @return Promise<Object> - ExecutionResult.data
 */
function doQuery(source, variableValues) {
    return graphql({
        source,
        schema,
        rootValue,
        variableValues,
        contextValue: { db },
    }).then(gqlAnswer);
}

before(function (done) { mock.preflight(done); });
before(function (done) {
    opencontrol.load(mock.config, function (err, _db) {
        db = _db;
        done(err, db);
    });
});

describe('GraphQL API', function () {
    describe('Controls', function () {

    it('... controls query', function () {
        return doQuery('query { controls { key name }}')
            .then(ans => {
                expect(ans).to.be.ok();
                expect(ans).to.have.property('controls');
                expect(ans.controls.length).to.equal(expected.controls.length);
            });
    });
    it('... standards query', function () {
        return doQuery('{ standards { key } }')
            .then(ans => {
                expect(ans).to.be.ok();
                expect(ans).to.have.property('standards');
                expect(ans.standards).to.have.length(1);
                expect(ans.standards[0]).to.have.property('key');
            });
    });
    it('... standard query', function () {
        const query = `
            query Q($key: String!) {
                standard(key: $key) {
                    controls {
                        key
                        name
                        satisfied_by { component_key }
                    }
                }
            }`;
        return doQuery(query, { key: expected.standard })
            .then(({ standard }) => {
                expect(standard).to.be.ok();
                expect(standard.controls.length)
                  .to.equal(expected.controls.length);
                standard.controls.forEach(c => {
                    expect(c.key).to.be.a('string');
                    expect(c.name).to.be.a('string');
                    expect(c.satisfied_by).to.be.an('array');
                });
            });
    });
    it('... control query', function () {
        const query = `
            query Q($standard_key: String!, $key: String!) {
              control(standard_key: $standard_key, key: $key) {
                key name description
              }
            }`;
        return doQuery(query, {
            standard_key: expected.standard,
            key: expected.controls[0]
        });
    });
    });

    describe('Components', function () {

    it('... list all components', function () {
        return doQuery(`
            query {
                components {
                    key
                    name
                    description
                    satisfies {
                        component_key
                        control {
                            key
                            description
                        }
                        narrative {
                            key
                            text
                        }
                    }
                }
            }
        `)
        .then(({ components }) => {
            expect(components).to.be.an('array');
        });
    });

    it('... component query', function () {
        return doQuery(`
            query Q($key: String!) {
                component(key: $key) { name description }
            }`, {
                key: 'moda'
            }
        ).then(({ component }) => {
            expect(component).to.be.ok();
            expect(component.description).to.contain('Description of Module A');
        });
    });

    it('... component query for nonexistant component empty key', function () {
        return doQuery(`
            query Q($key: String!) {
                component(key: $key) { name description }
            }`, {
                key: 'nosuchcomponent'
            }
        ).then(({ component }) => {
            expect(component).to.be(null);
        });
    });

    it('... component -> satisfies link', function () {
        return doQuery(`
            query {
                component(key: "AU_policy") {
                    name
                    satisfies {
                        control_key
                        narrative { key text }
                    }
                }
            }
        `)
        .then(({ component }) => {
            expect(component).to.be.ok();
            expect(component.satisfies).to.have.length(2);
        });
    });

    it('... component -> satisfies -> control link', function () {
        return doQuery(`
            query {
                component(key: "moda") {
                    satisfies { control_key control { key name } }
                }
            }
        `)
        .then(({ component }) => {
            expect(component).to.be.ok();
            expect(component.satisfies).to.have.length(1);
            let sat = component.satisfies[0];
            expect(sat.control_key).to.equal('SC-1');
            expect(sat.control).to.be.ok();
            expect(sat.control.key).to.equal('SC-1');
        });
    });

    it('... control -> satisfied_by -> component link', function () {
        return doQuery(`
            query Q($std: String!, $key: String!) {
                control(standard_key: $std, key: $key) {
                    satisfied_by { component { key name } }
                }
            }
        `, { std: expected.standard, key: 'SC-1' } )
        .then(({ control }) => {
            expect(control).to.be.ok();
            expect(control.satisfied_by).to.have.length(2);
            control.satisfied_by.forEach(sat => {
                expect(sat).to.be.ok();
                expect(sat.component).to.be.ok();
                expect(sat.component.name).to.be.a('string');
            });
        });
    });
    });

    describe('Profiles', function () {

    it('... profiles query', function () {
        return doQuery('{ profiles { key } }')
            .then(ans => {
                expect(ans).to.be.ok();
                expect(ans).to.have.property('profiles');
                expect(ans.profiles).to.have.length(1);
                expect(ans.profiles[0]).to.have.property('key');
                expect(ans.profiles[0].key).to.equal(expected.certification);
            });
    });

    it('... profiles -> control', function () {
        return doQuery('{ profiles { key controls { key name } } }')
            .then(({ profiles }) => {
                let controls = profiles[0].controls;
                expect(controls.length).to.equal(expected.certified.length);
                controls.forEach(c => {
                    expect(expected.certified).to.contain(c.key);
                    expect(c.name).to.be.a('string');
                });
            });
    });

    it('... profile query', function () {
        return doQuery(`
            query Q($key: String!) {
                profile(key: $key) { key controls { key } }
            }
        `, { key: expected.certification })
        .then(({ profile }) => {
            expect(profile).to.be.ok();
        })
        ;
    });

    it('... profile query - nonexistent profile', function () {
        return doQuery(`
            query Q($key: String!) {
                profile(key: $key) { key controls { key } }
            }
        `, { key: 'no-such-profile' })
        .then(({ profile }) => {
            expect(profile).to.be(null);
        })
        ;
    });

    });

});
