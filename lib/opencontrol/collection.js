
const _ = require('lodash')
    , assert = require('assert')
    ;

/**
 * Holds a set of records, provides basic query features via lodash.
 * @property {Array} records - list of all records.
 * @property {Array<string>} primary_key - list of fields constituting pkey
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
        this._populators = {};
    }

    get records () { return this._records; }
    get primary_key() { return this._primary_key; }

    /**
     * Declare a partial function to another collection.
     *
     * @param {Collection} that - other collection
     * @param {KeyMap} keymap - maps properties of that to properties of this
     * @param {string} refprop - name of property in this
     *
     * this.populate(rec) sets rec.refprop to the matching record in that.
     *
     * @return this
     */
    references (that, keymap, refprop) {
        this._populators[refprop] = function (rec) {
            let query = _.mapValues(keymap, k => rec[k]);
            return _.find(that.records, query) || null;
        };
        return this;
    }

    /**
     * Assign refprops
     */
    populate (rec) {
        _.forEach(this._populators, (fn, refprop) => rec[refprop] = fn(rec));
        return rec;
    }

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
