/*
 * sqlite2json
 * https://github.com/NicolaOrritos/sqlite2json
 *
 * Copyright (c) 2014 Nicola Orritos
 * Licensed under the MIT license.
 */


'use strict';


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


function S2J(sqlitePath)
{
    if (sqlitePath)
    {
        this.sqlitePath = sqlitePath;
        this.queries    = {};
    }
    else
    {
        throw new Error('Missing parameter "sqlitePath"');
    }
}

S2J.prototype.addQuery = function(name, sql)
{
    if (name && sql)
    {
        this.queries[name] = sql;
    }
};

S2J.prototype.run = function(callback)
{
    var result               = {};
    var finishBecauseOfError = false;
    
    
    function metacallback(current, total, queryName, err, partialData)
    {
        if (err)
        {
            console.log('Stopping at row #%s because of the following error: %s', current, err);
            
            finishBecauseOfError = true;
        }
        else
        {
            result[queryName] = partialData;
        }

        if (finishBecauseOfError === true || (current === total && callback))
        {
            // 4. Return the JSON
            var json = JSON.stringify(result);
            
            if (callback)
            {
                callback(err, json);
            }
            
            
            // Be polite and close the DB 
            if (db)
            {
                db.close(function(err4)
                {
                    if (err4)
                    {
                        console.log('Error closing the DB "%s": %s', err4);
                    }
                });
            }
        }
    }
    
    
    if (callback)
    {
        var self = this;
        
        // 1. Load the SQLite file
        var db = new sqlite3.Database(this.sqlitePath, sqlite3.OPEN_READONLY, function(err)
        {
            if (err)
            {
                console.log('Error opening the DB "%s": %s', self.sqlitePath, err);
            }
            else
            {
                var queriesCount = countQueries(self.queries);
                var queriesIndex = 0;
                var rows         = [];
                
                if (queriesCount === 0 && callback)
                {
                    callback(null, '{}');
                }
                else
                {
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

                        db.each(query, success, finished);
                    };


                    for (var query in self.queries)
                    {
                        loadQuery(query, self.queries[query]);
                    }
                }
            }
        });
    }
};


module.exports = S2J;
