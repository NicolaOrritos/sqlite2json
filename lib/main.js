
'use strict';


var restify    = require('restify');
var reqprocess = require('./reqprocess');


var server = restify.createServer(
{
    name: 'mag'
});


server.get('/magazines/:magazine_code/catalog',                     reqprocess.magazineCatalog);
server.get('/magazines/:magazine_code/issues/:issue_code/contents', reqprocess.issueContents);


server.listen(8080);
