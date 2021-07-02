/**
 * Section generators.
 * @module
 */
const _ = require('lodash')
   , Section = require('./section').Section
   , reports = require('../reports')
   ;

/**
 * Throws a 'thing not found' exception.
 *
 * @param {string} what - type of thing
 * @param {string} name - name of thing
 * @throws {Error}
 */
function notfound (what, name) {
    throw new Error(what + ' ' + name + ' not found');
}

/**
 * @return empty page
 */
function emptyPage () { return { data: {}, html: null }; }

/**
 * @param {opencontrol.Database} db
 * @param spec - generator specification
 * @return Section
 */
function generate (db, spec) {
    let contents = (spec.contents || []).map(v => generate(db,v));
    let page = spec.page
        ? db.pages.findByKey(spec.page) || notfound('page', spec.page)
        : emptyPage();
    if (spec.generate) {
        let generator = generate[spec.generate]
            || notfound('generator', spec.generate);
        return generator(db, spec, page, contents);
    } else if (spec.report) {
        return generate.report(db, spec, page, contents);
    } else {
        return generate.section(db, spec, page, contents);
    }
}

generate.section = (db, spec, page, contents) => {
    return new Section({
        title: spec.title || page.data.title || '** untitled **',
        page: page,
        template: spec.template,
        contents: contents,
    });
};

/**
 * SEEALSO: queries.COMPONENT_QUERY
 */
function componentInfo(db, component) {
    component = Object.assign({
        satisfies: db.satisfactions.chain()
            .filter({ component_key: component.key })
            .sortBy(['standard_key', 'control_key'])
            .map(sat => db.satisfactions.populate(sat))
            .value()
    }, component);
    return { component };
}

generate.components = (db, spec, page) => new Section({
    title: spec.title || page.data.title || 'Components',
    page: page,
    template: spec.tenplate,
    contents: db.components.records.map(component => new Section({
        title: component.name,
        template: 'component',
        locals: componentInfo(db, component),
        defines: [{ component: component.key }]
    }))
});

/**
 * SEEALSO: queries.CONTROL_QUERY
 */
function controlInfo (db, control) {
    let pkey = { control_key: control.key, standard_key: control.standard_key };
    control = Object.assign({
        satisfied_by: db.satisfactions.chain()
            .filter(pkey)
            .map(sat => db.satisfactions.populate(sat))
            .value()
        // omit: required_by
        // omit: mapped_to
    }, control);
    return { control };
}

/**
 * generate: controls
 */
generate.controls = (db, spec, page) => new Section({
    title: spec.title || page.data.title || 'Controls',
    page: page,
    contents: db.controls.chain()
        .map(control => controlInfo(db, control))
        .filter(rec => rec.control.satisfied_by.length >= 1)
        .groupBy('control.family')
        .map((controls, family) =>
            new Section({
                title: family,
                contents: _.map(controls, rec =>
                    new Section({
                        title: rec.control.name,
                        template: 'control',
                        locals: rec,
                        defines: [{ control: rec.control.key }]
                    }))
            })
        ).value()
});

generate.report = function (db, spec, page, contents) {
    let report = reports[spec.report] || notfound('report', spec.report);
    let params = spec.params || {};
    return new Section({
        title: spec.title || page.data.title || report.title,
        page: page,
        contents: contents,
        template: 'report',
        locals: {
            report: report,
            records: report.query(db, params),
            query: params,
        }
    });
};

exports.generate = generate;
