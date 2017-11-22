
const { Renderer } = require('./render')
    , { Section, Document } = require('./section')
    , { generate } = require('./generate')
    , mdparser = require('../opencontrol/mdparser')
    , path = require('path')
    , templateDir = path.join(__dirname, '../..', 'views')
    ;
 
exports.Renderer = Renderer;
exports.Section = Section;
exports.Document = Document;
exports.build = (db, spec) => new Document(
        generate(db, Object.assign({}, spec, {template: 'document'})));

exports.print = function (doc, stream) {
    const { SinglePageLinks } = require('../routes');
    let renderer = new Renderer({
        templateDir: templateDir,
        templatePrefix: 'doc-',
        stream: stream,
        globals: {
            linkto: new SinglePageLinks(doc),
            markdown: mdparser.parse,
            document: doc
        }
    });
    renderer.doctype();
    renderer.render('head', {});
    doc.render(renderer);
};

