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
        var locals = Object.assign({ section: this }, this.locals);
        renderer.render(this.template, locals);
        for (var subsection of this.contents) {
            subsection.render(renderer);
        }
    }
}

function numberSections (contents, prefix) {
    prefix = prefix || '';
    var i = 1;
    for (var section of contents) {
        section.number = prefix + i.toString();
        numberSections(section.contents, section.number + '.');
        i += 1;
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
        numberSections(this.contents);
    }
}

exports.Section = Section;
exports.Document = Document;
