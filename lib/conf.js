'use strict';


var sjl  = require("sjl");

var defaults =
{
    "REWRITE_ENGINE":
    {
        "RULES":
        [
            {
                "FROM": "v+fs",
                "TO": "/mnt/tmpdfp/tomcat/contents/"
            },
            {
                "FROM": "magazines",
                "TO": "export"
            },
            {
                "FROM": "catalog",
                "TO": "/catalog_web_production.sqlite"
            },
            {
                "FROM": "contents",
                "TO":   "export/issue.sqlite"
            }
        ]
    },
    
    "QUERIES":
    {
        "issues": "SELECT * FROM issue;"
    }
};

var CONF = sjl("../etc/sqlite2json.conf", defaults, {"silent": true});


module.exports = CONF;
