/*jslint node: true, vars: true, nomen: true */
'use strict';

var assert = require('assert');
var async = require('async');
var crc32 = require('crc').crc32;
var stream = require('stream');
var util = require('util');

var schema = require('./schema');
var tools = require('./tools');

var PADDING = "             ";

var MASTER_TYPE = "m";

var MillenniumTime = Date.UTC(2001, 0, 1);

/**
 * @constructs
 * @private
 */
function Tag(doc, tagId, ebmlID, start, length) {

	if (!doc || doc.type !== 'D') {
		throw new Error("Invalid document");
	}
	this.ownerDocument = doc;

	this.tagId = tagId;

	var schemaInfo = schema.byEbmlID[ebmlID];
	if (!schemaInfo) {
		throw new Error("Invalid schemaId '" + schemaId + "' (" + ebmlID + ")");

		schemaInfo = {
			"type": "unknown",
			"name": "unknown"
		};
	}

	this.ebmlID = ebmlID;
	this.schemaInfo = schemaInfo;
	this.type = schemaInfo.type;
	this.name = schemaInfo.name;
	if (!isNaN(start)) {
		this.start = start;
		this.length = length || 0;
		this.end = this.start + this.length;
	}
	if (type === 'm') {
		this.masterType = true;
	}
}

module.exports = Tag;

Tag.prototype._setDataSize = function(dataSize, lengthTagSize) {
	this.dataSize = dataSize;
	this.length += dataSize + lengthTagSize;
	this.end = this.start + this.length;
};

Tag.prototype._setData = function(data) {
	this.data = data;
};

Tag.prototype.getFirstChildByName = function(name) {
	return this.eachChildByName(name, function(child) {
		return child;
	});
};

Tag.prototype.listChildrenByName = function(name) {
	var ls = [];
	this.eachChildByName(name, function(child) {
		ls.push(child);
	});

	return ls;
};

Tag.prototype.eachChildByName = function(name, func) {
	var ebmlID = tools.convertEbmlID(name);

	if (!func) {
		func = function(child) {
			return child;
		};
	}

	if (!this.children) {
		return undefined;
	}

	var children = this.children.slice(0);
	for (; children.length;) {
		var child = children.shift();

		if (child.ebmlID === ebmlID) {
			var ret = func(child);
			if (ret !== undefined) {
				return ret;
			}
			continue;
		}

		if (child.children) {
			var sp = [ 0, 0 ].concat(child.children);

			children.splice.apply(children, sp);
		}
	}

	return undefined;
};

Tag.prototype.getDirectChildByName = function(name) {
	var ebmlID = tools.convertEbmlID(name);

	var children = this.children;
	if (!children || !children.length) {
		return;
	}

	for (var i = 0; i < children.length; i++) {
		var child = children[i];

		if (child.ebmlID === ebmlID) {
			return child;
		}
	}

	return null;
};

Tag.prototype.loadData = function(callback) {
	// XXX TODO
	return callback("Not filled yet");
};

Tag.prototype.getString = function() {
	var data = this.getBuffer();
	return data.toString('ascii');
};

Tag.prototype.getUTF8 = function() {
	var data = this.getBuffer();
	return data.toString('utf8');
};

Tag.prototype.getValue = function() {
	switch (this.type) {
	case 's':
		return this.getString();
	case '8':
		return this.getUTF8();
	case 'i':
		return this.getInt();
	case 'u':
		var u = this.getUInt();
		if (((u === 0) || (u === 1)) && this.schemaInfo && this.schemaInfo.range === "0-1") {
			u = (u > 0);
		}
		return u;
	case 'b':
		return this.data;
	case 'f':
		return this.getFloat();
	case 'd':
		return this.getDate();
	}

	throw new Error("Type not supported !");
};

Tag.prototype.getBuffer = function() {
	if (!this.data) {
		throw new Error("Data is not loaded !");
	}
	return this.data;
};

Tag.prototype.getInt = function() {

	var data = this.getBuffer();
	var f = data.readIntBE(0, Math.min(data.length, 6));
	if (data.length <= 6) {
		return f;
	}

	for (var i = 6; i < data.length; i++) {
		f = f * 256 + data[i];
	}
	return f;
};

Tag.prototype.getUInt = function() {

	var data = this.getBuffer();
	var f = data.readUIntBE(0, Math.min(data.length, 6));
	if (data.length <= 6) {
		return f;
	}

	for (var i = 6; i < data.length; i++) {
		f = f * 256 + data[i];
	}

	return f;
};

Tag.prototype.getCRCValue = function() {
	var data = this.getBuffer();

	if (!data || data.length != 4 || this.type !== 'b') {
		throw new Error("Invalid data");
	}

	var crc = tools.readCRC(data);

	return crc;
};

Tag.prototype.setCRCValue = function(crc) {
	var data = tools.writeCRC(crc);

	// console.log("SetCRC ", data);

	this.data = data;
	this.type = 'b';
	this._markModified();
};

Tag.prototype.getFloat = function() {
	var data = this.getBuffer();

	switch (data.length) {
	case 4:
		return data.readFloatBE(0);
	case 8:
		return data.readDoubleBE(0);
	}
	throw new Error("Illegal float size " + data.length + ".");
};

Tag.prototype.getDateNanos = function() {

	var f = this.getUInt();

	return f;
};

Tag.prototype.getDate = function() {

	var data = this.getBuffer();
	var f = data.readUIntBE(0, 6);

	var d = new Date(MillenniumTime + (f * 256 * 256 / 1000 / 1000));

	return d;
};

Tag.prototype.print = function(level) {
	level = level || 0;
	var s = PADDING + (this.start || 0);
	s = s.substring(s.length - 10);

	var si = this.tagId + PADDING;
	s += "#" + si.substring(0, 5) + " ";

	if (level) {
		for (var i = 0; i < level; i++) {
			s += "  ";
		}
	}

	if (this.type === "D") {
		s += "* Document\n"; // start="

	} else {
		s += "* " + this.name;

		if (this.isContainer) {
			if (this.start === undefined) {
				s += "  children[]";
			} else {
				s += "  children[" + (this.end - this.start) + "]";
			}
		} else if (this.type === 'u') {
			s += "  u[" + this.data.length + "]=" + this.getUInt();
		} else if (this.type === 'i') {
			s += "  i[" + this.data.length + "]=" + this.getInt();
		} else if (this.type === 's') {
			s += "  s[" + this.data.length + "]='" + this.getString() + "'";
		} else if (this.type === '8') {
			s += "  8[" + this.data.length + "]='" + this.getUTF8() + "'";
		} else if (this.type === 'f') {
			s += "  f[" + this.data.length + "]=" + this.getFloat();
		} else if (this.type === 'd') {
			s += "  d[" + this.data.length + "]=" + this.getDate();

		} else if (this.type === 'b') {
			if (this.dataSize) {
				s += "  b[" + this.dataSize + "]";

				if (this.data) {
					s += "=" + this.data.slice(0, Math.min(32, this.data.length)).toString('hex');

					if (this.ebmlID === schema.byName.SeekID) {
						var targetEbmlID = this.getUInt();

						var tid = schema.byEbmlID[targetEbmlID];
						if (tid) {
							s += " => " + tid.name;
						} else {
							s += " => ? ";
						}
					}
				}
			} else {
				s += "  b[]";
			}
		}

		if (this._positionTarget) {
			s += "  [=>#" + this._positionTarget.tagId + "]";
		}

		if (this._modified) {
			s += "  [MODIFIED]";
		}

		s += "\n";
	}
	// +
	// this.start
	// +
	// "\n";

	if (this.children) {
		this.children.forEach(function(child) {
			s += child.print(level + 1);
		});
	}

	return s;
};

Tag.prototype.setString = function(newValue) {
	this.data = new Buffer(newValue, "ascii");
	this.type = 's';
	this._markModified();
};

Tag.prototype.setUTF8 = function(newValue) {
	this.data = new Buffer(newValue, "utf8");
	this.type = '8';
	this._markModified();
};

Tag.prototype.setInt = function(newValue) {

	var b = tools.writeInt(newValue);

	this.data = b;
	this.type = 'i';
	this._markModified();
};

Tag.prototype.setUInt = function(newValue) {

	var b = tools.writeUInt(newValue);

	this.data = b;
	this.type = 'u';
	this._markModified();
};

Tag.prototype.setFloat = function(newValue) {
	var b = new Buffer(4);
	b.writeFloatBE(newValue, 0);

	var n2 = b.readFloatBE(0);
	if (n2 !== newValue) {
		b = new Buffer(8);
		b.writeDoubleBE(newValue, 0);
	}

	this.type = 'f';
	this.data = b;
	this._markModified();
};

Tag.prototype.setDateNanos = function(newValue) {
	return this.setDate(newValue);
};

Tag.prototype.setDate = function(newValue) {
	var b = new Buffer(8);

	if (newValue.getTime) {
		var ms = newValue.getTime();

		newValue = (ms - MillenniumTime) * (1000 / 256) * (1000 / 256);

	} else if (!isNaN(newValue)) {
		newValue /= 256 * 256;
	}

	if (typeof (newValue) !== "number") {
		throw new Error("Invalid date value '" + newValue + "'");
	}

	b.writeUIntBE(newValue, 0, 6);

	this.type = 'd';
	this.data = b;
	this._markModified();
};

Tag.prototype.setData = function(newValue) {
	this.data = new Buffer(newValue);
	this.type = 'b';
	this._markModified();
};

Tag.prototype._markModified = function() {
	if (this._modified) {
		return;
	}

	this._modified = {
		start: this.start,
		end: this.end
	};
	this.start = undefined;
	this.end = undefined;
	this.length = undefined;

	var parent = this.parent;
	if (parent) {
		parent._markModified();
	}

	return;
};

Tag.prototype.setValue = function(newValue) {
	if (typeof (newValue) === "string") {
		if (this.type === 's') {
			this.setString(newValue);
			return;
		}
		this.setUTF8(newValue);
		return;
	}

	if (typeof (newValue) === "boolean") {
		newValue = (newValue) ? 1 : 0;
	}

	if (typeof (newValue) === "number") {
		if (Math.floor(newValue) !== newValue) {
			this.setFloat(newValue);
			return;
		}
		if (newValue >= 0) {
			this.setUInt(newValue);
			return;
		}

		this.setInt(newValue);
		return;
	}

	if (newValue && newValue.getTime) {
		this.setDate(newValue);
		return;
	}

	if (Buffer.isBuffer(newValue) || util.isArray(newValue)) {
		this.setData(newValue);
		return;
	}

	throw new Error("Unsupported type of value (" + newValue + ")");
};

Tag.prototype.setTargetPosition = function(target) {
	this._positionTarget = target;
};

Tag.prototype._getSize = function() {
	if (!this._modified && this.start !== undefined) {
		assert(typeof (this.end) === "number", "End of #" + this.tagId + " is not a number");
		assert(typeof (this.start) === "number", "Start of #" + this.tagId + " is not a number");

		var sz = this.end - this.start;
		// console.log("SizeofNM #" + this.tagId + " => " + sz);
		return sz;
	}

	if (!this.masterType) {
		var dataLength = (this.data) ? this.data.length : this.dataSize;
		assert(typeof (dataLength) === "number", "Data size of #" + this.tagId + " is not a number");

		var sz2 = tools.sizeHInt(this.ebmlID) + tools.sizeVInt(dataLength) + dataLength;

		// console.log("Sizeof #" + this.tagId + " => " + sz);

		return sz2;
	}

	var totalSize = 0;
	if (this.children) {
		this.children.forEach(function(child) {
			var s = child._getSize();
			assert(typeof (s) === "number", "Size of #" + child.tagId + " is not a number");
			totalSize += s;
		});
	}

	return tools.sizeHInt(this.ebmlID) + tools.sizeVInt(totalSize) + totalSize;
};

Tag.prototype._optimizeData = function() {
	if (!this.data) {
		return 0;
	}
	if (this.type === 'u') {
		var u = this.getUInt();
		if (tools.sizeUInt(u) !== this.data.length) {
			this.setUInt(u);

			// console.log("Optimize UINT #" + this.tagId);

			return 1;
		}

		return 0;
	}

	if (this.type === 'i') {
		var i = this.getInt();
		if (tools.sizeInt(i) !== this.data.length) {
			this.setInt(i);

			// console.log("Optimize INT #" + this.tagId);

			return 1;
		}
		return 0;
	}

	if (this.type === 'f') {
		var f = this.getFloat();
		if (tools.sizeFloat(f) !== this.data.length) {
			this.setFloat(f);

			// console.log("Optimize Float #" + this.tagId);

			return 1;
		}
		return 0;
	}

	return 0;
};

Tag.prototype._write = function(output, source, callback) {

	if (!this._modified && !this._dataSource) {
		source.writeCompleteTag(output, this, callback);
		return;
	}

	var ebmlID = this.schemaInfo._ebmlID;
	if (!ebmlID) {
		ebmlID = tools.writeUInt(this.ebmlID);

		this.schemaInfo._ebmlID = ebmlID;
	}

	source.writeHInt(output, this.ebmlID);

	if (!this.masterType) {
		// console.log("Write tag #" + this.tagId + " ", this.data, "/",
		// this._dataSource);

		if (!this.data && this._dataSource) {
			source.writeTagDataSource(output, this.dataSize, this._dataSource, callback);
			return;
		}
		source.writeTagData(output, this.data, callback);
		return;
	}

	var children = this.children;

	if (!children) {
		source.writeVInt(output, 0);
		return callback();
	}

	var totalSize = 0;
	children.forEach(function(child) {
		totalSize += child._getSize();
	});

	source.writeVInt(output, totalSize);

	async.eachSeries(children, function(child, callback) {
		child._write(output, source, callback);
	}, callback);
};

Tag.prototype.getTagByPosition = function(position, contentOffset) {
	// console.log("Search " + this.name + " " + position + " " + this.dataSize);

	if (contentOffset) {
		position += tools.sizeHInt(this.ebmlID);

		if (!this.masterType) {
			position += tools.sizeVInt((this.data) ? this.data.length : this.dataSize);

		} else if (this.children) {
			var t = 0;
			this.children.forEach(function(child) {
				t += child._getSize();
			});

			position += tools.sizeVInt(t);
		}
	}

	var s = 0;

	if (position === 0) {
		return {
			target: this,
			position: 'start'
		};
	}

	if (!this._modified) {
		if (position > this.length) {
			return null;
		}
	}

	s += tools.sizeHInt(this.ebmlID);
	if (position < s) {
		return {
			target: this,
			position: 'value'
		};
	}

	if (!this.masterType) {
		if (!this.data) {
			s += tools.sizeVInt(this.dataSize);
			if (position < s) {
				return {
					target: this,
					position: 'data.size'
				};
			}

			s += this.dataSize;
			if (position < s) {
				return {
					target: this,
					position: 'data'
				};
			}
			return null;
		}

		s += tools.sizeVInt(this.data.length);
		if (position < s) {
			return {
				target: this,
				position: 'data.size'
			};
		}

		s += this.data.length;
		if (position < s) {
			return {
				target: this,
				position: 'data'
			};
		}

		return null;
	}

	var children = this.children;
	if (!children) {
		return null;
	}

	var childSize = 0;
	children.forEach(function(child) {
		childSize += child._getSize();
	});

	s += tools.sizeVInt(childSize);

	if (position < s) {
		return {
			target: this,
			position: 'data.size'
		};
	}

	for (var i = 0; i < children.length; i++) {
		var child = children[i];

		var ret = child.getTagByPosition(position - s);
		if (ret) {
			return ret;
		}

		s += child._getSize();
	}

	return null;
};

Tag.prototype.remove = function() {
	if (!this.parent) {
		throw new Error("No parent !");
	}

	return this.parent.removeChild(this);
};

Tag.prototype.removeChild = function(child) {
	if (!this.children) {
		return false;
	}

	var idx = this.children.indexOf(child);
	if (idx < 0) {
		return false;
	}

	this.children.splice(idx, 1);
	child.parent._markModified();
	child.parent = null;

	var doc = this.ownerDocument;
	child.deepWalk(function(c) {
		var schemaInfo = c.schemaInfo;
		if (!schemaInfo) {
			return;
		}

		if (schemaInfo.segmentPosition) {
			doc._unregisterPosition(c);
		}
		if (schemaInfo.crc) {
			doc._unregisterCRC(c);
		}
	});

	return true;
};

/**
 * 
 * @param child
 * @param noUpdate
 * @returns
 */
Tag.prototype.appendChild = function(child, noUpdate) {
	return this.insertBefore(child, null, noUpdate);
};

/**
 * 
 * @param {Tag}
 *          child
 * @param {Tag}
 *          [beforeChild]
 * 
 */
Tag.prototype.insertBefore = function(child, beforeChild, noUpdate) {
	if (child.parent) {
		child.remove();
	}

	if (!this.children) {
		this.children = [];
	}

	var doc = this.ownerDocument;
	child.deepWalk(function(c) {
		var schemaInfo = c.schemaInfo;
		if (!schemaInfo) {
			return;
		}

		if (schemaInfo.segmentPosition) {
			doc._registerPosition(c);
		}
		if (schemaInfo.crc) {
			doc._registerCRC(c);
		}
	});

	if (beforeChild) {
		var idx = this.children.indexOf(beforeChild);
		if (idx >= 0) {
			this.children.splice(idx, 0, child);
			child.parent = this;
			if (noUpdate !== false) {
				this._markModified();
			}
			return;
		}
	}

	this.children.push(child);
	child.parent = this;

	if (noUpdate !== false) {
		this._markModified();
	}
};

Tag.prototype.getLevel1 = function() {
	for (var p = this; p; p = p.parent) {
		if (p.parent.type === 'D') {
			return p;
		}
	}

	return undefined;
};

Tag.prototype.getPosition = function() {

	var parent = this.parent;
	if (!parent) {
		return 0;
	}

	var pos = parent.getContentPosition();

	var children = parent.children;
	if (children) {
		for (var i = 0; i < children.length; i++) {
			var child = children[i];

			if (child === this) {
				break;
			}

			pos += child._getSize();
		}
	}

	return pos;
};

Tag.prototype.getContentPosition = function() {
	var pos = this.getPosition() + tools.sizeHInt(this.ebmlID);

	if (!this.masterType) {
		var dataLength = (this.data) ? this.data.length : this.dataSize;

		return pos + tools.sizeVInt(dataLength);
	}

	var totalSize = 0;
	if (this.children) {
		this.children.forEach(function(child) {
			totalSize += child._getSize();
		});
	}

	return pos + tools.sizeVInt(totalSize);
};

Tag.prototype.eachChild = function(callback) {
	var children = this.children;
	if (!children || !children.length) {
		return;
	}

	children.forEach(callback);
};

Tag.prototype.getDataStream = function(callback) {
	if (this.data) {
		var bufferStream = new stream.PassThrough();
		bufferStream.end(this.data);

		callback(null, bufferStream);
		return;
	}

	if (this._dataSource) {
		this._dataSource.getStream(callback);
		return;
	}

	this.ownerDocument.source.getTagDataStream(this, callback);
};

function addCRC(crc, value) {
	var old = crc.value;

	if (old === undefined) {
		crc.value = crc32(value);

	} else {
		crc.value = crc32(value, crc.value);
	}

	// console.log("Add value=", value, " => 0x" + crc.value.toString(16));
}

function computeCRCStream(stream, crc, callback) {

	// console.log("CrcStream reading ...");

	stream.on('readable', function() {
		var buffer = stream.read();

		if (!buffer) {
			// console.log("CrcStream END");
			return callback(null);
		}

		// console.log("CrcStream read=", buffer.length);

		addCRC(crc, buffer);
	});
}

Tag.prototype.computeCRC = function(crc, callback) {
	crc = crc || {};

	addCRC(crc, tools.writeUInt(this.ebmlID));

	if (this.masterType) {
		var c2 = this.children;
		var csize = 0;
		if (c2) {
			c2.forEach(function(c3) {
				csize += c3._getSize();
			});
		}

		// console.log("Add size " + csize);

		addCRC(crc, tools.writeVInt(csize));

		if (c2) {
			setImmediate(this._computeChildrenCRC.bind(this, false, crc, callback));
			return;
		}
		return callback(null, crc.value);
	}

	if (this.data) {
		addCRC(crc, tools.writeVInt(this.data.length));
		addCRC(crc, this.data);

		return callback(null, crc.value);
	}

	addCRC(crc, tools.writeVInt(this.dataSize));
	this.getDataStream(function(error, stream) {
		if (error) {
			return callback(error);
		}

		// console.log("Compute CRC of dataStream ", stream.path);

		computeCRCStream(stream, crc, function(error) {
			if (error) {
				return callback(error);
			}

			// console.log("CRC computed of dataStream ", crc.value);

			callback(null, crc.value);
		});
	});
};

Tag.prototype.moveChildBefore = function(child, beforeChild) {
	var children = this.children;
	if (!children) {
		throw new Error("This tag has no children " + this);
	}

	var idx = children.indexOf(child);
	if (idx < 0) {
		throw new Error("Can not find the child '" + child + "' parent=" + this);
	}

	var bidx = children.indexOf(beforeChild);
	if (bidx < 0) {
		throw new Error("Can not find the before child '" + beforeChild + "' parent=" + this);
	}

	// console.log("Before=" + children)
	children.splice(idx, 1);
	// console.log("After1=" + children)
	children.splice(bidx - ((idx < bidx) ? 1 : 0), 0, child);
	// console.log("After2=" + children)

	this._markModified();
	return true;
};

Tag.prototype._computeChildrenCRC = function(ignoreCRCTag, crc, callback) {

	crc = crc || {};

	var children = this.children;
	if (!children || !children.length) {
		return callback(null, crc.value);
	}

	async.eachSeries(children, function(child, callback) {
		if (ignoreCRCTag && child.ebmlID === schema.byName.CRC_32) {
			return callback(null);
		}

		child.computeCRC(crc, callback);

	}, function(error) {
		if (error) {
			return callback(error);
		}

		return callback(null, crc.value);
	});
};

Tag.prototype.deepWalk = function(func) {

	var ret = func(this);
	if (ret !== undefined) {
		return ret;
	}

	var children = this.children;
	if (!children) {
		return undefined;
	}

	children = children.slice(0);
	for (; children.length;) {
		var child = children.shift();

		var ret = func(child);
		if (ret !== undefined) {
			return ret;
		}

		if (child.children) {
			var sp = [ 0, 0 ].concat(child.children);

			children.splice.apply(children, sp);
		}
	}

	return undefined;
};

Tag.prototype.toString = function() {
	return "[Tag #" + this.tagId + "]";
};

Tag.prototype.setTagFormatDate = function(date) {
	this.setUTF8(tools.formatDate(value));
};
