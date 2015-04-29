/*jslint node: true, vars: true, nomen: true */
'use strict';

var crc32 = require('crc').crc32;
var fs = require('fs');
var Mime = require('mime');
var Path = require('path');
var util = require('util');

var Segment1 = require('./segment1');
var schema = require('./schema');
var tools = require('./tools');

function Segment2(doc, tagId, start, length) {
	Segment1.call(this, doc, tagId, start, length);
}

util.inherits(Segment2, Segment1);

module.exports = Segment2;

Segment2.prototype.addFileAttachment = function(path, description, mimeType, fileName, callback) {

	if (typeof (description) === "function" && arguments.length == 2) {
		callback = description;
		description = undefined;

	} else if (typeof (mimeType) === "function" && arguments.length == 3) {
		callback = mimeType;
		mimeType = undefined;

	} else if (typeof (fileName) === "function" && arguments.length == 4) {
		callback = fileName;
		fileName = undefined;
	}

	if (typeof (callback) !== "function") {
		return this.addFileAttachmentSync(path, description, mimeType, fileName);
	}

	if (typeof (path) !== 'string' || !path) {
		return callback("Invalid path '" + path + "'");
	}

	var self = this;

	fs.stat(path, function(error, stats) {
		if (error) {
			return callback(error);
		}

		if (!fileName) {
			fileName = Path.basename(path);
		}

		if (!mimeType) {
			mimeType = Mime.lookup(path);
		}

		var attachedFileTag = self._addAttachment({
			path: path,
			description: description,
			size: stats.size,
			fileName: fileName,
			mimeType: mimeType,
			date: stats.mtime
		});

		callback(null, attachedFileTag);
	});
};

Segment2.prototype.addFileAttachmentSync = function(path, description, mimeType, fileName) {

	if (typeof (path) !== 'string' || !path) {
		throw new Error("Invalid path '" + path + "'");
	}

	var stats = fs.statSync(path);

	if (!fileName) {
		fileName = Path.basename(path);
	}

	if (!mimeType) {
		mimeType = Mime.lookup(path);
	}

	var attachedFileTag = this._addAttachment({
		path: path,
		description: description,
		size: stats.size,
		fileName: fileName,
		mimeType: mimeType,
		date: stats.mtime
	});

	return attachedFileTag;
};

Segment2.prototype.addStreamAttachment = function(stream, fileName, mimeType, size, description, callback) {

	if (typeof (size) !== 'number') {
		return callback("Invalid size for attachment '" + size + "'");
	}

	if (typeof (mimeType) !== 'string' || !mimeType.length) {
		return callback("Invalid mimeType for attachment '" + mimeType + "'");
	}

	if (typeof (fileName) !== 'string' || !fileName.length) {
		return callback("Invalid fileName for attachment '" + fileName + "'");
	}

	if (typeof (description) === "function") {
		callback = description;
		description = undefined;

	}

	var attachedFileTag = this._addAttachment({
		stream: stream,
		description: description,
		size: size,
		fileName: fileName,
		mimeType: mimeType
	});

	callback(null, attachedFileTag);
};

Segment2.prototype._addAttachment = function(desc) {

	var doc = this.ownerDocument;

	var attachments = this.getFirstChildByName(schema.byName.Attachments);
	if (!attachments) {
		attachments = doc.createElement(schema.byName.Attachments);

		var segment = this.getFirstChildByName(schema.byName.Segment);
		segment.appendChild(attachments);
	}

	var attachedFileTag = doc.createElement(schema.byName.AttachedFile);
	attachments.appendChild(attachedFileTag);

	var crc = doc.createElement(schema.byName.CRC_32);
	crc.setCRCValue(0);
	attachedFileTag.appendChild(crc);

	var fileNameTag = doc.createElement(schema.byName.FileName);
	attachedFileTag.appendChild(fileNameTag);
	fileNameTag.setUTF8(desc.fileName);

	var fileMimeTag = doc.createElement(schema.byName.FileMimeType);
	attachedFileTag.appendChild(fileMimeTag);
	fileMimeTag.setString(desc.mimeType);

	if (desc.description) {
		var fileDescriptionTag = doc.createElement(schema.byName.FileDescription);
		attachedFileTag.appendChild(fileDescriptionTag);

		fileDescriptionTag.setUTF8(desc.description);
	}

	var fileUIDTag = doc.createElement(schema.byName.FileUID);
	attachedFileTag.appendChild(fileUIDTag);

	var uid = crc32(desc.fileName + "$" + desc.mimeType + "$" + desc.description + "$" + desc.size);
	fileUIDTag.setUInt(uid);

	var fileDataTag = doc.createElement(schema.byName.FileData);
	attachedFileTag.appendChild(fileDataTag);
	fileDataTag.dataSize = desc.size;

	var getStream;
	if (typeof (desc.stream) === "function") {
		getStream = function(callback) {
			// console.log("Get stream (1) of ", desc.path);
			callback(null, desc.stream);
		};

	} else if (desc.stream) {
		getStream = function(callback) {
			// console.log("Get stream (2) of ", desc.stream);
			callback(null, desc.stream);
		};

	} else if (desc.path) {
		getStream = function(callback) {
			var stream = fs.createReadStream(desc.path);
			// console.log("Get stream (3) of ", desc.path, stream);
			callback(null, stream);
		};
	}

	fileDataTag._dataSource = {
		getStream: getStream
	};

	return attachedFileTag;
};

/**
 * 
 * @param parent
 *          A Segment (itself), a Tags or a Tag
 * @param name
 * @param language
 * @param defaultLanguage
 * @param value
 * @param callback
 * @returns
 */
Segment2.prototype.addSimpleTag = function(parent, name, language, defaultLanguage, value, callback) {

	var doc = this.ownerDocument;

	var segment;
	var tags;
	var tag;

	if (parent) {
		if (parent.ebmlID === schema.byName.Segment) {
			segment = this;

		} else if (parent.ebmlID === schema.byName.Tags) {
			tags = parent;

		} else if (parent.ebmlID === schema.byName.Tag) {
			tag = parent;
		}
	}

	if (!tag) {
		if (!tags) {
			tags = this.getFirstChildByName(schema.byName.Tags);
			if (!tags) {
				tags = doc.createElement(schema.byName.Tags);

				if (!segment) {
					segment = this.getFirstChildByName(schema.byName.Segment);
				}
				segment.appendChild(tags);
			}
		}

		tag = this.getFirstChildByName(schema.byName.Tag);
		if (!tag) {
			tag = this.createElement(schema.byName.Tag);

			tags.appendChild(tag);
		}
	}

	var targets = this.getFirstChildByName(schema.byName.Targets);
	if (!targets) {
		targets = doc.createElement(schema.byName.Targets);

		tag.appendChild(targets);
	}

	var simpleTag = doc.createElement(schema.byName.SimpleTag);
	tag.appendChild(simpleTag);

	var tagName = doc.createElement(schema.byName.TagName);
	simpleTag.appendChild(tagName);
	tagName.setString(name);

	var languageTag = doc.createElement(schema.byName.TagLanguage);
	simpleTag.appendChild(languageTag);
	languageTag.setUTF8(language);

	var defaultTag = doc.createElement(schema.byName.TagDefault);
	simpleTag.appendChild(defaultTag);
	defaultTag.setUInt(defaultLanguage ? 1 : 0);

	/*
	 * if (typeof (value) === "function") { var binaryTag =
	 * this.createElement(schema.byName.TagBinary);
	 * simpleTag.appendChild(binaryTag); binaryTag.setData(value);
	 * 
	 * //TODO WE MUST KNOW the SIZE !
	 * 
	 * return callback(null, simpleTag); }
	 */

	if (Buffer.isBuffer(value)) {
		var binaryTag = doc.createElement(schema.byName.TagBinary);
		simpleTag.appendChild(binaryTag);
		binaryTag.setData(value);

		return callback(null, simpleTag);
	}

	if (value instanceof Date) {
		value = tools.formatDate(value);
	}

	value = String(value);

	var stringTag = doc.createElement(schema.byName.TagString);
	simpleTag.appendChild(stringTag);
	stringTag.setUTF8(value);

	return callback(null, simpleTag);
};
