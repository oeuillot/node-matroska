/*jslint node: true, vars: true, nomen: true */
'use strict';

var fs = require('fs');

var tools = require('./tools');

var MAX_BUFFER_SIZE = 1024 * 64;

function AbstractSource() {

	this._vints = [];
	this._vintsSize = 0;
}

module.exports = AbstractSource;

AbstractSource.prototype.writeCompleteTag = function(output, tag, callback) {

	var self = this;
	this._flush(output, function(error) {
		if (error) {
			return callback(error);
		}

		var start = tag.start;
		var end = tag.end;
		var modified = tag._modified;
		if (modified) {
			start = modified.start;
			end = modified.end;
		}

		self._getStream(output, start, end, function(error, stream) {
			if (error) {
				return callback(error);
			}

			stream.on('readable', function() {
				var buf = stream.read();

				if (!buf) {
					return callback();
				}

				output.stream.write(buf);
			});

			stream.on('error', function(error) {
				return callback(error);
			});
		});
	});
};

AbstractSource.prototype.writeTagData = function(output, data, callback) {
	var self = this;

	if (!data) {
		throw new Error("No data !");
	}

	this.writeVInt(output, data.length);

	// console.log("WriteTagData[" + data.length + "]=", data);

	if (this._vintsSize < MAX_BUFFER_SIZE) {
		this._vints.push(data);
		this._vintsSize += data.length;
		setImmediate(callback);
		return;
	}

	this._flush(output, function(error) {
		if (error) {
			return callback(error);
		}

		output.stream.write(data, callback);
	});
};

AbstractSource.prototype.writeVInt = function(output, value) {
	if (typeof (value) !== "number") {
		throw new Error("Invalid value (" + value + ")")
	}

	var buffer = tools.writeVInt(value);
	this._vints.push(buffer);
	this._vintsSize += buffer.length;
	// console.log("Vint(" + value.toString(16) + ")=>", buffer);
};

AbstractSource.prototype.writeHInt = function(output, value) {
	if (typeof (value) !== "number") {
		throw new Error("Invalid value (" + value + ")")
	}

	var buffer = value;
	if (!Buffer.isBuffer(buffer)) {
		buffer = tools.writeUInt(value);
	}

	this._vints.push(buffer);
	this._vintsSize += buffer.length;
	// console.log("Hint(" + value.toString(16) + ")=>", buffer);
};

AbstractSource.prototype._flush = function(output, callback) {
	var vints = this._vints;
	if (!this._vintsSize) {
		return callback();
	}

	// console.log("Write vints=", vints);

	var buffer;
	if (vints.length === 1) {
		buffer = vints[0];

	} else {
		buffer = Buffer.concat(vints);
	}

	this._vints = [];
	this._vintsSize = 0;
	output.stream.write(buffer, callback);
};

AbstractSource.prototype.end = function(output, callback) {
	var self = this;

	this._flush(output, function(error) {
		if (error) {
			return callback(error);
		}

		self._end(callback);
	});
};

AbstractSource.prototype.getTagDataStream = function(tag, callback) {

	// console.log("Get data stream of #" + tag.tagId);

	var end = tag.end;
	var modified = tag._modified;
	if (modified) {
		end = modified.end;
	}
	var start = end - tag.dataSize;

	// console.log("Open stream " + this.filename + " start=" + start + " end=" +
	// end + " size=" + tag.dataSize);

	this._getStream(null, start, end, function(error, stream) {
		if (error) {
			return callback(error);
		}

		return callback(null, stream);
	});
};