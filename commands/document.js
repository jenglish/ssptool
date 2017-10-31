/**
 * @file
 */

const path = require('path')
  , templateDir = path.join(__dirname, '..', 'views')
  , _ = require('lodash')
  , pug = require('pug')
  , queries = require('../lib/queries')
  , logger = console
  , debug = require('debug')('document')
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
 * Thin wrapper around pug templates.
 */
class Renderer {
    /**
     * @param {Object} options
     * @param {directory} options.templateDir
     * @param {string} options.templatePrefix
     * @param {Object} options.globals
     * @param {Stream} options.stream
     */
    constructor (options) {

        this.templateDir = options.templateDir || '.';
        this.templatePrefix = options.templatePrefix || '';
        this.stream = options.stream || process.stdout;
        this.globals = options.globals || {};
        this.globals.pretty = ' ';      // debugging
        this.cache = {};                // compiled template cache
    }

    /**
     * @param {string} template - template ID
     * @return {function(Object): string} renderer
     */
    findTemplate (template) {
        if (!this.cache[template]) {
            let templateFile = path.join(this.templateDir,
                this.templatePrefix + template + '.pug');
            this.cache[template] = pug.compileFile(templateFile);
        }
        return this.cache[template];
    }

    /**
     * @param {string} template - template ID
     * @param {Object} locals
     */
    render (template, locals) {
        let templateFn = this.findTemplate(template);
        this.stream.write(templateFn(_.assign({}, this.globals, locals)));
    }

    /**
     * Emit DOCYPTE declaration
     */
    doctype () {
        this.stream.write(pug.render('doctype'));
    }
}

/**
 * @property {string} title - section title
 * @property {string} template - template ID
 * @property {Object} locals - locals to pass to template
 * @property {Section[]} contents - subsections
 */
class Section {
    constructor (options) {
        this.title = options.title || '';
        this.template = options.template || 'default';
        this.locals = options.locals || {};
        this.contents = options.contents || [];
    }

    /**
     * @param {Renderer} renderer
     */
    render (renderer) {
        this.locals.title = this.title;
        renderer.render(this.template, this.locals);

        for (var subsection of this.contents) {
            subsection.render(renderer);
        }
    }
}

function expand (db, spec) {
    let contents = (spec.contents || []).map(v => expand(db,v));
    if (spec.generate) {
        let generator = expand[spec.generate]
            || notfound('generator', spec.generate);
        return generator(db, spec, contents);
    } else if (spec.page) {
        return expand.page(db, spec, contents);
    } else {
        return new Section({ title: spec.title, contents: contents });
    }
}

expand.page = (db, spec, contents) => {
    let page = db.pages.findByKey(spec.page) || notfound('page', spec.page);
    return new Section({
        title: spec.title || page.data.title,
        template: page.data.template || 'page',
        locals: { page: page },
        contents: contents,
    });
};

expand.components = (db, spec) => new Section({
    title: spec.title || 'Components',
    contents: db.components.records.map(component => new Section({
        title: component.name,
        template: 'component',
        locals: queries.findComponent(db, { component: component.key })
    }))
});

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
expand.controls = (db, spec) => new Section({
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
expand.toc = nyi('toc');
expand.report = nyi('report');

const { linkto } = require('../lib/routes'); // TOFIX

function document (config, db, docid) {
    try {
        let spec = config.documents && config.documents[docid]
            || notfound('document', docid);

        debug('generating...');
        let document = expand(db, spec);

        debug('rendering...');
        let renderer = new Renderer({
            templateDir: templateDir,
            templatePrefix: 'doc-',
            stream: process.stdout,
            globals: {
                linkto: linkto,
                document: document
            }
        });
        renderer.doctype();
        renderer.render('head', {});
        document.render(renderer);

        debug('done.');
    } catch (err) {
        logger.error(err.message);
    }
}

module.exports = document;
