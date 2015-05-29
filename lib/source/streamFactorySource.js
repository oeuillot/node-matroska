/*jslint node: true, vars: true, nomen: true */
'use strict';

var fs = require('fs');
var util = require('util');
var debug = require('debug')('matroska:streamFactorySource');

var AbstractSource = require('./abstractSource');

function StreamFactorySource(streamFactory) {
	AbstractSource.call(this);

	if (typeof (streamFactory.getStream) !== "function") {
		throw new Error("Invalid streamFactory object  (getStream function)");
	}

	if (streamFactory.end && typeof (streamFactory.end) !== "function") {
		throw new Error("Invalid streamFactory object (end function)");
	}

	this.streamFactory = streamFactory;
}

util.inherits(StreamFactorySource, AbstractSource);

module.exports = StreamFactorySource;

/**
 * @private
 * @param callback
 */
StreamFactorySource.prototype.getStream = function(options, callback) {
	if (arguments.length === 1) {
		callback = options;
		options = null;
	}

	this.streamFactory.getStream(options, callback);
};

/**
 * @private
 */
StreamFactorySource.prototype._end = function(callback) {
	if (!this.streamFactory.end) {
		return callback();
	}
	this.streamFactory.end(callback);
};

StreamFactorySource.prototype.toString = function() {
	return "[StreamFactorySource factory=" + streamFactory + "]";
};
