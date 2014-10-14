
'use strict';


var loader = require('./loader');


module.exports =
{
    magazineCatalog: function(req, res, next)
    {
        loader.loadMagazineCatalog(req.params.magazine_code, function(err, catalog)
        {
            if (err)
            {
                res.send(500, err);
            }
            else if (catalog)
            {
                res.send(200, catalog);
            }
            else
            {
                res.send(404);
            }
        });

        return next();
    },

    issueContents:   function(req, res, next)
    {
        var contents;

        contents = loader.loadIssueContents(req.params.magazine_code, req.params.issue_code);

        if (contents)
        {
            res.send(contents);
        }
        else
        {
            res.send(404);
        }

        return next();
    }
};
