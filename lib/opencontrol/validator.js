/**
 * AJV validator for OpenControl schemas.
 *
 * Recognizes the following custom string formats:
 *  - semver: Semantic Version Number as per semver spec
 *  - markdown: (informational, no additional validation)
 *
 * @module
 * @type {Ajv}
 */

const schemas = require('./schemas');

var Ajv = require('ajv')
  , ajv = new Ajv({ allErrors: true })
  , semver = require('semver')
  ;

ajv.addFormat('semver', {
    validate: x => !!semver.valid(x),
    compare: (x, y) => semver.compare(x, y)
});
ajv.addFormat('markdown', { validate: _ => true });

for (var schema of ['component', 'standard', 'certification', 'page']) {
    ajv.addSchema(schemas[schema], schema);
}

module.exports = ajv;
