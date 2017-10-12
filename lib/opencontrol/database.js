
const debug = require('debug')('opencontrol.database');
const _ = require('lodash');

/**
 * Holding bucket for OpenControl data.
 */
class Database {

    constructor() {
        this._standards = {};
        this._certifications = {};
        this._components = {};
        this._controls = {};
    }

    get standards()             { return this._standards; }
    get certifications()        { return this._certifications; }
    get components()            { return this._components; }
    get controls()              { return this._controls; }

    addStandard (standard) {
        let standard_key = standard.name;
        debug('Found standard: %s', standard_key);
        this.standards[standard_key] = standard;

        // Every property besides 'name' is a control:
        delete standard.name;
        _.forEach(standard, (control, key) => {
            // augment control record with primary key
            control.standard_key = standard_key;
            control.key = key;
            this.addControl(control);
        });
    }

    /* TOFIX: assumes control keys are globally unique */
    addControl (control) {
        debug(' ... Found control: %s', control.key);
        this.controls[control.key] = control;
    }

    addComponent (component) {
        debug('... Found component: %s', component.key);
        this.components[component.key] = component;
    }

    addCertification (certification) {
        debug('... Found certification: %s', certification.name);
        this.certifications[certification.name] = certification;
    }
}

exports.Database = Database;

