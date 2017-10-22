
var expect = require('expect.js')
  , Collection         // system under test
  ;

describe('class Collection', function () {
    var coll;

    it('is exported from opencontrol/collection module', function () {
        Collection = require('../lib/opencontrol/collection').Collection;
        expect(Collection).to.be.ok();
    });

    it('holds a set of records', function () {
        coll = new Collection;
        coll.add({ a: 'A1', b: 'B1', c: 'C1' });
        coll.add({ a: 'A2', b: 'B2', c: 'C2' });
        expect(coll._records.length).to.eql(2);
    });

    it('and can start a lodash chain', function () {
        var ans = coll.chain()
           .filter({ b: 'B2' })
           .head()
           .pick(['a', 'b'])
           .value();
        expect(ans).to.eql({ a: 'A2', b: 'B2' });
    });
});

describe('Collections', function () {
    var coll;

    it('can be defined with a primary key', function () {
        coll = new Collection({primary_key: ['a', 'b']});
        coll.add({ a: 'A1', b: 'B1', c: 'C1' });
        coll.add({ a: 'A1', b: 'B2', c: 'C2' });
        coll.add({ a: 'A2', b: 'B1', c: 'C3' });
        coll.add({ a: 'A2', b: 'B2', c: 'C4' });
    });

    describe('findByKey method', function () {

    it('looks up records by primary key', function () {
        expect(coll.findByKey('A1', 'B1').c).to.equal('C1');
        expect(coll.findByKey('A1', 'B2').c).to.equal('C2');
        expect(coll.findByKey('A2', 'B1').c).to.equal('C3');
        expect(coll.findByKey('A2', 'B2').c).to.equal('C4');
    });

    it('returns null if the record is not found', function () {
        expect(coll.findByKey('A2', 'B3')).to.be(null);
    });

    it('must be called with the right number of arguments', function () {
        expect(() => coll.findByKey('A1')).to.throwException(/wrong#args/);
        expect(() => coll.findByKey('A1', 'B2', 'C3'))
            .to.throwException(/wrong#args/);
    });

    }); // findByKey method

    it('should probably be an error to add duplicate keys...', function () {
        coll.add({ a: 'A1', b: 'B1', c: 'C5' });
    });
    it('... but this is not curently enforced', function () {
        var ans = coll.chain().filter({ a: 'A1', b: 'B1'}).value();
        expect(ans.length).to.eql(2);
    });

});

describe('References', function () {
    var department, employee;

    it('declare partial functions between collections', function () {
        department = new Collection({
            primary_key: ['id'] ,
            fields: ['id', 'name']
        });
        employee = new Collection({
            primary_key: ['id'] ,
            fields: ['id', 'dept', 'name']
        });

        employee.references(department, { id: 'dept' }, 'department');

        // sample data:
        [ { id: 'D-SLYWKS', name: 'Silly Walks' }
        , { id: 'D-RDRDRD', name: 'Redundancy Department' }
        , { id: 'D-BDMNKY', name: 'Disposition of Irredeemable Persons' }
        ].forEach(d => department.add(d));

        [ { id: 'E-001', dept: 'D-RDRDRD', name: 'John "Johnny" Johnson' }
        , { id: 'E-002', dept: 'D-RDRDRD', name: 'Eric Erickson III' }
        , { id: 'E-003', dept: 'D-RDRDRD', name: 'Eric Erickson Jr' }
        , { id: 'E-004', dept: 'D-RDRDRD', name: 'Eric Erickson Sr' }
        ].forEach(e => employee.add(e));
        // test doesn't actually use that table...

        describe ('populate method', function () {

            it('resolves references', function () {
                var e = employee.findByKey('E-004');

                expect(e.name).to.eql('Eric Erickson Sr');
                employee.populate(e);
                expect(e.department).to.be.ok();
                expect(e.department.name).to.eql('Redundancy Department');
            });

            it('record need not be a member of the collection', function () {
                var e = employee.populate({ id: 'X-023', dept: 'D-SLYWKS' });
                expect(e.department.name).to.eql('Silly Walks');
            });

            it('referenced record need not exist', function () {
                var e = employee.populate({ id: 'E-LIM', dept: 'D-NOSUCH' });
                expect(e.department).to.be(null);
            });
        });

    });


});
