/*jslint node: true, vars: true, nomen: true */
'use strict';

var async = require('async');
var fs = require('fs');
var util = require('util');
var crc32 = require('crc').crc32;

var tools = require('./tools');
var Tag = require('./tag');

function Document(tagId) {
	this.type = "D";
	this.tagId = tagId;
}

util.inherits(Document, Tag);

module.exports = Document;

Document.prototype._registerPosition = function(tag) {
	if (!this._positions) {
		this._positions = [];
	}

	this._positions.push(tag);
};

Document.prototype._registerCRC = function(tag) {
	if (!this._crcs) {
		this._crcs = [];
	}

	// console.log("Register tag #" + tag.tagId);

	this._crcs.push(tag);
};

Document.prototype._markModified = function() {
	if (!this._positions || this._positionsMarkedModified) {
		return;
	}

	this._positionsMarkedModified = true;

	this._positions.forEach(function(child) {
		child._markModified();
	});
};

Document.prototype._buildLinks = function() {
	if (!this._positions || this._positionsMarkedModified) {
		return;
	}

	this._positions.forEach(function(child) {
		var offset = child.getValue();
		var parent1 = child.getLevel1();

		var target = parent1.getTagByPosition(offset, true);

		if (!target || target.position !== "start") {
			console.log("Can not find target for offset=" + offset);
			return;
		}
		// console.log("Find target of offset=" + offset + " source=" + child.name +
		// " to target=" + target.target.name + " type=" + target.position);

		child._positionTarget = target.target;
	});

};

/**
 * Write MKV file
 * 
 * @param stream
 *          Stream or path of the destination file
 * @param callback
 *          Called when done
 */
Document.prototype.write = function(stream, options, callback) {

	if (typeof (options) === "function") {
		callback = options;
		options = null;
	}

	options = options || {};

	if (this._modified) {
		this._computePositions();
	}

	var source = this.source;

	var closeStream = false;
	if (typeof (stream) === "string") {
		stream = fs.createWriteStream(stream);
		closeStream = true;
	}

	stream.optimize = true;

	var self = this;

	this._updateCRC32(function(error) {
		if (error) {
			return callback(error);
		}

		self._write(stream, source, function(error) {
			if (error) {
				return callback(error);
			}

			source.end(stream, function(error) {
				if (error) {
					return callback(error);
				}

				if (!closeStream) {
					return callback();
				}

				// console.error("Close stream");

				stream.end(callback);
			});
		});
	});
};

Document.prototype._write = function(stream, source, callback) {

	if (this._positionsMarkedModified && this._positions && this._positions.length) {
		if (!this._computePositions()) {
			return callback(new Error("Fail to compute positions, please check the file"));
		}
	}

	async.eachSeries(this.children, function(child, callback) {
		child._write(stream, source, callback);

	}, callback);
};

Document.prototype._computePositions = function(estimatedFileSize) {
	if (!this._positions || !this._positions.length) {
		return;
	}

	if (!estimatedFileSize) {
		estimatedFileSize = 0;

		this.children.forEach(function(child) {
			estimatedFileSize += child._getSize();
		});
	}

	var bits = tools.sizeUInt(estimatedFileSize) * 8;
	var max = Math.pow(2, bits) - 1;

	// console.log("Estimated size=" + estimatedFileSize + " max=" + max + "
	// bits=" + bits);

	var error = false;
	this._positions.forEach(function(child) {
		child.setUInt(max);

		var target = child._positionTarget;
		if (!target) {
			console.error("No target for tag '" + child.name + "' #" + child.tagId);
			error = true;
			return;
		}

		if (false) {
			console.error("Target has been removed target=" + target.name + "#" + target.tagId);
			error = true;
			return;
		}

		var level1s = child.getLevel1();
		var level1t = target.getLevel1();

		if (level1s !== level1t) {
			console.error("Target and source have not the same Level1 target=" + target.name + "#" + target.tagId);
			error = true;
			return;
		}

	});
	if (error) {
		return false;
	}

	var tx = 1;
	var times = 5;
	var changes = 1;
	for (; changes && times; times--, tx++) {
		changes = 0;

		this._positions.forEach(function(child) {
			var target = child._positionTarget;
			var level1 = target.getLevel1();

			var newPosition = target.getPosition() - level1.getContentPosition();
			var oldPosition = child.getUInt();

			if (newPosition === oldPosition) {
				return;
			}

			// console.log("Change position old=" + child.getUInt() + " new=" +
			// newPosition);

			child.setUInt(newPosition);
			changes++;
		});

		console.log("#" + tx + " changes=" + changes);
	}

	return true;
};

Document.prototype._updateCRC32 = function(callback) {
	var crcs = this._crcs;

	if (!crcs || !crcs.length) {
		console.log("No crc to compute ", crcs);
		return callback();
	}

	console.log(crcs.length + " crc to compute ...");

	function depth(t) {
		var ret = 0;
		for (; t; t = t.parent) {
			ret++;
		}

		return ret;
	}

	crcs.sort(function(t1, t2) {
		return depth(t2) - depth(t1);
	});

	async.eachSeries(crcs, function(crcTag, callback) {
		var parent = crcTag.parent;

		// console.log("Compute crc #" + crcTag.tagId + " parent #" + parent.tagId);

		if (false && !parent._modified) {
			// console.log("Compute crc #" + parent.tagId + " => not modified");
			return callback();
		}

		parent._computeChildrenCRC(true, null, function(error, crc) {
			if (error) {
				return callback(error);
			}

			var ieee = new Buffer(4);
			for (var i = 0; i < 4; i++) {
				ieee[i] = crc;
				crc >>= 8;
			}
			var oldCRC = crcTag.getValue();
			if (!ieee.compare(oldCRC)) {
				return callback();
			}
			console.log("Change CRC #" + crcTag.tagId + " new=", ieee, " old=", oldCRC);

			crcTag.setData(ieee);
			callback();
		});

	}, callback);
};

Document.prototype.optimizeData = function() {

	if (!this.children) {
		return;
	}

	var cnt = 0;

	var children = this.children.slice(0);
	for (; children.length;) {
		var child = children.shift();

		cnt += child._optimizeData();

		if (child.children) {
			var sp = [ 0, 0 ].concat(child.children);

			children.splice.apply(children, sp);
		}
	}

	console.log("Optimize " + cnt + " values");
};

Document.prototype.getTagById = function(tagId) {
	if (isNaN(tagId)) {
		throw new Error("Tag identifier is not supported (" + tagId + ")");
	}

	if (this.tagId === tagId) {
		return this;
	}

	if (!this.children) {
		return null;
	}

	var children = this.children.slice(0);
	for (; children.length;) {
		var child = children.shift();

		if (child.tagId === tagId) {
			return child;
		}

		if (child.children) {
			var sp = [ 0, 0 ].concat(child.children);

			children.splice.apply(children, sp);
		}
	}

	return null;
};
