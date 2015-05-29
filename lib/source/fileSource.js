/*jslint node: true, vars: true, nomen: true */
'use strict';

var fs = require('fs');
var util = require('util');
var debug = require('debug')('matroska:fileSource');

var AbstractSource = require('./abstractSource');

function FileSource(filename) {
	AbstractSource.call(this);

	this.filename = filename;
}

util.inherits(FileSource, AbstractSource);

module.exports = FileSource;

/**
 * @private
 * @param callback
 */
FileSource.prototype.getStream = function(options, callback) {
	if (arguments.length === 1) {
		callback = options;
		options = null;
	}

	var output = this;

	var fd = output._fd;
	if (fd) {
		var params = {
			flags: 'r',
			fd: fd,
			autoClose: false
		};
		if (typeof (options.start) === "number") {
			params.start = options.start;
		}
		if (typeof (options.end) === "number") {
			params.end = options.end;
		}

		debug("GetStream", params, " fd=", output._fd);

		var stream = fs.createReadStream(this.filename, params);

		stream.destroy = function() {
			// Disable destory, because it will close fd !
		};

		return callback(null, stream);
	}

	var self = this;
	fs.open(this.filename, 'r', function(error, fd) {
		if (error) {
			return callback(error);
		}

		output._fd = fd;

		self.getStream(options, callback);
	});
};

/**
 * @private
 */
FileSource.prototype._end = function(callback) {
	var output = this;

	debug("Close", output._fd);

	if (!output._fd) {
		return callback();
	}

	fs.close(output._fd, function(error) {
		delete output._fd;

		return callback(error);
	});
};

FileSource.prototype.toString = function() {
	return "[FileSource file=" + this.filename + "]";
};
