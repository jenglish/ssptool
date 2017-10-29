/**
 * @file
 * Navigation information for use in templates.
 */

/**
 * Container for links and other navigational aids for a NavItem.
 *
 * @property {string} title - item title, for use in TOC &c.
 * @property {string} label - short label, for use in breadcrumbs &c
 * @property {NavItem[]} breadcrumbs - path from root to current item
 * @property {NavItem[]} contents - list of children
 * @property {Object<string,NavItem>} links - relative links
 * @property {NavItem} links.next
 * @property {NavItem} links.prev
 * @property {NavItem} links.up
 * @property {NavItem} links.toc
 */

class NavInfo {
    /**
     * @param {NavItem} item
     */
    constructor (item) {
        this.item = item;
        this.title = item.title;
        this.label = item.label;
        this.breadcrumbs =  item.breadcrumbs();
        this.contents =  item.contents;
        this.links =
            { next: item.next()
            , prev: item.prev()
            , up:   item.up()
            , toc:  item.top()
            };
    }

    /**
     * @param {NavItem} that
     * @returns true if current item is a descendant of _that_.
     *
     * Useful for determining active navbar tabs,
     * TOC open/closed status, etc.
     */
    descendantOf (that) {
        for (var p = this.item; p; p = p.up()) {
            if (p === that) {
                return true;
            }
        }
        return false;
    }
}

exports.NavInfo = NavInfo;
