
const { Renderer } = require('./render')
    , { Section, Document } = require('./section')
    , { generate } = require('./generate')
    ;


exports.Renderer = Renderer;
exports.Section = Section;
exports.Document = Document;
exports.build = (db, spec) => new Document(
        generate(db, Object.assign({template: 'document'}, spec)));

