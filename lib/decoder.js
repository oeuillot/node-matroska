/*jslint node: true, vars: true, nomen: true */
'use strict';

var debug = require('debug')('matroska:decoder');
var debugTag = require('debug')('matroska:decoder:tag');
debugTag.enabled = false;
var fs = require('fs');
var SlowBuffer = require('buffer').SlowBuffer;
var util = require('util');
var Writable = require('stream').Writable;

var Document2 = require('./document2');

var Source = require('./source/source');
var FileSource = require('./source/fileSource');
var HttpSource = require('./source/httpSource');

var tools = require('./tools');
var schema = require('./schema');

var STATE_TAG = 1;
var STATE_SIZE = 2;
var STATE_CONTENT = 3;
var SKIP_DATA = 4;

var LOG = true;

function Decoder(options) {

	Writable.call(this, options);

	options = options || {};
	this.options = options;

	this.skipTags = options.skipTags;
	if (this.skipTags === undefined) {
		this.skipTags = {
			SimpleBlock: true,
			Void: true,
			Block: true,
			FileData: true,
			TagBinary: true
		};
	}

	this.ignoreData = options.ignoreData;
	this._buffer = null;
	this._tag_stack = [];
	this._state = STATE_TAG;
	this._bufferOffset = 0;
	this._fileOffset = 0;
	this._tagVint = {};
	this._workingBuffer = new Buffer(64);
	this.document = new Document2();

	this._skipTagData = (this.ignoreData === true); // Stream mode (default mode)
	// this.ignoreData = false;

	var self = this;
	this.on('finish', function() {

		self.document._buildLinks();

		self.emit("$document", self.document);
	});
}

module.exports = Decoder;

util.inherits(Decoder, Writable);

Decoder.OnlyMetaDatas = function() {
	return {
		skipTags: {
			SimpleBlock: true,
			Void: true,
			Block: true,
			FileData: true,
			Cluster: true,
			Cues: true,
			Tracks: true
		}
	};
};

Decoder.AllDatas = function() {
	return {
		skipTags: {}
	};
};

Decoder.prototype._getStream = function(source, callback) {

	var self = this;

	var enabled = true;

	debug("Request stream ", self._readOffset);

	source.getStream({
		start: self._readOffset

	}, function(error, stream) {
		if (error) {
			return callback(error);
		}
		self._fileOffset = self._readOffset;
		self._buffer = null;
		self._bufferOffset = 0;
		self._skipBytes = 0;

		stream.on('end', function() {
			if (!enabled) {
				return;
			}

			enabled = false;
			self.document._buildLinks();
			callback(null, self.document);
		});

		stream.on('error', function(error) {
			if (!enabled) {
				return;
			}
			callback(error);
		});

		stream.on('readable',
				function() {
					if (!enabled) {
						return;
					}

					function loopRead() {
						var buffer = stream.read();
						if (!buffer) {
							return;
						}

						var bytesRead = buffer.length;

						self._readOffset += bytesRead;

						var currentPosition = self._readOffset;

						if (debug.enabled) {
							debug("Buffer Read length=", bytesRead, " readOffset=" + self._readOffset + " fileOffset=" +
									self._fileOffset);
						}

						self._write(buffer, null, function() {
							if (self._stop) {
								enabled = false;
								callback(self._invalidFormat, null);
								return;
							}

							if (self._skipBytes) {
								if (debug.enabled) {
									debug("skipBytes " + self._skipBytes);
								}

								if (self._buffer) {
									var left = self._buffer.length - self._bufferOffset;

									debug("skipBytes left=" + left);

									if (self._skipBytes <= left) {
										self._bufferOffset += self._skipBytes;
										self._fileOffset += self._skipBytes;
										self._skipBytes = 0;

										setImmediate(loopRead);
										return;
									}

									self._skipBytes -= left;
									self._fileOffset += left;
									self._buffer = null;
									self._bufferOffset = 0;
								}

								if (self._skipBytes < 65536) {
									var b = stream.read(self._skipBytes);

									debug("skipBytes try " + self._skipBytes + " get " + (b && b.length));

									if (b && b.length <= self._skipBytes) {
										self._readOffset += b.length;
										self._fileOffset += b.length
										self._skipBytes -= b.length;

										if (!self._skipBytes) {
											setImmediate(loopRead);
											return;
										}
									}
								}

								self._readOffset += self._skipBytes;
							}

							if (currentPosition !== self._readOffset) {
								if (debug.enabled) {
									debug("Read offset changed to " + self._readOffset);
								}

								enabled = false;

								stream.destroy();
								setImmediate(self._getStream.bind(self, source, callback));
								return;
							}

							setImmediate(loopRead);
						});
					}

					loopRead();
				});
	});

};

Decoder.prototype.parse = function(source, callback) {
	if (this.document.children) {
		return callback(new Error("Document has already children"));
	}

	if (typeof (source) === "string") {
		if (/^http:\/\//.test(source)) {
			source = new HttpSource(source);

		} else {
			source = new FileSource(source);
		}
	}

	if ((source instanceof Source) === false) {
		throw new Error("Invalid source parameter (" + source + ")");
	}

	this.document.source = source;

	this._skipTagData = (this.ignoreData === true);

	this._readOffset = 0;

	this._getStream(source, function(error, document) {
		source.end(function() {
			callback(error, document);
		});
	});
};

Decoder.prototype._write = function(chunk, enc, done) {

	if (this._state === SKIP_DATA) {
		if (this._skipBytes >= chunk.length) {
			this._skipBytes -= chunk.length;
			this._fileOffset += chunk.length;
			this._bufferOffset = 0;
			chunk = null;

		} else {
			this._fileOffset += this._skipBytes;
			this._bufferOffset = this._skipBytes;
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

	if (!this._buffer) {
		this._buffer = chunk;

	} else {
		var buf = this._buffer;

		if (this._bufferOffset) {
			buf = buf.slice(this._bufferOffset);
		}

		this._buffer = Buffer.concat([ buf, chunk ]);
	}
	this._bufferOffset = 0;

	while (!this._stop && this._buffer && this._bufferOffset < this._buffer.length) {

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

		debug("Invalid state ", this._state);
	}

	if (this._buffer) {
		if (this._bufferOffset === this._buffer.length) {
			this._buffer = null;
			this._bufferOffset = 0;
		}
	}

	done();
};

Decoder.prototype.readTag = function() {

	debug('parsing tag');

	var start = this._fileOffset;
	var tag;
	try {
		tag = tools.readHInt(this._buffer, this._bufferOffset, this._tagVint);

	} catch (x) {
		debug("error:", x);
		throw x;
	}

	if (tag === null) {
		if (!this._EBMLFormatVerified && this._buffer.length > 7) {
			debug("Invalid format !")

			this._invalidFormat = new Error("Invalid format for " + this.document);
			this._stop = true;

			return false;
		}

		debug('waiting for more data');
		return false;
	}

	if (!this._EBMLFormatVerified) {
		if (tag.value !== schema.byName.EBML) {
			debug("Invalid format !")

			this._invalidFormat = new Error("Invalid format for " + this.document);
			this._stop = true;

			return false;
		}
		this._EBMLFormatVerified = true;
	}

	this._bufferOffset += tag.length;
	this._fileOffset += tag.length;
	this._state = STATE_SIZE;

	var stack = this._tag_stack;

	var parent;
	if (stack.length) {
		parent = stack[stack.length - 1];
	}

	var tagObj = this.document.createElement(tag.value, start, tag.length);

	(parent || this.document).appendChild(tagObj, false);

	stack.push(tagObj);

	// console.log("Read tag " + tagObj._name);

	if (debugTag.enabled) {
		debugTag('push tag: ' + util.inspect(tagObj, {
			depth: 1
		}));
	}

	return true;
};

Decoder.prototype.readSize = function() {

	var stack = this._tag_stack;
	var tagObj = stack[this._tag_stack.length - 1];

	if (debug.enabled) {
		debug('parsing size for tag: 0x' + tagObj.ebmlID.toString(16));
	}

	var size = tools.readVInt(this._buffer, this._bufferOffset, this._tagVint);

	if (size === null) {
		debug('waiting for more data (size is null) ' + this._bufferOffset + '/' + this._buffer.length);
		return false;
	}

	if (size.value < 0) {
		throw new Error("Invalid size " + size.value + " cursor=" + this._bufferOffset + " buffer=" + this._buffer.length);
	}

	this._bufferOffset += size.length;
	this._fileOffset += size.length;
	this._state = STATE_CONTENT;
	tagObj._setDataSize(size.value, size.length);

	if (debug.enabled) {
		debug('read size: ' + size.value);
	}

	if (size.value === 0) {
		return this.endContent(tagObj);
	}

	return true;
};

Decoder.prototype.readContent = function() {

	var stack = this._tag_stack;

	var tag = stack[stack.length - 1];

	if (debug.enabled) {
		debug('parsing content for tag: ' + tag.ebmlID.toString(16));
	}

	if (tag.masterType) {
		if (LOG) {
			debug('content should be tags');
		}

		// console.log("start tag " + tag._name);
		this.emit(tag._name, tag);
		this._state = STATE_TAG;

		if (this.skipTags && this.skipTags[tag._name]) {

			stack.pop(); // remove the object from the stack

			var leftBytes = this._buffer.length - this._bufferOffset;

			var contentBytes = tag.end - this._fileOffset;

			// console.log("Seek start=" + this._fileOffset + " content=" +
			// contentBytes +
			// "
			// left=" + leftBytes);

			if (contentBytes >= leftBytes) {
				this._skipBytes = contentBytes - leftBytes;
				this._fileOffset += leftBytes;
				this._buffer = null;
				this._bufferOffset = 0;
				this._state = SKIP_DATA;
				return false;
			}

			this._bufferOffset += contentBytes;
			this._fileOffset += contentBytes;

			return true;
		}

		return true;
	}

	var leftBytes = this._buffer.length - this._bufferOffset;

	if (leftBytes < tag.dataSize) {
		if (LOG) {
			debug('got: ' + leftBytes);
			debug('need: ' + (tag.dataSize - leftBytes));
			debug('waiting for more data');
		}

		if (this._skipTagData || (this.skipTags && this.skipTags[tag._name])) {
			this._skipBytes = tag.dataSize - leftBytes;
			this._fileOffset += leftBytes;
			this._buffer = null;
			this._bufferOffset = 0;
			this._state = SKIP_DATA;

			this._skipEndFunc = this.endContent.bind(this, tag);
		}

		return false;
	}

	if (!this.ignoreData && (!this.skipTags || !this.skipTags[tag._name])) {
		var data = this._buffer.slice(this._bufferOffset, this._bufferOffset + tag.dataSize);
		tag._setData(data);
	}

	this._fileOffset += tag.dataSize;
	this._buffer = this._buffer.slice(this._bufferOffset + tag.dataSize);
	this._bufferOffset = 0;

	return this.endContent(tag);
};

Decoder.prototype.endContent = function(tagObj) {

	var stack = this._tag_stack;

	stack.pop(); // remove the object from the stack

	while (stack.length) {
		var topEle = stack[stack.length - 1];
		if (this._fileOffset < topEle.end) {
			break;
		}

		if (debugTag.enabled) {
			debugTag("Pop " + topEle._name);
		}

		this.emit(topEle._name + ':end', topEle);
		stack.pop();
	}

	this.emit(tagObj._name, tagObj);

	if (LOG) {
		debug('read data: ' + (tagObj.data && tagObj.data.toString('hex')));
	}

	if (debugTag.enabled) {
		debugTag("Push " + util.inspect(tagObj, {
			depth: 1
		}));
	}

	this._state = STATE_TAG;

	return true;
};

Decoder.parseInfoTagsAndAttachments = function(source, callback) {

	var decoder = new Decoder(Decoder.OnlyMetaDatas());

	decoder.parseEbmlIDs(source, [ schema.byName.Info, schema.byName.Tags, schema.byName.Attachments ], callback);
};

Decoder.prototype.parseEbmlIDs = function(source, ebmlIDs, callback) {

	if (!util.isArray(ebmlIDs)) {
		ebmlIDs = [ ebmlIDs ];
	}

	this.document._partial = true;

	var self = this;
	var segmentContentPosition;
	var toParse = {};
	var targets = {};

	var positions = [];

	function nextPosition() {

		if (!positions.length) {
			self._stop = true;
			return;
		}

		var position = positions.shift();

		var newOffset = segmentContentPosition + position;

		if (debug.enabled) {
			debug("New offset=" + newOffset, "fileOffset=", self._fileOffset, "bufferOffset=", self._bufferOffset,
					"buffer.length=", self._buffer.length);
		}

		if (self._buffer) {
			var start = self._fileOffset - self._bufferOffset;

			if (newOffset >= start && newOffset < start + self._buffer.length) {
				self._fileOffset = newOffset;
				self._bufferOffset = newOffset - start;
				self._skipBytes = 0;
				self._state = STATE_TAG;

				return;
			}

		}

		if (newOffset > self._readOffset) {
			self._skipBytes = newOffset - self._readOffset;
			self._fileOffset = self._readOffset;
			self._buffer = null;
			self._bufferOffset = 0;
			self._state = STATE_TAG;
			return;
		}

		self._readOffset = newOffset;
		self._fileOffset = newOffset;
		self._buffer = null;
		self._bufferOffset = 0;
		self._skipBytes = 0;
		self._state = STATE_TAG;
	}

	ebmlIDs.forEach(function(name) {
		var ebmlID = tools.convertEbmlID(name);

		if (toParse[ebmlID]) {
			return;
		}
		toParse[ebmlID] = true;

		var ebmlName = schema.byEbmlID[ebmlID].name;
		self.on(ebmlName, function(tag) {
			targets[tag.ebmlID] = tag;
		});
		self.on(ebmlName + ":end", function(tag) {
			nextPosition();
		});
	});

	this.on("Seek:end", function(tag) {
		var sid = tag.seekID;

		if (!toParse[sid]) {
			return;
		}

		positions.push(tag.seekPosition);
	});

	this.on("SeekHead:end", function(seekHead) {
		segmentContentPosition = seekHead.getLevel1().getContentPosition();

		positions.sort(function(v1, v2) {
			return v1 - v2;
		});

		nextPosition();
	});

	this.parse(source, function(error, document) {
		if (error) {
			return callback(error);
		}

		callback(null, self.document, targets);
	});
};
