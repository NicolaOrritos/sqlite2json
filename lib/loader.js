
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
        var result = {};

        function metacallback(current, total, partialData)
        {
            result[partialData.name] = partialData.value;

            if (current === total && cb)
            {
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
            var db = new sqlite3.Database(':memory:', sqlite3.OPEN_READONLY, function(err)
            {
                if (err)
                {
                    console.log('Error opening the DB "%s": %s', path, err);
                }
                else
                {
                    var queries = CONF.QUERIES;

                    var count = countQueries(queries);
                    var index = -1;

                    var success = function(err2, row)
                    {
                        var data;
                        data.name  = query;
                        data.value = {};

                        index++;

                        if (err2)
                        {
                            console.log('Error when retrieving row #%s from query "%s": ', index, query, err2);
                        }
                        else
                        {
                            // 3. Convert to JSON

                            // TODO

                            data.value = row;
                        }

                        metacallback(index, count, data);
                    };

                    var finished = function(err3)
                    {
                        console.log('Error when finishing rows retrieval for query "%s": ', query, err3);

                        db.close(function(err4)
                        {
                            if (err4)
                            {
                                console.log('Error closing the DB "%s": %s', err4);
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


        // 4. Return the JSON
        return result;
    },

    loadIssueContents:   function(magazine, issue)
    {
        // TODO
    }
};
