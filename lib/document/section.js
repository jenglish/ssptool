/** @file
 */

/**
 * @property {string} title - section title
 * @property {Vinyl} page - introductory content
 * @property {string} template - template ID
 * @property {Object} locals - locals to pass to template
 * @property {Section[]} contents - subsections
 * @property {Object[]} defines - entities defined in this section
 */
class Section {
    constructor (options) {
        this.page = options.page || { data: {}, html: null },
        this.title = options.title || this.page.data.title || '';
        this.template = options.template || 'default';
        this.locals = options.locals || {};
        this.contents = options.contents || [];
        this.defines = options.defines || [];

        this.locals.page = this.page;
        // overwritten later:
        this.id = this.number = '';
    }

    /**
     * @param {Renderer} renderer
     */
    render (renderer) {
        renderer.startTag('section', { id: this.id });
        var locals = Object.assign({ section: this }, this.locals);
        renderer.render(this.template, locals);
        for (var subsection of this.contents) {
            subsection.render(renderer);
        }
        renderer.endTag('section');
    }
}

/**
 * A Document is a top-level Section.
 */
class Document extends Section {

    /**
     * @param {Section} options
     */
    constructor (options) {
        super(options);
        this.id = 'root';
        this.number = '';
        this.definitions = {};

        this.numberSections(this.contents);
        this.collectDefinitions(this.contents);
    }

    define (what, key, section) {
        this.definitions[what + ':' + key] = section;
    }
    defined (what, key) {
        return this.definitions[what + ':' + key];
    }
    collectDefinitions (contents) {
        for (var section of contents) {
            for (var defn of (section.defines || [])) {
                for (var what in defn) {
                    this.define(what, defn[what], section);
                }
            }
            this.collectDefinitions(section.contents);
        }
    }

    /**
     * Assigns section numbers and IDs
     */
    numberSections (contents, prefix) {
        prefix = prefix || '';
        var i = 1;
        for (var section of contents) {
            let secnum = prefix + i.toString();
            section.number = secnum;
            section.id = 'section' + secnum;
            this.numberSections(section.contents, secnum + '.');
            i += 1;
        }
    }
}

exports.Section = Section;
exports.Document = Document;
