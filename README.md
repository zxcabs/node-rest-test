Test REST api server using expresso and json-schema

Install:
--------

    npm install https://github.com/zxcabs/node-rest-test/tarball/master

Usage:
------
    test.get(url|func, data|func, schema|func);

* first argumet: url or function (prevServerResponse) { return url; }
* second argument: data or function function (prevServerResponse) { return data; }
* third argument: validate schema or function (prevServerResponse) { return schema; }

Also you can use:

    .post();
    .put();
    .del();

and

    .end(fn);

Example:
-------

    var assert = require('assert'),
        app = require('service/server/index.js'),
        Rest = require('node-rest-test');

    module.exports = {
        'session': function () {
            var tests = new Rest(app);

            tests.post('/sessions', { login: 'fedor@nikulin.ru', password: '1234' }, 
                { 
                    success: { type: Boolean, enum: [true]},
                    result: { 
                        type: Object,
                        properties: {
                            sid: {
                                type: String,
                                pattern: /[\w\d\.\/\+=]{68}/
                            }
                         }
                     }
                 }
             )
             .del(function(res) {
                 return '/sessions/' + res.body.result.sid;
             }, {}, {
                        success: {
                            type: Boolean,
                            enum: [true]
                        },
                        result: {
                            type: String,
                            pattern: /session destroyed/
                       }
                    }
            );
        }
	};


Run test:

    expresso <test file>
