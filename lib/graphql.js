/**
 * graphql server
 * @module
 */

require('url-search-params-polyfill');  /* needed for Node 8 */

const { graphqlHTTP } = require('express-graphql');
const { buildSchema, execute } = require('graphql');

// const debug = require('debug')('graphql');

const typeDefs = `

"""
    Indicates an extension to OpenControl schema
"""
directive @extension on FIELD_DEFINITION | ENUM_VALUE

scalar MarkupMultiline

type Query {
    standards: [Standard]
    standard(key: String!): Standard

    controls: [Control]
    control(standard_key: String!, key: String!) : Control

    components: [Component]
    component(key: String!) : Component

    profiles: [Profile]
    profile(key: String!): Profile
}

"""
    A control catalog.
"""
type Standard {
    key: String!
    controls: [Control!]
}

"""
    Profile / Certification
"""
type Profile {
    key: String!
    controls: [Control!]
}

"""
    A security control definition.
"""
type Control {
    standard_key: ID!
    key: ID!
    family: String
    name: String
    description: MarkupMultiline

    satisfied_by: [Satisfaction]
    required_by: [Profile]!
    mapped_to: [ControlRef!] @extension
    related_to: [ControlRef!] @extension
}

"""
    Reference to a security control
"""
type ControlRef {
    standard_key: ID!
    control_key: ID!
    control: Control
}

"""
    A system component.
"""
type Component {
    key: String!
    system: String
    name: String!
    description: MarkupMultiline
    responsible_role: String

    satisfies: [Satisfaction]!
    references: [Reference]
}

enum ImplementationStatus {
    unknown @extension
    none
    planned
    partial
    complete
}

type Satisfaction {
    component_key: ID!
    component: Component

    standard_key: ID!
    control_key: ID!
    control: Control

    implementation_status: ImplementationStatus
    narrative: [NarrativeItem]
}

type NarrativeItem {
    key: String
    text: MarkupMultiline
}

"""
Reference to external resource
"""
type Reference {
    name: String
    path: URI
}
scalar URI
`;

/** Component resolver.
 */
function createComponent(db, comp) {
    const { key, system, name, description, responsible_role } = comp;
    return {
        key,
        system,
        name,
        description,
        responsible_role,

        satisfies () {
            return db.satisfactions.chain()
                .filter({ component_key: key })
                .map(sat => createSatisfaction(db, sat))
                .value();
        },

        references () {
            return comp.references;
        },
    };
}

/** Component lookup.
 */
function findComponent(db, key) {
    let comp = db.components.findByKey(key);
    return comp && createComponent(db, comp);
}

/** Control resolver.
 */
function createControl(db, {
    standard_key,
    key,
    family,
    name,
    description
}) {
    return {
        standard_key,
        key,
        family,
        name,
        description,

        satisfied_by () {
            return db.satisfactions.chain()
                .filter({ standard_key, control_key: key })
                .map(sat => createSatisfaction(db, sat))
                .value();
        },
        required_by () {
            // @@@ not quite right
            return db.certifications.chain()
                .filter({ standard_key, control_key: key })
                .groupBy('certification')
                .map((recs, key) => createProfile(db, key, recs))
                .value();
        },
        mapped_to () {
            return db.mappings.chain()
                .filter({ standard_a: standard_key, control_a: key })
                .map(m => createControlRef(db, {
                    standard_key: m.standard_b,
                    control_key: m.control_b
                }))
                .value();
        },
        related_to () {
            return db.mappings.chain()
                .filter({ standard_b: standard_key, control_b: key })
                .map(m => createControlRef(db, {
                    standard_key: m.standard_a,
                    control_key: m.control_a
                }))
                .value();
        },
    };
}

/** Control lookup.
 */
function findControl(db, standard_key, key) {
    let c = db.controls.findByKey(standard_key, key);
    return c && createControl(db, c);
}

/** Satisfaction resolver.
 */
function createSatisfaction(db, {
    component_key,
    standard_key,
    control_key,
    implementation_status,
    narrative
}) {
    return {
        component_key,
        standard_key,
        control_key,
        implementation_status,
        narrative,

        component () {
            return findComponent(db, component_key);
        },
        control () {
            return findControl(db, standard_key, control_key);
        }
    };
}

/** ControlRef resolver.
 */
function createControlRef(db, {
    standard_key,
    control_key,
}) {
    return {
        standard_key,
        control_key,
        control () {
            return findControl(db, standard_key, control_key);
        }
    };
}

/** Standard resolver.
 */
function createStandard(db, { key, controls } ) {
    return {
        key,
        controls () {
            return controls.map(c => createControl(db, c));
        }
    };
}

/** Profile resolver.
 */
function createProfile(db, key, recs) {
    const makeControl = ({ standard_key, control_key }) =>
        findControl(db, standard_key, control_key);
    return {
        key,
        controls () { return recs.map(makeControl); }
    };
}

/** GraphQL executor root value.
 */
const rootValue = {
    component ({ key }, { db }) {
        return findComponent(db, key);
    },
    components (_, { db }) {
        return db.components.records.map(c => createComponent(db, c));
    },

    control ({ standard_key, key }, { db }) {
        return findControl(db, standard_key, key);
    },
    controls (_, { db }) {
        return db.controls.records.map(c => createControl(db, c));
    },

    standard ({ key }, { db }) {
        let controls = db.controls.chain()
            .filter({ standard_key: key })
            .value();
        return controls.length ? createStandard(db, { key, controls }) : null;
    },
    standards (_, { db }) {
        let ans = db.controls.chain()
            .groupBy('standard_key')
            .map((controls, key) => (createStandard(db, { key, controls })))
            .value();
        return ans;
    },

    profiles (_, { db }) {
        return db.certifications.chain()
            .groupBy('certification')
            .map((recs, key) => createProfile(db, key, recs))
            .value();
    },

    profile ({ key }, { db }) {
        let recs = db.certifications.chain()
            .filter({ certification: key })
            .value();
        return recs.length ? createProfile(db, key, recs) : null;
    }
};

const schema = buildSchema(typeDefs);

/** Route handler: GraphQL API endpoint
 */
const middleware = graphqlHTTP(req => ({
    schema,
    rootValue,
    context: {
        db: req.app.get('db')
    },
    graphiql: {
        defaultQuery: '{ standards { key } }'
    }
}));

/** Route middleware constructor: run GraphQL query.
 *
 *  Variable values (if any) are taken from req.params.
 *  Query results are added to res.locals.
 *
 *  @param {graphql.DocumentNode} document - parsed graphql query document
 */
function gqlQuery (document) {
    return function (req, res, next) {
        let result = execute({
            schema,
            document,
            rootValue,
            variableValues: req.params,
            contextValue: { db: req.app.get('db') }
        });
        if (result.errors) {
            return next(result.errors[0]);
        }
        for (let k in result.data) {
            let v = result.data[k];
            if (v) {
                res.locals[k] = v;
            } else {
                let err = new Error(k + ' not found');
                err.status = 404;
                return next(err);
            }
        }
        next();
    };
}

module.exports = { schema, rootValue, middleware, gqlQuery };

