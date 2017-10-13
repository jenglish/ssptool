
const { format } = require('util');

var outfp = process.stdout;
var writeln = function (s) { outfp.write(s + '\n'); };

exports.run = function (db) {
    writeln('Controls');

    db.controls.chain()
    .sortBy('key')
    .forEach(control =>
        writeln(format('  %s: %s', control.key, control.name)))
    .value();

    writeln('Components');
    db.components.chain()
    .sortBy('key')
    .forEach(component =>
        writeln(format('  %s: %s', component.key, component.name)))
    .value();
};
