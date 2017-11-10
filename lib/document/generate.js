/** @file
 *  Section generators.
 */
const _ = require('lodash')
   , Section = require('./section').Section
   , queries = require('../queries')
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

function generate (db, spec) {
    let contents = (spec.contents || []).map(v => generate(db,v));
    if (spec.generate) {
        let generator = generate[spec.generate]
            || notfound('generator', spec.generate);
        return generator(db, spec, contents);
    } else if (spec.report) {
        return generate.report(db, spec, contents);
    } else if (spec.page) {
        return generate.page(db, spec, contents);
    } else {
        return new Section({
          title: spec.title,
          template: spec.template,
          contents: contents
      });
    }
}

generate.page = (db, spec, contents) => {
    let page = db.pages.findByKey(spec.page) || notfound('page', spec.page);
    return new Section({
        title: spec.title || page.data.title,
        template: page.data.template || 'page',
        locals: { page: page },
        contents: contents,
    });
};

generate.components = (db, spec) => new Section({
    title: spec.title || 'Components',
    contents: db.components.records.map(component => new Section({
        title: component.name,
        template: 'component',
        locals: queries.findComponent(db, { component: component.key })
    }))
});

/**
 * SEEALSO: queries.findControl
 */
function controlInfo (db, control) {
    let pkey = { control_key: control.key, standard_key: control.standard_key };
    return {
        control: control,
        satisfied: queries.whatSatisfies(db, pkey),
        certifications: db.certifications.chain().filter(pkey) .value(),
    };
}

/**
 * generate: controls
 */
generate.controls = (db, spec) => new Section({
    title: spec.title || 'Controls',
    contents: db.controls.chain()
        .map(control => controlInfo(db, control))
        .filter(rec => rec.satisfied.length >= 1)
        .groupBy('control.family')
        .map((controls, family) =>
            new Section({
                title: `${family} family`,
                contents: _.map(controls, rec =>
                    new Section({
                        title: rec.control.name,
                        template: 'control',
                        locals: rec
                    }))
            })
        ).value()
});

// const notfound = what => () => new Section({ title: what + ' not found' });

generate.report = function (db, spec, contents) {
    let report = reports[spec.report] || notfound('report', spec.report);
    let params = spec.params || {};
    return new Section({
        title: spec.title || report.title,
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
