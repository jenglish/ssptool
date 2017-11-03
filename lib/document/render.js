const path = require('path')
  , pug = require('pug')
  , _ = require('lodash')
  ;


/**
 * Encode attribute value as HTML.
 *
 * @param {string} s - value to encode
 * @return {string} attribute value literal.
 */
function attval (s) {
    return '"' + (s
        .replace(/&/g, '&amp;')
        .replace(/'/g, '&apos;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    ) + '"';
}

/**
 */
function startTag (name, attributes) {
    var stag = '<' + name;
    for (var attname in attributes) {
        stag += ' ' + attname + ' = ' + attval(attributes[attname]);
    }
    stag += '>';
    return stag;
}

function endTag (name) {
    return '</' + name + '>';
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

    /**
     * Emit a start-tag
     */
    startTag (name, attributes) {
        this.stream.write(startTag(name, attributes));
    }

    /**
     * Emit an end-tag
     */
    endTag (name) {
        this.stream.write(endTag(name));
    }
}

exports.Renderer = Renderer;
