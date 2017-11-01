const path = require('path')
  , pug = require('pug')
  , _ = require('lodash')
  ;

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

exports.Renderer = Renderer;
