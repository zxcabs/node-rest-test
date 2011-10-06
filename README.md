Test REST api server using expresso and json-schema

Install:
--------

    npm install https://github.com/zxcabs/node-rest-test/tarball/master

Usage:
------
    test.get(url|func, data|func, schema|func [, callback]);

* first argumet: url or function (prevServerResponse) { return url; }
* second argument: data or function function (prevServerResponse) { return data; }
* third argument: validate schema or function (prevServerResponse) { return schema; }
* fourth argument: called when request completed. function (req, res) { ... };

Also you can use:

    .post();
    .put();
    .del();

and

    .end(fn);

Example 1:
---------

    var assert = require('assert'),
        app = require('service/server/index.js'),
        Rest = require('node-rest-test');

    module.exports = {
        'session': function () {
            var tests = new Rest(app);

            tests.post('/sessions', { login: 'fedor@nikulin.ru', password: '1234' }, 
                { 
                    success: { type: 'boolean', enum: [true]},
                    result: { 
                        type: 'object',
                        properties: {
                            sid: {
                                type: 'string',
                                pattern: '[\\w\\d\.\\/\\+=]{68}'
                            }
                         }
                     }
                 }
             )
             .del(function(res) {
                 return '/sessions/' + res.body.result.sid;
             }, {}, {
                        success: {
                            type: 'boolean',
                            enum: [true]
                        },
                        result: {
                            type: 'string',
                            pattern: 'session destroyed'
                       }
                    }
            );
        }
    };


Example 2:
---------

    var app = require('service/server/index.js'),
        Rest = require('node-rest-test');

    module.exports = {
        'session': function (beforeExit, assert) {
            var tests = new Rest(app);

            tests.post('/sessions', { login: 'fedor@nikulin.ru', password: '1234' }, 
                { 
                    success: { type: 'boolean', enum: [true]},
                    result: { 
                        type: 'object',
                        properties: {
                            sid: {
                                type: 'string',
                                pattern: '[\\w\\d\\.\\/\\+=]{68}'
                            }
                         }
                     }
                 }
             )
             .del(function(res) {
                 return '/sessions/' + res.body.result.sid;
             }, {}, {
                        success: {
                            type: 'boolean',
                            enum: [true]
                        },
                        result: {
                            type: 'string',
                            pattern: 'session destroyed'
                       }
                    }
            )
            .end(beforeExit, assert);
        }
    };


Example 3:
---------

    var app = require('service/server/index.js'),
        Rest = require('node-rest-test');

    module.exports = {
        'session': function (beforeExit, assert) {
            var tests = new Rest(app);

            tests.get('/foo', { ... }, { ... }, function (req, res) { ... })
                 .end(beforeExit, assert);
        }
     };
    

Run test:

    expresso <test file>
