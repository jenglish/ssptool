
var express = require('express')
  , router = express.Router()
  , _ = require('underscore')
  ;

/************************************************************************
 ***
 *** Utilities
 ***
 ***/

/** Route middleware constructor
 */
function sendpage (view) {
    return function(req, res, next) { res.render(view); }
}

/** Route middleware constructor
 *
 *  @param qf - query function.
 *
 * qf takes a @{link opencontrol.Database} and the query parameters
 * and returns a hash. All keys in the hash are added to res.locals.
 */
function runQuery (qf) {
    return function (req, res, next) {
        try {
            let db = req.app.get('db');
            let ans = qf(db, req.params)
            _.forEach(ans, (v,k) => res.locals[k] = v);
        } catch (err) {
          return next(err);
        }
        next();
    }
}

/************************************************************************
 ***
 *** Queries
 ***
 ***/

function listControls (db, params) {
    return { controls: _.values(db.controls) }
}

function listComponents (db, params) {
    return { components: _.values(db.components) }
}

/************************************************************************
 ***
 *** Routes
 ***
 ***/

router.get('/', sendpage('index'));
router.get('/controls', runQuery(listControls), sendpage('controls'));
router.get('/components', runQuery(listComponents), sendpage('components'));

module.exports = router;
