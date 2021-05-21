
var app = require('../../app')
  , opencontrol = require('../../lib/opencontrol')
  , mock = require('../..//mock')
  , http = require('http')
  , server = http.createServer(app)
  , port = process.env.PORT || 3000
  ;

opencontrol.load(mock.config, function (err, db) {
    if (err) { return err; }
    app.initialize(mock.config, db);
    server.listen(port);
});

