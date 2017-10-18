
const { NavItem } = require('./navitem');

/**
 * Builds a sitemap.
 *
 * The site may contain multiple top-level sections,
 * each with its own table of contents.
 */
class Sitemap {

    constructor () {
        this.items = {};        // map: path -> item
        this.roots = [];        // list of top-level TOCs.
        this.ptr = null;        // current write pointer while building TOCs
    }

    /** @return {NavItem[]} list of top-level sections
     */
    get toplinks() {
        return this.roots;
    }


    /** Add a leaf item to current section.
     *  Creates a new top-level section if at the root.
     *  @return {NavItem} newly created item.
     */
    add (path, label, title) {
        var item = new NavItem(path, label, title);
        if (this.ptr) {
            this.ptr.add(item);
        } else {
            this.roots.push(item);
        }
        this.items[path] = item;
        return item;
    }

    /** Begin a new section.
     */
    begin (path, label, title) {
        this.ptr = this.add(path, label, title);
    }

    /** End current section.
     */
    end() {
        this.ptr = this.ptr.parent;
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
        return item ? item.navinfo() : null;
    }
}

module.exports.Sitemap = Sitemap;
