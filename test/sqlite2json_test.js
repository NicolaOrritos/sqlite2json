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
        // Test data created as follows:
        /* CREATE TABLE foo(x INTEGER PRIMARY KEY ASC, y TEXT);
           INSERT INTO foo(x, y) VALUES(12, "hello"); */
        
        
        test.expect(5);
        
        
        var s2j = new S2J('test/test.sqlite');
        
        s2j.addQuery('query1', 'SELECT * FROM foo');
        
        
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
    },
    
    'no queries': function(test)
    {
        test.expect(5);
        
        
        var s2j = new S2J('test/test.sqlite');
        
        
        test.ok(s2j);
        
        

        s2j.run(function(err, json)
        {
            test.ifError(err);
            test.ok(json);
            
            var data = JSON.parse(json);
            
            test.ok(data);
            test.deepEqual(data, {});
            
            test.done();
        });
    }
};
