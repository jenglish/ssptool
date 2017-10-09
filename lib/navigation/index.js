/**
 * Utilities for creating navigation links from a table of contents.
 */

function lastpart(path) {
    var parts = path.split("/");
    return parts[parts.length - 1];
};

class NavItem {
    /**
     * @param  path - request path
     * @param label - short label (used in breadcrumbs, etc.)
     * @param title - full title
     */

    constructor (path, label, title) {
        this.path = path;
        this.label = label || lastpart(path);
        this.title = title || this.label;
        this.contents = [];
        this.parent = null;
    };

    /** Append a subitem to contents
     * @param (NavItem) child - new subitem
     */
    add (child) {
        this.contents.push(child);
        child.parent = this;
    };

    /** @return the position of this item in its parent.
     *  It is an error if this is the root.
     */
    position () {
        return this.parent.contents.findIndex(child => child === this);
    }

    /** @return previous sibling, null if this is the first child.
     */
    left () {
        var pos = this.position() - 1;
        return pos >= 0 ? this.parent.contents[pos] : null;
    }

    /** @return next sibling, null if this is the last child
     */
    right () {
        var pos = this.position() + 1, siblings = this.parent.contents;
        return pos < siblings.length ? siblings[pos] : null;
    }

    /** @return next item in preorder traversal
     */
    next () {
        var item = this;
        if (item.contents.length) {
            return item.contents[0];
        }
        while (item.parent) {
            let pos = item.position() + 1;
            item = item.parent;
            if (pos < item.contents.length) {
                return item.contents[pos];
            }
        }
        return null;
    }

    /** @return previous item in preorder traversal
     */
    prev () {
        if (this.parent) {
            var p = this.left();
            if (p) {
                while (p.contents.length) {
                   p = p.contents[p.contents.length -1];
                }
                return p;
            }
        }
        return this.parent;
    }

    /** @return sequence of NavItems on the path from the root to this item.
     */
    breadcrumbs () {
        var result = this.parent ? this.parent.breadcrumbs() : [];
        result.push(this);
        return result;
    }
};

class NavIndex {
    /** @param (NavItem) toc - root of table of contents
     */
    constructor (toc) {
        this.toc = toc;
        this.items = {};
        for (var item = toc; item; item = item.next()) {
            this.items[item.path] = item;
        }
    }

    /** Look up NavItem by path
     *  @param (String) path
     *  @returns NavItem
     */
    find (path) {
        return this.items[path];
    }

    /** Look up navigation information
     */
    navinfo (path) {
        var item = this.find(path);
        if (!item) { return null; }
        return {
            toc: this.toc
          , title: item.title
          , label: item.label
          , next: item.next()
          , prev: item.prev()
          , breadcrumbs: item.breadcrumbs()
        }
    }
};

exports.NavItem = NavItem;
exports.NavIndex = NavIndex;

