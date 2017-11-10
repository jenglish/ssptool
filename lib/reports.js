/** @file Various reports.
 */

var _ = require('lodash')
  , fp = require('lodash/fp')
  ;

/**
 * Select list of property values from an object.
 */
var project = function (obj, keys) {
    return _.map(keys, k => obj[k] || null);
};
/**
 * List of records -> list of lists.
 */
var tabulate = function(objs, keys) {
    return _.map(objs, obj => project(obj, keys));
};

/**
 * Report definition.
 *
 * @property {string} title - title of report
 * @property {function(Database,Object):Array<Object>} query - query function
 * @property {string[]} columns - field names
 * @property {Object} inputs - query parameters
 *
 * @todo column labels
 */
class Report {
    /**
     * @param {Object} options - property values
     */
    constructor (options) {
        this.title = options.title;
        this.inputs = options.inputs || {};
        this.query = options.query;
        this.columns = options.columns;
    }

    /**
     * @return list of records
     */
    run (db, params) {
       return _.map(this.query(db, params), fp.pick(this.columns));
    }

    /**
     * @return list of lists
     */
    table (db, params) {
        return tabulate(this.query(db, params), this.columns);
    }
}

/** Completion report.
 *  Potentially useful for gap analysis.
 *
 * @param {string} params.profile - certification ID
 */
var completionReport = function (db, params) {
    var selector = {};
    if (params.profile) {
        selector.certification = params.profile;
    }
    var satstats = function (c) {
        return db.satisfactions.chain()
        .filter({ standard_key: c.standard_key, control_key: c.control_key })
        .map(sat => _.assign({implementation_status: 'unknown'}, sat))
        .groupBy('implementation_status')
        .mapValues(l => l.length)
        .mapKeys((v, k) => 's_' + k)
        .thru(x => _.isEmpty(x) ? { unsatisfied: 1 } : x)
        .value();
    };
    var controlinfo = function (c) {
        return db.controls.findByKey(c.standard_key, c.control_key);
    };
    return db.certifications.chain()
        .filter(selector)
        .map(c => _.assign({}, c, satstats(c), controlinfo(c)))
        .value()
        ;
};

exports.completion = new Report({
    title: 'Completion report',
    query: completionReport,
    inputs: [ { name: 'profile' }],
    columns:
        [ 'control_key'
        , 'name'
        , 'unsatisfied'
        , 's_unknown'
        , 's_planned'
        , 's_partial'
        , 's_complete'
        , 's_none'
        ]
});

