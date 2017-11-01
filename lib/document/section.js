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

exports.Section = Section;
