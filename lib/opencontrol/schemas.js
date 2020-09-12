/** @file OpenControl schemas in json-schema format
 */

/**
 * Shared constructs
 */
var shared = {
    Narrative: {
        type: 'array',
        items: { '$ref': '#/shared/NarrativeItem' },
    },
    NarrativeItem: {
        type: 'object',
        required: ['text'],
        properties: {
            key:    { type: 'string' },
            text:   { type: 'string' },
            narrative: { '$ref': '#/shared/Narrative' }
        },
        additionalProperties: false
    },

    // implementation_status
    status: {
        type: 'string',
        enum: ['none', 'planned', 'partial', 'complete']
    }
};

exports.control = {
    type: 'object',
    properties: {
        name:           { type: 'string' },
        family:         { type: 'string' },
        description:    { type: 'string' },
        // ssptool extension:
        narrative:      { '$ref': '#/shared/Narrative' },
    },
    additionalProperties: false,
};

exports.standard = {
    '$schema': 'http://json-schema.org/schema#',
    type: 'object',
    properties: {
        name: { type: 'string' }
    },
    additionalProperties: exports.control,
    shared: shared
};

exports.certification = {
    '$schema': 'http://json-schema.org/schema#',
    type: 'object',
    required: ['name', 'standards'],
    properties: {
        name: { type: 'string' },
        standards: {                    // standard_key -> (control_key -> {})
            type: 'object',
            additionalProperties: {     // control_key -> {}
                type: 'object',
                additionalProperties: { // {}
                    type: 'object',
                    properties: {
                        // ssptool extension:
                        mapping: {
                            type: 'object',   // standard_key -> control_key[]
                            additionalProperties: {
                                type: 'array',
                                items: { type: 'string' }
                            }
                        }
                    },
                    additionalProperties: false
                }
            }
        },
    },
    additionalProperties: false,
};

exports.component = {
    '$schema': 'http://json-schema.org/schema#',
    // schema_version: 3.0.0

    type: 'object',
    properties: {
        schema_version:         { type: 'string', format: 'semver' },
        key:                    { type: 'string' },
        system:                 { type: 'string' },
        name:                   { type: 'string' },

        documentation_complete: { type: 'boolean' },
        responsible_role:       { type: 'string' },

        satisfies: {
            type: 'array',
            items: { '$ref': '#/definitions/Satisfaction' }
        },
        references: {
            type: 'array',
            items: { '$ref': '#/definitions/Resource' }
        },
        verifications: {
            type: 'array',
            items: { '$ref': '#/definitions/Verification' }
        },
    },
    required: ['name'],
    additionalProperties: false,

    shared : shared,

    definitions: {
        Satisfaction: {
            type: 'object',
            required: ['standard_key', 'control_key'],
            properties: {
                standard_key:   { type: 'string' },
                control_key:    { type: 'string' },
                control_origin: { type: 'string' },
                implementation_status: {
                    type: 'string',
                    enum: ['none', 'planned', 'partial', 'complete']
                },
                narrative: {
                    type: 'array',
                    items: { '$ref': '#/definitions/NarrativeItem' }
                },
                parameters: {
                    type: 'array',
                    items: { '$ref': '#/definitions/NarrativeItem' }
                },
                covered_by: {
                    type: 'array',
                    items: { '$ref': '#/definitions/VerificationRef' }
                },
            },
            additionalProperties: false,
        },

        // Base class for references, verifications
        Resource: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                path: { type: 'string', format: 'uri' },
                type: { type: 'string' }, // enum: ["URL", "Image"]
            }
        },

        Verification: {
            allOf: [{ '$ref': '#/definitions/Resource' }, {
                properties: {
                    key:                { type: 'string' },
                    description:        { type: 'string' },
                    test_passed:        { type: 'boolean' },
                    last_run:           { type: 'string' },
                }
            }],
        },

        VerificationRef: {
            type: 'object',
            properties: {
                system_key:         { type: 'string' },
                component_key:      { type: 'string' },
                verification_key:   { type: 'string' },
            },
            required: ['verification_key']
        },

        // common factor of narrative and parameters:
        NarrativeItem: {
            type: 'object',
            required: ['text'],
            properties: {
                key:    { type: 'string' },
                text:   { type: 'string' }
            }
        }
    }
};

/** ssptool-specific, non-OpenControl data:
 */

exports.page = { // markdown frontmatter metadata - advisory
    '$schema': 'http://json-schema.org/schema#',
    type: 'object',
    required: ['title'],
    properties: {
        title:          { type: 'string' },
        author:         { type: 'string' },
        date:           { type: 'string', format: 'date' },
        version:        { type: 'string', format: 'semver' },
        last_changed:   { type: 'string', format: 'date' },

        // Component properties:
        component:      { type: 'string' }, // => component.name
        system:         { type: 'string' },
        implementation_status:  { '$ref': '#/shared/status' },
        responsible_role: { type: 'string' },
        satisfies: {                // standard_key -> control_key -> desc
            type: 'object',
            additionalProperties: { // control -> descr
                type: 'object',
                additionalProperties: { // description
                    oneOf: [
                        { type: 'string' },
                        { type: 'object',
                          additionalProperties: { type: 'string' } }
                    ]
                }
            }
        }
    },
    additionalProperties: false,

    shared: shared

};
