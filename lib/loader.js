
'use strict';

var CONF    = require('./conf');
var rewrite = require('pathrewrite');
var sqlite3 = require('sqlite3').verbose();


function countQueries(queries)
{
    var result = 0;

    for (var field in queries)
    {
        if (queries.hasOwnProperty(field))
        {
            result++;
        }
    }

    return result;
}


module.exports =
{
    loadMagazineCatalog: function(magazine, cb)
    {
        var result = [];

        function metacallback(current, total, err, partialData)
        {
            console.log('metacallback called, %s, %s, %s, %s', current, total, err, partialData);

            if (err)
            {
                console.log('Skipping row #%s because of the following error: %s', current, err);
            }
            else
            {
                result.push(partialData);
            }

            if (current === total && cb)
            {
                // 4. Return the JSON
                console.log('Returning the following: %s', JSON.stringify(result));

                cb(result);
            }
        }

        if (magazine)
        {
            // 1. Load rewrite rules for finding the DB file:
            var rewriteRules = rewrite.Rules.loadMulti(CONF.REWRITE_ENGINE.RULES);

            var path = '/v+fs/magazines/' + magazine + '/catalog';
            path = rewrite.go(path, rewriteRules);

            console.log('Overwritten path: %s', path);

            // 2. Load the SQLite file
            // var db = new sqlite3.Database(path, sqlite3.OPEN_READONLY, function(err)
            var db = new sqlite3.Database(':memory:', /* sqlite3.OPEN_READONLY, */ function(err) // TEST DATA
            {
                if (err)
                {
                    console.log('Error opening the DB "%s": %s', path, err);
                }
                else
                {
                    // TEST DATA
                    db.exec('CREATE TABLE issue(x INTEGER PRIMARY KEY ASC, y TEXT);');
                    db.exec('INSERT INTO issue(x, y) VALUES(12, "hello");');

                    var queries = CONF.QUERIES;

                    var count = countQueries(queries);
                    var index = 0;

                    var success = function(err2, row)
                    {
                        index++;

                        if (err2)
                        {
                            console.log('Error when retrieving row #%s from query "%s": ', index, query, err2);
                        }

                        // 3. Send data as JSON to metacallback to store it (or an error)
                        metacallback(index, count, err2, row);
                    };

                    var finished = function(err3)
                    {
                        if (err3)
                        {
                            console.log('Error when finishing rows retrieval for query "%s": ', query, err3);
                        }

                        db.close(function(err4)
                        {
                            if (err4)
                            {
                                console.log('Error closing the DB "%s": %s', err4);
                            }
                            else
                            {
                                console.log('DB closed');
                            }
                        });
                    };


                    for (var query in queries)
                    {
                        console.log('Query "%s": %s', query, queries[query]);

                        db.each(queries[query], success, finished);
                    }
                }
            });
        }
    },

    loadIssueContents:   function(magazine, issue)
    {
        // TODO
    }
};
