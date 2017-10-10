
var navigation, NavItem, Sitemap;        // system under test

var expect = require('expect.js');

before(function () {
    navigation = require('../lib/navigation');
});

describe("navigation module", function () {
    it("exports a NavItem constructor", function () {
        NavItem = navigation.NavItem;
	expect(NavItem).to.be.ok();
    });
    it("exports a Sitemap constructor", function () {
        Sitemap = navigation.Sitemap;
	expect(Sitemap).to.be.ok();
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

/** Build a dummy NavItem hierarchy using Sitemap
 */
var buildsite = function (sitemap, p, childno, depth, width) {
    p = p.slice();
    p.push(childno);
    sitemap.begin(p.join("/"), p.slice(1).join("."));
    if (depth > 0) {
        for (var i = 0; i < width; ++i) {
            buildsite(sitemap, p, i+1, depth-1, width);
        }
    }
    sitemap.end();
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

describe("Sitemap", function () {
    var sitemap;
    it("builds an index incrementally", function () {
	sitemap = new Sitemap;
        buildsite(sitemap, [], "", 3, 3);
    });
    it("find() method looks up NavItems based on paths", function () {
        expect(sitemap.find("/1/1/3")).to.be.a(NavItem);
    });
    it("navinfo() method", function () {
        var nav = sitemap.navinfo("/1/3/2");
        expect(nav.title).to.eql("1.3.2");
        expect(nav.label).to.eql("1.3.2");
        expect(nav.next).to.be.a(NavItem);
	expect(nav.next.label).to.eql("1.3.3");
	expect(nav.prev.label).to.eql("1.3.1");

        var bclabels = [];
        for (var crumb of nav.breadcrumbs) {
            bclabels.push(crumb.label);
        }
        expect(bclabels).to.eql(["", "1", "1.3", "1.3.2"]);
    });

    it("supports multiple root TOCs", function () {
	var s = new Sitemap;
	s.begin("/sectionA", "Section A");
	s.add("/sectionA/page1", "Section A page 1");
	s.add("/sectionA/page2", "Section A page 2");
	s.end();

	s.begin("/sectionB", "Section B");
	s.add("/sectionB/page1", "Section B page 1");
	s.add("/sectionB/page2", "Section B page 2");
	s.end();

	expect(s.toplinks.length).to.equal(2);
	expect(s.toplinks[0]).to.be.a(NavItem);
	expect(s.toplinks[0].label).to.eql("Section A");
	expect(s.toplinks[1]).to.be.a(NavItem);
	expect(s.toplinks[1].label).to.eql("Section B");
    });
});

