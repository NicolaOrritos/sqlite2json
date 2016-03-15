/*
 * sqlite2json
 * https://github.com/NicolaOrritos/sqlite2json
 *
 * Copyright (c) 2016 Nicola Orritos
 * Licensed under the MIT license.
 */


'use strict';


const sqlite3 = require('sqlite3').verbose();


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
    if (callback)
    {
        // 1. Load the SQLite file
        const db = new sqlite3.Database(this.sqlitePath, sqlite3.OPEN_READONLY, err =>
        {
            if (err)
            {
                console.log('Error opening the DB "%s": %s', this.sqlitePath, err);

                callback(err);
            }
            else
            {
                const queriesNames = [];

                for (const query in this.queries)
                {
                    if (this.queries.hasOwnProperty(query))
                    {
                        queriesNames.push(query);
                    }
                }

                if (queriesNames.length === 0)
                {
                    callback(null, '{}');
                }
                else
                {
                    const promises = queriesNames.map( query =>
                    {
                        return new Promise( (resolve, reject) =>
                        {
                            db.all(this.queries[query], (err, all) =>
                            {
                                // console.log('Got the following results for query "%s": %s  -  %s', query, err, all);

                                if (err)
                                {
                                    console.log('Error when finishing rows retrieval for query "%s": ', query, err);
                                    console.log('Stopping because of the following error: %s', err);

                                    reject(err);
                                }
                                else
                                {
                                    const result = {};
                                    result.name  = query;
                                    result.rows  = all;

                                    resolve(result);
                                }
                            });
                        });
                    });

                    Promise.all(promises)
                    .then( queries =>
                    {
                        const result = {};

                        for (const query in queries)
                        {
                            result[query.name] = query.rows;
                        }

                        // 2. Return the JSON
                        const json = JSON.stringify(result);

                        // Return by calling-back
                        callback(null, json);

                        // Be polite and close the DB
                        if (db)
                        {
                            db.close( err =>
                            {
                                if (err)
                                {
                                    console.log('Error closing the DB "%s": %s', err);
                                }
                            });
                        }
                    })
                    .catch(callback);
                }
            }
        });
    }
};


module.exports = S2J;
