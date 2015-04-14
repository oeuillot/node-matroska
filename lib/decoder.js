/*jslint node: true, vars: true, nomen: true */
'use strict';

var debug = require('debug')('ebml:decoder');
var fs = require('fs');
var SlowBuffer = require('buffer').SlowBuffer;
var util = require('util');
var Writable = require('stream').Writable;

var Document2 = require('./document2');
var FileSource = require('./fileSource');
var Tag = require('./tag');
var tools = require('./tools');

var STATE_TAG = 1;
var STATE_SIZE = 2;
var STATE_CONTENT = 3;
var SKIP_DATA = 4;

var LOG = true;

function EbmlDecoder(options) {

	Writable.call(this, options);

	options = options || {};

	this.skipTags = options.skipTags;
	if (this.skipTags === undefined) {
		this.skipTags = {
			SimpleBlock: true,
			Void: true,
			Block: true,
			FileData: true
		};
	}

	this.ignoreData = options.ignoreData;
	this._buffer = null;
	this._tag_stack = [];
	this._state = STATE_TAG;
	this._cursor = 0;
	this._total = 0;
	this._tagVint = {};
	this._workingBuffer = new Buffer(64);
	this._tagId = 1;
	this.document = new Document2(this._tagId++);

	this._skipTagData = (this.ignoreData === true); // Stream mode (default mode)
	// this.ignoreData = false;

	var self = this;
	this.on('finish', function() {

		self.document._buildLinks();

		self.emit("$document", self.document);
	});
}

module.exports = EbmlDecoder;

util.inherits(EbmlDecoder, Writable);

EbmlDecoder.prototype.parseFile = function(filename, callback) {
	if (this.document.children) {
		return callback("Document has already children");
	}

	this.document.source = new FileSource(filename);

	this._skipTagData = (this.ignoreData === true);
	this._reuseBuffer = true;

	var offset = 0;
	var blockSize = (this.skipTags) ? (1024 * 4) : (1024 * 64);

	var self = this;

	var buffer = new Buffer(blockSize);

	var fd;
	function read() {

		if (!self._reuseBuffer) {
			buffer = new Buffer(blockSize);
		}

		fs.read(fd, buffer, 0, buffer.length, offset, function(error, bytesRead, buffer) {
			if (error) {
				fs.close(fd);

				return callback(error);
			}
			if (!bytesRead) {
				fs.close(fd);

				self.document._buildLinks();
				return callback(null, self.document);
			}

			if (bytesRead < buffer.length) {
				buffer = buffer.slice(0, bytesRead);
			}

			offset += bytesRead;
			self._write(buffer, null, function() {
				if (self._skipBytes) {
					offset += self._skipBytes;
					self._total += self._skipBytes;
					self._skipBytes = 0;
				}

				setImmediate(read);
			});
		});
	}

	fs.open(filename, 'r', function(error, fd1) {
		if (error) {
			return callback(error);
		}

		fd = fd1;
		read();
	});

};

EbmlDecoder.prototype._write = function(chunk, enc, done) {

	if (this._state === SKIP_DATA) {
		if (this._skipBytes >= chunk.length) {
			this._skipBytes -= chunk.length;
			this._total += chunk.length;
			this._cursor = 0;
			chunk = null;

		} else {
			this._total += this._skipBytes;
			this._cursor = this._skipBytes;
			this._skipBytes = 0;
		}

		if (!this._skipBytes) {
			if (this._skipEndFunc) {
				this._skipEndFunc();
				this._skipEndFunc = null;
			}
			this._state = STATE_TAG;
		}

		if (!chunk || !chunk.length) {
			done();
			return;
		}
		this._buffer = null;
	}

	var shared = true;
	if (!this._buffer) {
		this._buffer = chunk;
	} else {
		shared = false;
		this._buffer = Buffer.concat([ this._buffer, chunk ]);
	}

	while (this._cursor < this._buffer.length) {

		if (this._state === STATE_TAG) {
			if (!this.readTag()) {
				break;
			}
			continue;
		}

		if (this._state === STATE_SIZE) {
			if (!this.readSize()) {
				break;
			}

			continue;
		}

		if (this._state === STATE_CONTENT) {
			if (!this.readContent()) {
				break;
			}

			continue;
		}
		if (this._state === SKIP_DATA) {
			break;
		}

		console.error("Invalid state ", this._state);
	}

	if (this._buffer) {
		if (this._cursor === this._buffer.length) {
			this._buffer = null;
			this._cursor = 0;

		} else if (shared && this._reuseBuffer) {

			var left = this._buffer.length - this._cursor;

			if (this._workingBuffer && this._workingBuffer.length >= left) {
				this._buffer.copy(this._workingBuffer, 0, this._cursor);
				this._buffer = this._workingBuffer.slice(0, left);
				// console.log("Use working " + left);

			} else if (this._useSlowBuffer && this._skipTagData) {
				var sb = new SlowBuffer(left);
				this._buffer.copy(sb, 0, this._cursor);
				this._buffer = sb;

			} else {
				var buf = this._buffer.slice(this._cursor);
				this._buffer = new Buffer(buf);
			}

			this._cursor = 0;
		}
	}

	done();
};

EbmlDecoder.prototype.readTag = function() {

	debug('parsing tag');

	var start = this._total;
	var tag;
	try {
		tag = tools.readHInt(this._buffer, this._cursor, this._tagVint);
	} catch (x) {
		console.error(x);
		throw x;
	}

	if (tag === null) {
		debug('waiting for more data');
		return false;
	}

	this._cursor += tag.length;
	this._total += tag.length;
	this._state = STATE_SIZE;

	var stack = this._tag_stack;

	var parent;
	if (stack.length) {
		parent = stack[stack.length - 1];
	}

	var tagObj = new Tag(parent || this.document, this._tagId++, tag.value, start, tag.length);

	stack.push(tagObj);

	if (LOG) {
		debug('read tag: ' + util.inspect(tagObj, {
			depth: 1
		}));
	}

	return true;
};

EbmlDecoder.prototype.readSize = function() {

	var stack = this._tag_stack;
	var tagObj = stack[this._tag_stack.length - 1];

	if (LOG) {
		debug('parsing size for tag: ' + tagObj.ebmlID.toString(16));
	}

	var size = tools.readVInt(this._buffer, this._cursor, this._tagVint);

	if (size === null) {
		debug('waiting for more data');
		return false;
	}

	if (size.value < 0) {
		throw new Error("Invalid size " + size.value + " cursor=" + this._cursor + " buffer=" + this._buffer.length);
	}

	this._cursor += size.length;
	this._total += size.length;
	this._state = STATE_CONTENT;
	tagObj._setDataSize(size.value, size.length);

	if (LOG) {
		debug('read size: ' + size.value);
	}

	if (size.value === 0) {
		return this.endContent(tagObj);
	}

	return true;
};

EbmlDecoder.prototype.readContent = function() {

	var stack = this._tag_stack;

	var tag = stack[stack.length - 1];

	if (LOG) {
		debug('parsing content for tag: ' + tag.ebmlID.toString(16));
	}

	if (tag.type === 'm') {
		if (LOG) {
			debug('content should be tags');
		}
		this.emit(tag.name, tag);
		this._state = STATE_TAG;

		if (this.skipTags && this.skipTags[tag.name]) {

			stack.pop(); // remove the object from the stack

			var leftBytes = this._buffer.length - this._cursor;

			var contentBytes = tag.end - this._total;

			// console.log("Seek start=" + this._total + " content=" + contentBytes +
			// "
			// left=" + leftBytes);

			if (contentBytes >= leftBytes) {
				this._skipBytes = contentBytes - leftBytes;
				this._total += leftBytes;
				this._buffer = null;
				this._cursor = 0;
				this._state = SKIP_DATA;
				return false;
			}

			this._cursor += contentBytes;
			this._total += contentBytes;

			return true;
		}

		return true;
	}

	var leftBytes = this._buffer.length - this._cursor;

	if (leftBytes < tag.dataSize) {
		if (LOG) {
			debug('got: ' + leftBytes);
			debug('need: ' + (tag.dataSize - leftBytes));
			debug('waiting for more data');
		}

		if (this._skipTagData) {
			this._skipBytes = tag.dataSize - leftBytes;
			this._total += leftBytes;
			this._buffer = null;
			this._cursor = 0;
			this._state = SKIP_DATA;

			this._skipEndFunc = this.endContent.bind(this, tag);
		}

		return false;
	}

	if (!this.ignoreData && (!this.skipTags || !this.skipTags[tag.name])) {
		var data = this._buffer.slice(this._cursor, this._cursor + tag.dataSize);
		if (this._reuseBuffer) {
			data = new Buffer(data);
		}
		tag._setData(data);

	}

	this._total += tag.dataSize;
	this._buffer = this._buffer.slice(this._cursor + tag.dataSize);
	this._cursor = 0;

	return this.endContent(tag);
};

EbmlDecoder.prototype.endContent = function(tagObj) {

	var stack = this._tag_stack;

	stack.pop(); // remove the object from the stack

	while (stack.length) {
		var topEle = stack[stack.length - 1];
		if (this._total < topEle.end) {
			break;
		}
		this.emit(topEle.name + ':end', topEle);
		stack.pop();
	}

	this.emit(tagObj.name, tagObj);

	if (LOG) {
		debug('read data: ' + (tagObj.data && tagObj.data.toString('hex')));
	}

	this._state = STATE_TAG;

	return true;
};
