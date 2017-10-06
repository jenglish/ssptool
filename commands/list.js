/*! vim: set sw=4 et :*/

var _ = require('lodash')
  , format = require('util').format
  ;

var outfp = process.stdout;
var writeln = function (s) { outfp.write(s + "\n"); }

exports.run = function (sys) {
    writeln("Controls");
    _.forEach(sys.controls, (control, key) =>
    	writeln(format("  %s: %s", key, control.name)));

    writeln("Components");
    _.forEach(sys.components, (component, key) =>
    	writeln(format("  %s: %s", key, component.name)));
}
