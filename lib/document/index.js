
const { Renderer } = require('./render')
    , { Section, Document } = require('./section')
    , { generate } = require('./generate')
    ;
const path = require('path')
  , templateDir = path.join(__dirname, '../..', 'views')
  ;
 
exports.Renderer = Renderer;
exports.Section = Section;
exports.Document = Document;
exports.build = (db, spec) => new Document(
        generate(db, Object.assign({}, spec, {template: 'document'})));

const { linkto } = require('../routes'); // TOFIX
exports.print = function (doc, stream) {
    let renderer = new Renderer({
        templateDir: templateDir,
        templatePrefix: 'doc-',
        stream: stream,
        globals: {
            linkto: linkto,
            document: doc
        }
    });
    renderer.doctype();
    renderer.render('head', {});
    doc.render(renderer);
};

