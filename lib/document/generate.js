/** @file
 *  Section generators.
 */
const _ = require('lodash')
   , Section = require('./section').Section
   , queries = require('../queries')
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
    } else if (spec.page) {
        return generate.page(db, spec, contents);
    } else {
        return new Section({ title: spec.title, contents: contents });
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
 * TO BE MOVED
 */
function whatSatisfies (db, cert) {
    return db.satisfactions.chain()
        .filter(_.pick(cert, ['standard_key', 'control_key']))
        .sortBy('component_key')
        .map(sat => db.satisfactions.populate(sat))
        .value();
}

/**
 * generate: controls
 */
generate.controls = (db, spec) => new Section({
    title: spec.title || 'Controls',
    contents: db.certifications.chain()
        .filter({ certification: spec.profile })
        .map(cert => db.certifications.populate(cert))
        .map(cert => _.assign({}, cert, {
            satisfied:  whatSatisfies(db, cert),
            certifications: [cert]
        }))
        .filter(cert => cert.satisfied.length >= 1)
        .map(cert => new Section({
            title: cert.control.name,
            template: 'control',
            locals: cert
        }))
        .value()
});

const nyi = what => () => new Section({ title: what + ' NYI' });
generate.toc = nyi('toc');
generate.report = nyi('report');

exports.generate = generate;
