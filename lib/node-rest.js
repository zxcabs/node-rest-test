var async = require('async'),
	assert = require('assert'),
	utils = require('util'),
	jsv = require('JSV').JSV;


function Test(app) {
	this.app = app;
	this._params = [];
	this.callback;
	this._env = jsv.createEnvironment();
	
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

Test.prototype.end = function (fn) {
	this.callback = fn;
};

Test.prototype._pushArg = function (method, args) {
	var arg = Array.prototype.slice.call(args);
	arg.unshift(method);
	this._params.push(arg);
};

Test.prototype._execute = function () {
	var prev = {},
		self = this;

	function iterator(item, next) {
		var method = item[0],
			url = ('function' === typeof item[1]) ? item[1](prev) : item[1],
			data = ('function' === typeof item[2]) ? item[2](prev) : item[2],
			schema = ('function' === typeof item[3]) ? item[3](prev) : item[3],
			req = {
				method: method,
				url: url,
				data: JSON.stringify(data),
				headers: { 
							'Content-Type': 'application/json',
							'Cookie' : ((prev.headers) ? prev.headers['set-cookie'] : '')
						}
			};

		assert.response(self.app, req, 
			{
				headers: { 'Content-Type': 'application/json; charset=utf-8' }
			},
			function (res) {
				prev = res;
				var	body,
					schm = {
						type: 'object',
						additionalProperties: false,
						properties: schema
					},
					report;
					
				try {
					body = JSON.parse(res.body);
				} catch (e) {};
				
				prev.body = body;
				report = self._env.validate(body, schm);
				
				if (report.errors.length === 0) {
					next();
				} else {
					next({res: res, req: req, report: report});
				}
			
			}
		);
	}
	
	if (!this.callback) {
		this.callback = function(err) {
			if (err) {
				console.log(utils.inspect(err.report.errors, true, 2));
				assert.ok(false);
			} else {
				assert.ok(true);
			}
		}
	}
	
	async.forEachSeries(this._params, iterator.bind(this), this.callback);
};

module.exports = Test;