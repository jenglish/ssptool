/** @file
 *  Exports an AJV validator for OpenControl schemas.
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

for (var schema of ['component', 'standard', 'certification', 'page']) {
    ajv.addSchema(schemas[schema], schema);
}

module.exports = ajv;
