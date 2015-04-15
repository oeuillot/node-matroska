/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');

var Document1 = require('./document1');

function Document2() {
	Document1.call(this);
}

util.inherits(Document2, Document1);

module.exports = Document2;

function toJSON(tag, options) {
	var ret = {};

	if (options.noTagId !== true) {
		ret.$$tagId = tag.tagId;
	}

	tag.eachChild(function(child) {

		var old = ret[child.name];
		if (old) {
			if (!util.isArray(old)) {
				old = [ old ];
				ret[child.name] = old;
			}

			if (child.type === 'm') {
				old.push(toJSON(child, options));
				return;
			}

			var v = child.getValue();
			old.push(v);
			return;
		}

		if (child.type === 'm') {
			ret[child.name] = toJSON(child, options);
			return;
		}

		var v = child.getValue();
		ret[child.name] = v;
	});

	return ret;
}

/**
 * 
 * @param {Object}
 *          [options] Options
 * @param {function}
 *          callback First parameter is the error (if any), the second the
 *          result.
 * @returns null
 */
Document2.prototype.getInfos = function(options, callback) {
	if (typeof (options) === "function") {
		callback = options;
		options = undefined;
	}
	options = options || {};

	var infoTag = this.getFirstChildByName(0x1549a966);
	if (!infoTag) {
		return callback();
	}

	var ret = toJSON(infoTag, options);

	return callback(null, ret);
};

/**
 * 
 * @param {Object}
 *          [options] Options
 * @param {function}
 *          callback First parameter is the error (if any), the second the
 *          result.
 * @returns null
 */
Document2.prototype.listTracks = function(options, callback) {
	if (typeof (options) === "function") {
		callback = options;
		options = undefined;
	}
	options = options || {};

	var ret = [];

	this.eachChildByName(0xae, function(trackEntry) {
		var track = toJSON(trackEntry, options);
		ret.push(track);
	});

	return callback(null, ret);
};

/**
 * 
 * @param {Object}
 *          [options] Options
 * @param {function}
 *          callback First parameter is the error (if any), the second the
 *          result.
 * @returns null
 */
Document2.prototype.listChapters = function(options, callback) {
	if (typeof (options) === "function") {
		callback = options;
		options = undefined;
	}
	options = options || {};

	var ret = [];

	this.eachChildByName(0xb6, function(chapterAtom) {
		var chapter = toJSON(chapterAtom, options);
		ret.push(chapter);
	});

	return callback(null, ret);
};

/**
 * 
 * @param {Object}
 *          [options] Options
 * @param {function}
 *          callback First parameter is the error (if any), the second the
 *          result.
 * @returns null
 */
Document2.prototype.listCues = function(options, callback) {
	if (typeof (options) === "function") {
		callback = options;
		options = undefined;
	}
	options = options || {};

	var ret = [];

	this.eachChildByName(0xb6, function(cuePoint) {
		var cue = toJSON(cuePoint, options);
		ret.push(cue);
	});

	return callback(null, ret);
};

/**
 * 
 * @param {Object}
 *          [options] Options
 * @param {function}
 *          callback First parameter is the error (if any), the second the
 *          result.
 * @returns null
 */
Document2.prototype.listTags = function(options, callback) {
	if (typeof (options) === "function") {
		callback = options;
		options = undefined;
	}
	options = options || {};

	var ret = [];

	var tags = this.listChildrenByName(0x7373);
	tags.forEach(function(tag) {
		var retTag = {
			tags: {}
		};
		ret.push(retTag);

		tag.eachChildByName(0x63c0, function(targetsTag) {
			var t = toJSON(targetsTag, options);
			retTag.targets = t;
		});

		tag.eachChildByName(0x67c8, function(simpleTag) {
			var s = toJSON(simpleTag, options);
			retTag.tags[s.TagName] = s;
			if (options.noTagId) {
				delete s.TagName;
			}
		});
	});

	return callback(null, ret);
};

/**
 * The attachments list response callback.
 * 
 * @callback listAttachmentsCallback
 * @param {Error}
 *          error Error if any.
 * @param {Object}
 *          response Attachments map.
 */

/**
 * 
 * @param {Object}
 *          [options] Options
 * @param {listAttachmentsCallback}
 *          callback A callback to run when finished.
 * @returns null
 */
Document2.prototype.listAttachments = function(options, callback) {
	if (typeof (options) === "function") {
		callback = options;
		options = undefined;
	}
	options = options || {};

	var ret = {};

	this.eachChildByName(0x61a7, function(attachedFile) {
		var af = toJSON(attachedFile, options);
		ret[af.FileName || af.FileUID] = af;
		if (options.noTagId) {
			if (af.FileName) {
				delete af.FileName;
			} else {
				delete af.FileUID;
			}
		}
	});

	return callback(null, ret);
};

Document2.prototype.getTagById = function(tagId) {
	if (isNaN(tagId)) {
		tagId = tagId.$$tagId;
		if (isNaN(tagId)) {
			throw new Error("Tag identifier is unknown (" + tagId + ")");
		}
	}

	return Document.prototype.getTagById.call(this, tagId);
};

Document2.prototype.getTagPropertyStream = function(tagId, property, callback) {
	var tag = this.getTagById(tagId);

	if (!property) {
		if (tag.type === 'm') {
			return callback(new Error("Tag is a container"));
		}

		return tag.getDataStream(callback);
	}

	var prop = tag.getFirstChildByName(property);
	if (!prop) {
		return callback(new Error("Can not find property '" + property + "'"));
	}

	return prop.getDataStream(callback);
};

Document2.prototype.sync = function(jsonTag) {

};
