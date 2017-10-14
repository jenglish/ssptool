
var expect = require('expect.js');
var util = require('../lib/util');  // system under test

describe('unnest function', function () {
    var d = { a1: [{ b: 'b1' }, { b: 'b2' }, { b: 'b3' }],
              a2: [{ b: 'b4' }, { b: 'b5' }, { b: 'b6' }],
              a3: [{ b: 'b7' }, { b: 'b8' }, { b: 'b9' }]};

    it('turns a dictionary of lists into a flat list', function () {
        let l = util.unnest(d, ['a']);

        expect(l).to.be.an(Array);
        expect(l.length).to.eql(9);
    });

    it('does not modify its input record', function () {
        expect(d.a1[0]).to.eql({ b: 'b1' });
    });

    it('unnests multiple levels of dictionaries', function () {
        let l = util.unnest({ c1: d, c2: d, c3: d }, ['c', 'a']);
        expect(l).to.be.an(Array);
        expect(l.length).to.eql(27);
        expect(d.a1[0]).to.eql({ b: 'b1' });
        for (var e of l) {
            expect(e).to.have.property('a');
            expect(e).to.have.property('b');
            expect(e).to.have.property('c');
        }
    });
});
