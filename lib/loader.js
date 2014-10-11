
'use strict';

var CONF    = require('./conf');
var fs      = require('fs');
var path    = require('path');
var crypto  = require('crypto');
var sjl     = require('sjl');
var rewrite = require('pathrewrite');
var sqlite3 = require('sqlite3').verbose();


function calculateHash(file, cb)
{
    if (file && cb)
    {
        var md5sum = crypto.createHash('md5');

        var s = fs.ReadStream(file);

        s.on('data', function(data)
        {
            md5sum.update(data);
        });

        s.on('end', function()
        {
            var data = md5sum.digest('hex');

            console.log(data + '  ' + file);

            cb(data);
        });
    }
}


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


function loadCachedCatalog(magazine, cb)
{
    if (magazine && cb)
    {
        var catalogPath = path.join(CONF.CACHE.PATH, magazine + ".cache");
            catalogPath = path.resolve(catalogPath);
        
        console.log('Trying to load cached file from "%s"...', catalogPath);

        if (fs.existsSync(catalogPath))
        {
            console.log('"%s" exists...', catalogPath);
            
            var json = sjl(catalogPath, {});

            if (json.hash && json.sqlitePath && json.contents)
            {
                calculateHash(json.sqlitePath, function(hash)
                {
                    if (hash === json.hash)
                    {
                        cb(json.contents);
                    }
                    else
                    {
                        cb();
                    }
                });
            }
            else
            {
                cb();
            }
        }
        else
        {
            console.log('"%s" doesn\'t exist...', catalogPath);
            
            cb();
        }
    }
    else
    {
        cb();
    }
}

function loadCatalogFromDisk(magazine, cb)
{
    var result = {};
    var db;
    var rewrittenPath;

    function metacallback(current, total, queryName, err, partialData)
    {
        console.log('metacallback called, %s, %s, %s, %s', current, total, err, JSON.stringify(partialData));

        if (err)
        {
            console.log('Skipping row #%s because of the following error: %s', current, err);
        }
        else
        {
            result[queryName] = partialData;
        }

        if (current === total && cb)
        {
            // 4. Return the JSON
            console.log('Returning the following: %s', JSON.stringify(result));

            cb(result, rewrittenPath);

            if (db)
            {
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
            }
        }
    }

    if (magazine)
    {
        // 1. Load rewrite rules for finding the DB file:
        var rewriteRules = rewrite.Rules.loadMulti(CONF.REWRITE_ENGINE.RULES);

        rewrittenPath = '/v+fs/magazines/' + magazine + '/catalog';
        rewrittenPath = rewrite.go(rewrittenPath, rewriteRules);

        console.log('Overwritten path: %s', rewrittenPath);

        // 2. Load the SQLite file
        db = new sqlite3.Database(rewrittenPath, sqlite3.OPEN_READONLY, function(err)
        {
            if (err)
            {
                console.log('Error opening the DB "%s": %s', rewrittenPath, err);
            }
            else
            {
                // TEST DATA
                /* db.exec('CREATE TABLE issue(x INTEGER PRIMARY KEY ASC, y TEXT);');
                db.exec('INSERT INTO issue(x, y) VALUES(12, "hello");'); */

                var queries      = CONF.QUERIES;
                var queriesCount = countQueries(queries);
                var queriesIndex = 0;
                var rows         = [];
                
                
                var loadQuery = function(queryName, query)
                {
                    var success = function(err2, row)
                    {
                        if (err2)
                        {
                            console.log('Error when retrieving row #%s from query "%s": ', queriesIndex, query, err2);
                        }
                        else
                        {
                            console.log('Pushing row for query "%s"', queryName);

                            rows.push(row);
                        }
                    };

                    var finished = function(err3)
                    {
                        queriesIndex++;

                        var queriedRows = rows;
                        rows = [];

                        if (err3)
                        {
                            console.log('Error when finishing rows retrieval for query "%s": ', query, err3);
                        }

                        // 3. Send data as JSON to metacallback to store it (or an error)
                        metacallback(queriesIndex, queriesCount, queryName, err3, queriedRows);
                    };
                    
                    console.log('Query "%s": %s', queryName, query);

                    db.each(query, success, finished);
                };


                for (var query in queries)
                {
                    loadQuery(query, queries[query]);
                }
            }
        });
    }
}

function cacheCatalog(magazine, catalog, from)
{
    if (magazine && catalog)
    {
        var catalogPath = path.join(CONF.CACHE.PATH, magazine + ".cache");
            catalogPath = path.resolve(catalogPath);
        
        calculateHash(from, function(fileHash)
        {
            var data = {
                hash: fileHash,
                sqlitePath: from,
                contents: catalog
            };

            fs.writeFile(catalogPath, JSON.stringify(data));
        });
    }
}


module.exports =
{
    loadMagazineCatalog: function(magazine, cb)
    {
        loadCachedCatalog(magazine, function(cached)
        {
            if (cached && cb)
            {
                cb(cached);
            }
            else
            {
                loadCatalogFromDisk(magazine, function(catalog, from)
                {
                    if (catalog)
                    {
                        cacheCatalog(magazine, catalog, from);
                    }

                    if (cb)
                    {
                        cb(catalog);
                    }
                });
            }
        });
    }/*,

    loadIssueContents: function(magazine, issue)
    {
        // TODO
    }*/
};
