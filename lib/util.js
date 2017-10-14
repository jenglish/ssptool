/**
 * Miscellaneous shared utilities that don't fit anywhere else.
 */

const _ = require('lodash');

/** Multi-level _.groupBy.
 */
function nest (collection, keys) {
    var result = _.groupBy(collection, keys[0]);
    var rest = keys.slice(1);
    if (rest.length) {
        for (var group in result) {
            result[group] = nest(result[group], rest);
        }
    }
    return result;
}

/** Converse of nest().
 */
var unnest = function (collection, keys) {
    if (keys.length === 0) {
        // make a copy of each record in list,
        // it gets modified on return.
        return _.map(collection, r => _.extend({}, r));
    }
    var result = [], key = keys[0], rest = keys.slice(1);
    for (var val in collection) {
        var u = unnest(collection[val], rest);
        for (var rec of u) {
            rec[key] = val;
            result.push(rec);
        }
    }
    return result;
};

exports.nest = nest;
exports.unnest = unnest;

