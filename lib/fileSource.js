/*jslint node: true, vars: true, nomen: true */
'use strict';

var fs = require('fs');

var tools = require('./tools');

var MAX_BUFFER_SIZE = 1024 * 64;

function FileSource(filename) {
	this.filename = filename;

	this._vints = [];
	this._vintsSize = 0;
}

module.exports = FileSource;

FileSource.prototype._getFD = function(callback) {
	if (this._fd) {
		return callback(null, this._fd);
	}

	var self = this;

	fs.open(this.filename, 'r', function(error, fd) {
		if (error) {
			return callback(error);
		}

		self._fd = fd;

		callback(null, fd);
	});
};

FileSource.prototype.writeCompleteTag = function(stream, tag, callback) {

	var self = this;
	this._flush(stream, function(error) {
		if (error) {
			return callback(error);
		}

		self._getFD(function(error, sourceFD) {
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
			var len = end - start;

			// console.log("Copy Start=" + start + " to end=" + end + " (" + len + "
			// bytes) fd=" + sourceFD);

			var buffer = new Buffer(1024 * 64);

			function copy() {
				var l = Math.min(len, buffer.length);

				fs.read(sourceFD, buffer, 0, l, start, function(error, bytesRead, buf) {
					if (error) {
						return callback(error);
					}

					if (buf.length !== bytesRead) {
						buf = buf.slice(0, bytesRead);
					}

					// console.log("Write " + buf.length + " bytes");

					stream.write(buf, function(error) {
						if (error) {
							return callback(error);
						}

						len -= bytesRead;
						start += bytesRead;

						if (!len) {
							// console.log("Write finished");
							return callback();
						}

						setImmediate(copy);
					});
				});
			}
			copy();
		});
	});
};

FileSource.prototype.writeTagData = function(stream, data, callback) {
	var self = this;

	if (!data) {
		throw new Error("No data !");
	}

	this.writeVInt(stream, data.length);

	// console.log("WriteTagData[" + data.length + "]=", data);

	if (this._vintsSize < MAX_BUFFER_SIZE) {
		this._vints.push(data);
		this._vintsSize += data.length;
		setImmediate(callback);
		return;
	}

	this._flush(stream, function(error) {
		if (error) {
			return callback(error);
		}

		stream.write(data, callback);
	});
};

FileSource.prototype.writeVInt = function(stream, value) {
	if (typeof (value) !== "number") {
		throw new Error("Invalid value (" + value + ")")
	}

	var buffer = tools.writeVInt(value);
	this._vints.push(buffer);
	this._vintsSize += buffer.length;
	// console.log("Vint(" + value.toString(16) + ")=>", buffer);
};

FileSource.prototype.writeHInt = function(stream, value) {
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

FileSource.prototype._flush = function(stream, callback) {
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
	stream.write(buffer, callback);
};

FileSource.prototype.end = function(stream, callback) {
	var self = this;

	this._flush(stream, function(error) {
		if (error) {
			return callback(error);
		}

		if (!self._fd) {
			return callback(error);
		}

		fs.close(self._fd, function(error2) {
			self._fd = undefined;

			if (error2) {
				if (error) {
					console.error("Can not close source", error2);
				} else {
					error = error2;
				}
			}

			return callback(error);
		});
	});
};

FileSource.prototype.getTagDataStream = function(tag, callback) {

	//console.log("Get data stream of #" + tag.tagId);

	var end = tag.end;
	var modified = tag._modified;
	if (modified) {
		end = modified.end;
	}
	var start = end - tag.dataSize;

	//console.log("Open stream " + this.filename + " start=" + start + " end=" + end + " size=" + tag.dataSize);

	var stream = fs.createReadStream(this.filename, {
		start: start,
		end: end - 1
	});

	return callback(null, stream);
};