
'use strict';


var loader = require('./loader');


module.exports =
{
    magazineCatalog: function(req, res, next)
    {
        loader.loadMagazineCatalog(req.params.magazine_code, function(catalog)
        {
            if (catalog)
            {
                res.send(catalog);
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
