/*jslint node: true, vars: true, nomen: true */
'use strict';

var async = require('async');
var fs = require('fs');
var Mime = require('mime');
var Path = require('path');
var util = require('util');

var Segment2 = require('./segment2');
var Document3 = require('../document3');
var schema = require('../schema');

function Segment3(doc, tagId, start, length) {
	Segment2.call(this, doc, tagId, start, length);
}

util.inherits(Segment3, Segment2);

module.exports = Segment3;

var toJSON = Document3._toJSON;

/**
 * 
 * @param {Object}
 *          [options] Options
 * @param {function}
 *          callback First parameter is the error (if any), the second the
 *          result.
 * @returns null
 */
Segment3.prototype.getInfos = function(options, callback) {
	if (typeof (options) === "function") {
		callback = options;
		options = undefined;
	}
	options = options || {};

	var infoTag = this.getFirstChildByName(schema.byName.Info);
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
Segment3.prototype.listTracks = function(options, callback) {
	if (typeof (options) === "function") {
		callback = options;
		options = undefined;
	}
	options = options || {};

	var ret = [];

	this.eachChildByName(schema.byName.Tracks, function(trackEntry) {
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
Segment3.prototype.listChapters = function(options, callback) {
	if (typeof (options) === "function") {
		callback = options;
		options = undefined;
	}
	options = options || {};

	var ret = [];

	this.eachChildByName(schema.byName.Chapters, function(chapterAtom) {
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
Segment3.prototype.listCues = function(options, callback) {
	if (typeof (options) === "function") {
		callback = options;
		options = undefined;
	}
	options = options || {};

	var ret = [];

	this.eachChildByName(schema.byName.Cues, function(cuePoint) {
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
Segment3.prototype.listTags = function(options, callback) {
	if (typeof (options) === "function") {
		callback = options;
		options = undefined;
	}
	options = options || {};

	var ret = [];

	var tags = this.listChildrenByName(schema.byName.Tag);
	tags.forEach(function(tag) {
		var retTag = {
			targets: [],
			tags: {}
		};
		ret.push(retTag);

		tag.eachChildByName(schema.byName.Targets, function(targetsTag) {
			var t = toJSON(targetsTag, options);
			retElement.targets.push(t);
		});

		tag.eachChildByName(schema.byName.SimpleTag, function(simpleTag) {
			var s = toJSON(simpleTag, options);
			retElement.tags[s.TagName] = s;
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
Segment3.prototype.listAttachments = function(options, callback) {
	if (typeof (options) === "function") {
		callback = options;
		options = undefined;
	}
	options = options || {};

	var ret = {};

	this.eachChildByName(schema.byName.AttachedFile, function(attachedFile) {
		var af = toJSON(attachedFile, options);
		ret[af.FileUID] = af;
		if (options.noTagId) {
			delete af.FileUID;
		}
	});

	return callback(null, ret);
};

Segment3.prototype.listMetadatas = function(options, callback) {
	var ret = {};

	options = options || {};

	var types = options.types || [ "infos", "attachments", "tags" ];

	var self = this;
	async.eachSeries(types, function(type, callback) {

		var f;
		switch (type) {
		case "attachments":
			f = self.listAttachments;
			break;
		case "chapters":
			f = self.listChapters;
			break;
		case "cues":
			f = self.listCues;
			break;
		case "infos":
			f = self.getInfos;
			break;
		case "tags":
			f = self.listTags;
			break;
		case "tracks":
			f = self.listTracks;
			break;
		}
		if (!f) {
			return callback();
		}

		return f.call(self, options, function(error, obj) {
			if (error) {
				return callback(error);
			}
			ret[type] = obj;
			callback();
		});

	}, function(error) {
		if (error) {
			return callback(error);
		}

		callback(null, ret);
	});
};
