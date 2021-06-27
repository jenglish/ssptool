/**
 * graphql server
 * @module
 */

require('url-search-params-polyfill');  /* needed for Node 8 */

const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

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
    mapped_to: [ControlRef!] @extension
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

    satisfies: [Satisfaction]!
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
`;

/** Component resolver.
 */
function createComponent(db, { key, system, name, page }) {
    return {
        key,
        system,
        name,
        description () {
            return page && page.contents.toString();
        },
        satisfies () {
            return db.satisfactions.chain()
                .filter({ component_key: key })
                .map(sat => createSatisfaction(db, sat))
                .value();
        }
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
        mapped_to () {
            return db.mappings.chain()
                .filter({ standard_a: standard_key, control_a: key })
                .map(m => createControlRef(db, {
                    standard_key: m.standard_b,
                    control_key: m.control_b
                }))
                .value();
        }
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

module.exports = { schema, rootValue, middleware };

