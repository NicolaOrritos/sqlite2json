'use strict';

var S2J = require('../lib/s2j.js');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.sqlite2json =
{
    setUp: function(done)
    {
        // setup here
        done();
    },
    
    'simple': function(test)
    {
        test.expect(5);
        
        
        var s2j = new S2J('/tmp/contents/export/test/catalog_web_production.sqlite');
        
        s2j.addQuery('query1', 'SELECT * FROM issue');
        
        
        test.ok(s2j);
        
        

        s2j.run(function(err, json)
        {
            test.ifError(err);
            test.ok(json);
            
            var data = JSON.parse(json);
            
            test.ok(data);
            test.ok(data.query1);
            
            test.done();
        });
    }
};
