/**
 * @file config file loader.
 *
 * Configuration file format is specified by a json-schema. This:
 *
 *   - serves as authoritative documentation for config files
 *   - helps ensure that the documentation is actually accurate
 *   - provides an easy way to check config files for errors
 */

const fs = require('fs')
    , yaml = require('js-yaml')
    , Ajv = require('ajv')
    , validator = new Ajv({ allErrors: true, useDefaults: true })
    ;

const schema = {
    '$schema': 'http://json-schema.org/schema#',
    type: 'object',
    properties: {
        datadir: {          '$ref': '#/definitions/directory',
            description:    'path to opencontrols data',
            default:        './opencontrols'
        },
        docdir: {          '$ref': '#/definitions/directory',
            description:    'path to opencontrols data',
            default:        './markdowns'
        },
        assetsdir: {        '$ref': '#/definitions/directory',
            description:    'directory containint additional assets',
            default:        './assets'
        },
        documents: {
            type:           'object',
            description:    'document definitions',
            additionalProperties: { '$ref': '#/definitions/section' },
        },
    },
    additionalProperties: false,

    definitions: {
        directory: { type: 'string' },

        section: {
            type: 'object',
            properties: {
                generate: {
                    type: 'string',
                    description:  'Type of section to generate',
                    enum:   // currently available generators:
                        [ 'page'        // default if page: specified
                        , 'components'
                        , 'controls'
                        , 'toc'
                        , 'section'     // default otherwise
                        ]
                },
                title: {
                    type: 'string',
                    description: 'Section title',
                },
                template: {
                    type: 'string',
                    description: 'template ID (optional)'
                },
                contents: {
                    type: 'array',
                    items: { '$ref': '#/definitions/section' },
                },
            },
            additionalProperties: true,
        }
    }
};

/**
 * Loads config file,  validates and supplies default values.
 * Validation errors are stored in ._errors property.
 *
 * @param {string} path - filename
 * @param {Continuation<Object>} done
 */
function loadConfig (path, done) {
    fs.readFile(path, (err, contents) => {
        if (err) { return done(err); }
        try {
            var opts = { filename: path, schema: yaml.CORE_SCHEMA };
            var config = yaml.load(contents, opts);
            validator.validate(schema, config);
            config._errors = validator.errors;
            return done(null, config);
        } catch (err) { return done(err); }
    });
}

exports.load = loadConfig;
exports.schema = schema;
