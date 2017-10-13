
const { Collection } = require('./collection')
  , _ = require('lodash')
  , debug = require('debug')('opencontrol.database')
  ;

/**
 * Holding bucket for OpenControl data.
 */
class Database {

    constructor() {
        this._certifications = new Collection;

        // NOTE: primary_key should be (system_key, component_key),
        // but extant data doesn't seem to use 'system:' much.
        // Component keys are necessarily unique anyway with compliance-masonry
        //
        this._components = new Collection({
            primary_key: ['key']
        });

        this._controls = new Collection({
            primary_key: ['standard_key', 'key']
        });
    }

    get components()            { return this._components; }
    get controls()              { return this._controls; }
    get certifications()        { return this._certifications; }

    addComponent (component) {
        debug('... Found component: %s', component.key);
        this.components.add(component);
    }

    /**
     * Add all the controls found in standard.
     * @param (Standard) standard - see schemas.standard
     */
    addStandard (standard) {
        let standard_key = standard.name;
        debug('Found standard: %s', standard_key);

        // Every property besides 'name' is a control:
        delete standard.name;
        _.forEach(standard, (control, key) => {
            // augment control record with primary key
            control.standard_key = standard_key;
            control.key = key;
            this.addControl(control);
        });
    }

    /**
     * Add a control to the database.
     * @param (Control) control - see schemas.control
     */
    addControl (control) {
        debug(' ... Found control: %s', control.key);
        this.controls.add(control);
    }

    /**
     * Add a certification to the database
     * @param (Certification) certification - see schemas.certification
     */
    addCertification (certification) {
        debug('... Found certification: %s', certification.name);
        this.certifications.add(certification);
    }
}

exports.Database = Database;

