
var navigation, NavItem, NavIndex;        // system under test

var expect = require('expect.js');

before(function () {
    navigation = require('..');
});

describe("navigation module", function () {
    it("exports a NavItem constructor", function () {
        NavItem = navigation.NavItem;
    });
    it("exports a NavIndex constructor", function () {
        NavIndex = navigation.NavIndex;
    });
});

describe("NavItem constructor", function () {
    it("takes up to three arguments", function () {
        var item = new NavItem("thePath", "theLabel", "theTitle");
        expect(item.path).to.eql("thePath");
        expect(item.label).to.eql("theLabel");
        expect(item.title).to.eql("theTitle");
        expect(item.contents).to.eql([]);
    });
    it("the title defaults to the label", function () {
        var item = new NavItem("thePath", "theLabel");
        expect(item.path).to.eql("thePath");
        expect(item.label).to.eql("theLabel");
        expect(item.title).to.eql("theLabel");
        expect(item.contents).to.eql([]);
    });
    it("the label defaults to the last component of the path", function () {
        var item = new NavItem("/part1/section2");
        expect(item.path).to.eql("/part1/section2");
        expect(item.label).to.eql("section2");
        expect(item.title).to.eql("section2");
        expect(item.contents).to.eql([]);
    });
    it("starts with empty contents and null parents", function () {
        var item = new NavItem("/part1/section2", "2.", "Section 2");
        expect(item.contents).to.eql([]);
        expect(item.parent).to.equal(null);
    });
});

/** Build a dummy NavItem hierarchy.
 */
var buildtree = function (p, childno, depth, width) {
    p = p.slice();
    p.push(childno);
    var item = new NavItem(p.join("/"), p.slice(1).join("."));
    if (depth > 0) {
        for (var i = 0; i < width; ++i) {
            item.add(buildtree(p, i+1, depth-1, width));
        }
    }
    return item;
}

describe("NavItem hierarchy", function () {
    it("add() method adds child nodes", function () {
        var p1 = new NavItem("/part1")
          , s1 = new NavItem("/part1/section1")
          , s2 = new NavItem("/part1/section2")
          , s3 = new NavItem("/part1/section3")
          ;
        p1.add(s1);
        p1.add(s2);
        p1.add(s3);

        expect(p1.contents.length).to.eql(3);
        expect(p1.contents[0]).to.equal(s1);
        expect(p1.contents[1]).to.equal(s2);
        expect(p1.contents[2]).to.equal(s3);

        expect(s1.parent).to.equal(p1);
        expect(s2.parent).to.equal(p1);
        expect(s3.parent).to.equal(p1);
    });

    it("next / prev methods peform inorder traversal", function () {
        var toc = buildtree([], "", 3, 3);

        // sanity-check mock data, make sure buildtree() worked right
        expect(toc.title).to.equal("")
        expect(toc.contents.length).to.equal(3);
        expect(toc.contents[0].contents[2].label).to.equal("1.3")

        var prev = null, count = 0;
        for (var item = toc; item; item = item.next()) {
            expect(item.prev()).to.equal(prev);
            prev = item;
            count++;
        }

        // make sure everything was visited
        // (1 root, 3 children, 9, grandchildren, ...
        expect(count).to.equal(1 + 3 + 9 + 27)
    });

});

describe("NavIndex", function () {
    var toc, index;
    it("builds an index from a table of contents", function () {
        toc = buildtree([], "", 3, 3);
        index = new NavIndex(toc);
    });
    it("find() method looks up NavItems based on paths", function () {
        expect(index.find("/1/1/3")).to.be.a(NavItem);
    });
    it("navinfo() method", function () {
        var nav = index.navinfo("/1/3/2");
        expect(nav.title).to.eql("1.3.2");
        expect(nav.label).to.eql("1.3.2");
        expect(nav.next).to.be.a(NavItem);
        expect(nav.toc).to.equal(toc);

        var bclabels = [];
        for (var crumb of nav.breadcrumbs) {
            bclabels.push(crumb.label);
        }
        expect(bclabels).to.eql(["", "1", "1.3", "1.3.2"]);
    });
});

