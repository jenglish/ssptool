/** @file OpenControl schemas in json-schema format
 */

/**
 * Shared constructs
 */
var shared = {
    status: {
        title: 'Implementation status',
        enum: ['none', 'planned', 'partial', 'complete']
    },
    standard_key: {
        type: 'string',
        description: 'Standard key'
    },
    control_key: {
        type: 'string',
        description: 'Control key'
    },
    component_key: {
        type: 'string',
        description: 'Component key'
    }
};

exports.standard = {
    '$schema': 'http://json-schema.org/draft-07/schema#',
    title: 'OpenControl standard v1.0.0',

    type: 'object',
    properties: {
        name: { $ref: '#/shared/standard_key' }
    },
    additionalProperties: {
        '$ref': '#/definitions/Control'
    },

    shared: shared,

    definitions: {
        Control: {
            type: 'object',
            description: 'Security control',
            properties: {
                name:           { $ref: '#/shared/control_key' },
                family:         { type: 'string' },
                description:    { type: 'string', format: 'markdown' },
            },
            additionalProperties: false,
        }
    }
};

exports.certification = {
    '$schema': 'http://json-schema.org/draft-07/schema#',
    title: 'OpenControl certification v1.0.0',

    type: 'object',
    required: ['name', 'standards'],
    properties: {
        name: { type: 'string' },
        standards: {
            description: 'Dictionary: standard_key -> control_key -> {}',
            type: 'object',
            propertyNames: { $ref: '#/shared/standard_key' },
            additionalProperties: {
                description: 'Dictionary: control_key -> {}',
                type: 'object',
                propertyNames: { $ref: '#/shared/control_key' },
                additionalProperties: { // {}
                    type: 'object',
                    properties: {
                        mapping: {
                            type: 'object',
                            title: 'Control mappings (ssptool extension)',
                            description:
                              'Dictionary: standard_key -> [control_key]',
                            propertyNames: { $ref: '#/shared/standard_key' },
                            additionalProperties: {
                                type: 'array',
                                items: { '$ref': '#/shared/control_key' }
                            }
                        }
                    },
                    additionalProperties: false
                }
            }
        },
    },
    additionalProperties: false,

    shared: shared
};

exports.component = {
    '$schema': 'http://json-schema.org/draft-07/schema#',
    title: 'OpenControl component v3.0.0',

    type: 'object',
    properties: {
        schema_version:         { type: 'string', format: 'semver' },
        key:                    { $ref: '#/shared/component_key' },
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

    shared: shared,

    definitions: {
        Satisfaction: {
            type: 'object',
            required: ['standard_key', 'control_key'],
            properties: {
                standard_key:   { $ref: '#/shared/standard_key' },
                control_key:    { $ref: '#/shared/control_key' },
                implementation_status: { '$ref': '#/shared/status' },
                narrative: {
                    type: 'array',
                    items: { '$ref': '#/definitions/NarrativeItem' }
                },
                parameters: {
                    type: 'array',
                    items: { '$ref': '#/definitions/NarrativeItem' }
                },
                control_origin: {
                    type: 'string'
                },
                covered_by: {
                    type: 'array',
                    items: { '$ref': '#/definitions/VerificationRef' }
                },
                implementation_statuses: {
                    // added in component/v3.1.0
                    type: 'array',
                    items: { '$ref': '#/shared/status' }
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
            type: 'object',
            properties: {
                // Shared with Resource
                name:               { type: 'string' },
                path:               { type: 'string', format: 'uri' },
                type:               { type: 'string' },

                // Verification-specific
                key:                { type: 'string' },
                description:        { type: 'string' },
                test_passed:        { type: 'boolean' },
                last_run:           { type: 'string' },
            }
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
exports.page = {
    '$schema': 'http://json-schema.org/draft-07/schema#',
    title: 'ssptool page frontmatter metadata',

    type: 'object',
    required: ['title'],
    properties: {
        title:          { type: 'string' },
        author:         { type: 'string' },
        date:           { type: 'string', format: 'date' },
        version:        { type: 'string', format: 'semver' },
        last_modified:  { type: 'string', format: 'date' },

        // Component properties:
        component:      { $ref: '#/shared/component_key' },
        system:         { type: 'string' },
        implementation_status:  { '$ref': '#/shared/status' },
        responsible_role: { type: 'string' },
        satisfies: {
            description: 'Dictionary: standard_key -> control_key -> details',
            type: 'object',
            propertyNames: { $ref: '#/shared/standard_key' },
            additionalProperties: {
                description: 'Dictionary: control_key -> details',
                type: 'object',
                propertyNames: { $ref: '#/shared/control_key' },
                additionalProperties: {
                    description: 'details',
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
