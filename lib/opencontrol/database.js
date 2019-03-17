
const { Collection } = require('./collection')
  , _ = require('lodash')
  , debug = require('debug')('opencontrol.database')
  ;

/**
 * Process shorthand form of narrative structures.
 * Input may be a single string or a dictionary,
 * turns either one into a list of key/text records.
 *
 * @param {string|Object.<string>} description
 * @return {Narrative}
 *
 */
function narrativeShorthand (description) {
    if (_.isString(description)) {
        return [{ text: description }];
    } // else
    var narrative = [];
    for (var k in description) {
        narrative.push({ key: k, text: description[k] });
    }
    return narrative;
}

/**
 * Holding bucket for OpenControl data.
 * @property {Collection} components
 * @property {Collection} controls
 * @property {Collection} pages
 */
class Database {

    constructor() {

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

        this._satisfactions = new Collection();
        this._satisfactions
        .references(this._controls,
            { standard_key:'standard_key', key:'control_key' }, 'control')
        .references(this._components,
            { key:'component_key' }, 'component')
        ;

        this._certifications = new Collection();
        this._certifications.references(this._controls,
            { standard_key:'standard_key', key:'control_key' }, 'control');

        this._pages = new Collection({
            primary_key: ['relative']
        });

        this._mappings = new Collection();
        this._mappings
        .references(this._controls,
            { standard_key: 'standard_a', key: 'control_a' }, 'lhs')
        .references(this._controls,
            { standard_key: 'standard_b', key: 'control_b' }, 'rhs');
    }

    get components()            { return this._components; }
    get controls()              { return this._controls; }
    get certifications()        { return this._certifications; }

    get satisfactions()         { return this._satisfactions; }
    get pages()                 { return this._pages; }
    get mappings()              { return this._mappings; }

    addComponent (component) {
        debug('... Found component: %s', component.key);
        this.components.add(component);

        for (var sat of component.satisfies || []) {
            this.satisfactions.add(_.extend({
                component_key: component.key,
                system_key: component.system
            }, sat));
        }
    }

    /**
     * Add all the controls found in standard.
     * @param {Standard} standard - see schemas.standard
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
     * @param {Control} control - see schemas.control
     */
    addControl (control) {
        this.controls.add(control);
    }

    /**
     * Add a certification to the database
     * @param {Certification} certification - see schemas.certification
     */
    addCertification (certification) {
        debug('... Found certification: %s', certification.name);
        _.forEach(certification.standards, (rec, standard) => {
            _.forEach(rec, (props, control) => {
                this.certifications.add({
                    certification: certification.name,
                    standard_key: standard,
                    control_key: control
                });
                _.forEach(props.mapping || {}, (controls, standard_b) =>
                    _.forEach(controls, control_b =>
                        this.mappings.add({
                            standard_a: standard,
                            control_a: control,
                            standard_b: standard_b,
                            control_b: control_b
                        })
                ));
            });
        });
    }

    /**
     * Add a page to the database.
     * Rename sub/dir/README.md => sub/dir
     * If page.data has a `satisfies` and/or `component` property,
     * also add an eponymous Component.
     */
    addPage (page) {
        if (page.basename === 'README.md' && page.dirname !== page.base) {
            page.path = page.path.split('/').slice(0,-1).join('/');
        }
        this.pages.add(page);
        if (page.data.satisfies) {
            let component_key = page.data.component || page.stem
              , name = page.data.title
              , status = page.data.implementation_status || 'unknown'
              ;

            this.components.add({
                key:    component_key,
                name:   name,
                responsible_role: page.data.responsible_role,
                page:   page,
            });
            _.forEach(page.data.satisfies, (rec, standard_key) =>
                _.forEach(rec, (description, control_key) =>
                    this.satisfactions.add({
                        standard_key: standard_key,
                        control_key: control_key,
                        component_key: component_key,
                        implementation_status: status,
                        narrative: narrativeShorthand(description)
                    })
                )
            );
        }
    }
}

exports.Database = Database;

