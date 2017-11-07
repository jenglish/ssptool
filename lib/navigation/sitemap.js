
const { NavItem } = require('./navitem');
const { NavInfo } = require('./navinfo');

/**
 * Builds a sitemap.
 *
 * The site may contain multiple top-level sections,
 * each with its own table of contents.
 *
 * @property {NavItem[]} roots list of root items
 */
class Sitemap {

    constructor () {
        this.items = {};        // map: path -> item
        this.roots = [];        // list of top-level TOCs.
        this.ptr = null;        // current write pointer while building TOCs
    }

    /** Add a leaf item to current section.
     *  Creates a new top-level section if at the root.
     *  @return {NavItem} newly created item.
     */
    add (path, label, title, data) {
        var item = new NavItem(path, label, title, data);
        if (this.ptr) {
            this.ptr.add(item);
        } else {
            this.roots.push(item);
        }
        this.items[path] = item;
        return item;
    }

    /** Begin a new section.
     *  @return {NavItem} newly created item
     */
    begin (path, label, title, data) {
        this.ptr = this.add(path, label, title, data);
        return this.ptr;
    }

    /** End current section.
     * @return {NavItem} parent section
     */
    end() {
        this.ptr = this.ptr.parent;
        return this.ptr;
    }

    /** Look up NavItem by path
     *  @param {string} path
     *  @returns NavItem, null if path not present
     */
    find (path) {
        return this.items[path];
    }

    /** @return {?NavInfo} navigation information for specified path,
     *  null if path not found.
     */
    navinfo (path) {
        var item = this.find(path);
        return item ? new NavInfo(item) : null;
    }

    /** @return {NavItem[]} list of top-level sections
     */
    get toplinks() {
        return this.roots.length == 1 ? this.roots[0].contents : this.roots;
    }
}

module.exports.Sitemap = Sitemap;
