var async = require('async'),
	assert = require('assert'),
	utils = require('util'),
	validate = require('validate-schema').validate;


function Test(app) {
	this.app = app;
	this._params = [];
	this.callback;
	this._prev = {};
	
	process.nextTick(this._execute.bind(this));
}

Test.prototype.get = function () {
	this._pushArg('GET', arguments);
	return this;
};

Test.prototype.post = function () {
	this._pushArg('POST', arguments);
	return this;
};

Test.prototype.put = function () {
	this._pushArg('PUT', arguments);
	return this;
};

Test.prototype.del = function () {
	this._pushArg('DELETE', arguments);
	return this;
};

Test.prototype.end = function (beforeExit, asserts) {
	if (arguments.length === 2) {
		this.callback = function (err) {
			beforeExit(function () {
				if (err) {
					console.log('Schema: ' + utils.inspect(err.schema, false, 5));
					console.log('Responce Body: ' + utils.inspect(err.res.body, false, 5));
					console.log('Request: ' + utils.inspect(err.req, false, 5));
					asserts.ok(false);
				} else {
					asserts.ok(true);
				}
			});
		};
	} else {
		this.callback = beforeExit;
	}
};

Test.prototype._pushArg = function (method, args) {
	var arg = Array.prototype.slice.call(args);
	arg.unshift(method);
	this._params.push(arg);
};

Test.prototype._execute = function () {
	var self = this;

	function iterator(item, next) {
		var method = item[0],
			url = ('function' === typeof item[1]) ? item[1](self._prev) : item[1],
			data = ('function' === typeof item[2]) ? item[2](self._prev) : item[2],
			schema = ('function' === typeof item[3]) ? item[3](self._prev) : item[3],
			after = ('function' === typeof item[4]) ? item[4] : undefined,
			req = {
				method: method,
				url: url,
				
				headers: { 
							'Content-Type': 'application/json',
							'Cookie' : ((self._prev.headers) ? self._prev.headers['set-cookie'] : '')
						}
			};
			
		if ('GET' !== method) {
			req.data = JSON.stringify(data);
		}
		
		assert.response(self.app, req, 
			{
				headers: { 'Content-Type': 'application/json; charset=utf-8' }
			},
			function (res) {
				self._prev = res;
				var	body,
					isValid = false;
					
				try {
					body = JSON.parse(res.body);
				} catch (e) {};
				
				self._prev.body = body;
				isValid = validate(body, schema);
				
				if (after) {
					after(req, res);
				}
				
				if (isValid) {
					next();
				} else {
					next({res: res, req: req, schema: schema, isValid: isValid});
				}
			
			}
		);
	}
	
	if (!this.callback) {
		this.callback = function(err) {
			if (err) {
				console.log(utils.inspect(err.isValid, false, 5));
				assert.ok(false);
			} else {
				assert.ok(true);
			}
		}
	}
	
	async.forEachSeries(this._params, iterator.bind(this), this.callback);
};

module.exports = Test;