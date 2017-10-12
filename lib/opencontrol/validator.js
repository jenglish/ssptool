
const schemas = require('./schemas');

var Ajv = require('ajv')
  , ajv = new Ajv({ allErrors: true })
  ;

for (var schema of ['component', 'standard', 'certification']) {
    ajv.addSchema(schemas[schema], schema);
}

module.exports = ajv;
