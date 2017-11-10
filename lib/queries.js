/** @file Database lookup routines, called from routes.
 */

const _ = require('lodash');

/**
 * Ensure that value is non-null, throws 404 error if not.
 * @param {?any} value
 * @return {!any} value
 * @throws {Error}
 */
function assertFound (value) {
    if (!value) {
        var err = new Error('not found');
        err.status = 404;
        throw err;
    }
    return value;
}

/**
 * Return list of Satisfactions that satisfy a particular control.
 *
 * @param {Database} db
 * @param {Object} cert - object containing control primary key
 * @param {string} cert.standard_key
 * @param {string} cert.control_key
 */

function whatSatisfies (db, cert) {
    return db.satisfactions.chain()
        .filter(_.pick(cert, ['standard_key', 'control_key']))
        .sortBy('component_key')
        .map(sat => db.satisfactions.populate(sat))
        .value();
}
exports.whatSatisfies = whatSatisfies;

/**
 * Returns data for control template.
 *
 * @param {string} params.standard
 * @param {string} params.control
 */
exports.findControl = (db, params) => ({
    control: assertFound(db.controls.findByKey(params.standard,params.control)),
    satisfied: whatSatisfies(db,
        { standard_key: params.standard, control_key: params.control }),
    certifications: db.certifications.chain()
        .filter({ standard_key: params.standard, control_key: params.control })
        .value(),
});

/**
 * Returns data for component template
 *
 * @param {string} params.component
 */
exports.findComponent = (db, params) => ({
    component: assertFound(db.components.findByKey(params.component)),
    satisfies: db.satisfactions.chain()
        .filter({ component_key: params.component })
        .sortBy(['standard_key', 'control_key'])
        .map(sat => db.satisfactions.populate(sat))
        .value(),
});

