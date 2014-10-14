
'use strict';

var CONF    = require('./conf');
var S2J     = require('./s2j');
var fs      = require('fs');
var path    = require('path');
var crypto  = require('crypto');
var sjl     = require('sjl');
var rewrite = require('pathrewrite');


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
    var rewrittenPath;
    

    if (magazine)
    {
        // Load rewrite rules for finding the DB file:
        var rewriteRules = rewrite.Rules.loadMulti(CONF.REWRITE_ENGINE.RULES);

        rewrittenPath = '/v+fs/magazines/' + magazine + '/catalog';
        rewrittenPath = rewrite.go(rewrittenPath, rewriteRules);

        console.log('Overwritten path: %s', rewrittenPath);
        
        
        var s2j = new S2J(rewrittenPath);
        
        for (var queryName in CONF.QUERIES)
        {
            s2j.addQuery(queryName, CONF.QUERIES[queryName]);
        }
        
        s2j.run(function(err, json)
        {
            if (cb)
            {
                cb(err, json, rewrittenPath);
            }
        });
    }
    else
    {
        var err = new Error('Missing parameter "magazine"');
        
        if (cb)
        {
            cb(err);
        }
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
                cb(null, cached);
            }
            else
            {
                loadCatalogFromDisk(magazine, function(err, catalog, from)
                {
                    if (err)
                    {
                        cb(err);
                    }
                    else
                    {
                        if (catalog)
                        {
                            cacheCatalog(magazine, catalog, from);
                        }

                        if (cb)
                        {
                            cb(catalog);
                        }
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
