/**
 * @file Referential integrity checks.
 */

const _ = require('lodash'), logger = console;

/**
 * Returns a function which, given a record, returns
 * a human-readable representation of the record suitable
 * for identifying the record in question and what might
 * be wrong with it.
 *
 * @param {string} name - record type
 * @params {string[]} fields - field values to include in descriptor.
 * @return {function(Object):string}
 */
function identifier (name, fields) {
    return function (rec) {
        return name + '(' + (_.map(fields, p => rec[p])).join(',') + ')';
    };
}

/**
 * @param {Collection} c
 * @param {string} refprop - field name s.t. c.references(..., refprop);
 */
function checkReferences (c, refprop) {
    var populator = c._populators[refprop];
    for (var rec of c.records) {
        if (!populator(rec)) {
            logger.warn('%s references nonexistent %s',
                c.identify(rec), refprop);
        }
    }
}

/**
 * Main entry point.
 * @param {Database} db
 */
function refcheck (db) {
    db.satisfactions.identify = identifier('satisfaction',
        ['component_key', 'standard_key', 'control_key']);

    db.certifications.identify = identifier('certification',
        ['certification', 'standard_key', 'control_key']);

    checkReferences(db.satisfactions, 'control');
    checkReferences(db.satisfactions, 'component'); // can't fail, check anwyay
    checkReferences(db.certifications, 'control');
}

module.exports = refcheck;
