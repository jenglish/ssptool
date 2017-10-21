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
    },
    additionalProperties: false,

    definitions: {
        directory: { type: 'string' }
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
