/** @file navigation package
 */

exports.NavItem = require('./navitem').NavItem;
exports.Sitemap = require('./sitemap').Sitemap;

/** Route middleware constructor.
 *
 * Looks up req.path in the provided Sitemap,
 * sets res.locals.navinfo if found.
 * It is not an error if the path is not present in the sitemap;
 * res.locals.navinfo is null in that case.
 */
function middleware (sitemap) {
    return function (req, res, next) {
        res.locals.nav = sitemap.navinfo(req.path);
        next();
    };
}

exports.middleware = middleware;
