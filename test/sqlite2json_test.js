'use strict';

/* global describe */
/* global it */

const assert = require('assert');
const S2J    = require('../lib/s2j.js');

describe('sqlite2json module', () =>
{
    // Test data created as follows:
    /* CREATE TABLE foo(x INTEGER PRIMARY KEY ASC, y TEXT);
       INSERT INTO foo(x, y) VALUES(12, "hello");
       INSERT INTO foo(x, y) VALUES(13, "bye");

       CREATE TABLE bar(w text PRIMARY KEY ASC, z INTEGER);
       INSERT INTO bar(w, z) VALUES("good", 798);
       INSERT INTO bar(w, z) VALUES("bad", 541); */

    it('must retrieve various different combinations of JSON documents based on queries being performed on SQLite databases', done =>
    {
        const s2j = new S2J('test/test.sqlite');

        s2j.addQuery('query1', 'SELECT * FROM foo');
        s2j.addQuery('query2', 'SELECT x, y FROM foo');
        s2j.addQuery('query3', 'SELECT x FROM foo');

        s2j.addQuery('query4', 'SELECT w, z FROM bar WHERE z = 541');


        assert.ok(s2j);


        s2j.run()
        .then( json =>
        {
            assert.ok(json);

            const data = JSON.parse(json);

            assert.ok(data);
            assert.ok(data.query1);
            assert.ok(data.query2);
            assert.ok(data.query3);
            assert.ok(data.query4);

            assert.ok(data.query1[0]);
            assert.ok(data.query1[0].x === 12);
            assert.ok(data.query1[0].y === 'hello');
            assert.ok(data.query1[1]);
            assert.ok(data.query1[1].x === 13);
            assert.ok(data.query1[1].y === 'bye');

            assert.ok(data.query2[0]);
            assert.ok(data.query2[0].x === 12);
            assert.ok(data.query2[0].y === 'hello');
            assert.ok(data.query2[1]);
            assert.ok(data.query2[1].x === 13);
            assert.ok(data.query2[1].y === 'bye');

            assert.ok(data.query3[0]);
            assert.ok(data.query3[0].x === 12);
            assert.ok(data.query3[1]);
            assert.ok(data.query3[1].x === 13);

            assert.ok(data.query4[0]);
            assert.ok(data.query4[0].w === 'bad');
            assert.ok(data.query4[0].z === 541);

            done();
        })
        .catch( err => done(err) );
    });

    it('must retrieve an empty JSON document when being run with no queries', done =>
    {
        const s2j = new S2J('test/test.sqlite');

        assert.ok(s2j);

        s2j.run()
        .then( json =>
        {
            assert.ok(json);

            const data = JSON.parse(json);

            assert.ok(data);
            assert.deepEqual(data, {});

            done();
        })
        .catch( err => done(err) );
    });
});
