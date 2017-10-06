/*! vim: set sw=4 et :*/

var http = require('http')
  , app = require('../app')
  , logger = console
  ;

exports.defaults = {
    server: {
        port: 3000
    }
}
exports.run = function(options) {
    var port = options.port || exports.defaults.server.port
      , server = http.createServer(app)
      ;
    server.on('error', function (error) {
        logger.error(error);
    });
    server.listen(port, function () {
        var a = server.address();
        logger.info('listening on http://localhost:%d', a.port);
    });
};

