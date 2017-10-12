/** OpenControl schemas in json-schema format
 */

exports.component = {
    '$schema': 'http://json-schema.org/schema#',
    type: 'object',
    properties: {
        name:           { type: 'string' },
        description:    { type: 'string' },
        family:         { type: 'string' }
    },
    additionalProperties: false
};

exports.standard = {
    '$schema': 'http://json-schema.org/schema#',
    type: 'object',
    properties: {
        name: { type: 'string' }
    },
    additionalProperties: exports.component
};

exports.certification = {
    '$schema': 'http://json-schema.org/schema#',
    type: 'object',
    required: ['name', 'standards'],
    properties: {
        name: { type: 'string' },
        standards: {
            type: 'object',
            additionalProperties: {}    // REALLY: empty object
        },
    },
    additionalProperties: false,
};

exports.component = {
    '$schema': 'http://json-schema.org/schema#',

    type: 'object',
    properties: {
        schema_version: { anyOf: [
            { type: 'string', pattern: '^3.0.0$' },
            { type: 'number' }
        ]},

        key:                    { type: 'string' },
        system:                 { type: 'string' },
        name:                   { type: 'string' },

        documentation_complete: { type: 'boolean' },

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

    definitions: {
        Satisfaction: {
            type: 'object',
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
                    items: { '$ref': '#/definitions/KeyText' }
                },
                parameters: {
                    type: 'array',
                    items: { '$ref': '#/definitions/KeyText' }
                },
                covered_by: {
                    type: 'array',
                    items: { '$ref': '#/definitions/VerificationRef' }
                },
            },
            required: ['standard_key', 'control_key'],
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
                    last_run:           { format: 'date' },
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
        KeyText: {
            type: 'object',
            properties: {
                key:    { type: 'string' },
                text:   { type: 'string' }
            },
            required: ['text']
        }
    }
};

