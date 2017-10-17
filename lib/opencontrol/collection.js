
const _ = require('lodash')
    , assert = require('assert')
    ;

/**
 * Holds a set of records, provides basic query features via lodash.
 */
class Collection {
    /**
     * @param {Object} options
     * @param {List}   options.primary_key - list of property names
     */
    constructor (options) {
        options = options || {};
        this._primary_key = options.primary_key || [];
        this._records = [];
    }

    /**
     * @property {List} records - return list of all records.
     */
    get records () { return this._records; }

    /**
     * Add a record to the collection.
     */
    add (record) {
        this._records.push(record);
    }

    /**
     * Look up a record by primary key.
     * @return record, null if not found.
     */
    findByKey (...args) {
        assert(args.length === this._primary_key.length, 'wrong#args');
        var selector = _.fromPairs(_.zip(this._primary_key, args))
          , ans = this.chain().find(selector).value();
        return ans || null;
    }

    /**
     * Start a lodash chain.
     */
    chain () {
        return _.chain(this._records);
    }
}

exports.Collection = Collection;
