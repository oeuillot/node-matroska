/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');

var Segment = require('./segment');
var schema = require('./schema');

function Segment1(doc, tagId, start, length) {
	Segment.call(this, doc, tagId, start, length);
}

util.inherits(Segment1, Segment);

module.exports = Segment1;

function verifyCRC(tag) {
	var children = tag.children || [];

	var found = false;
	children.forEach(function(c) {
		if (c.ebmlID !== schema.byName.CRC_32) {
			return;
		}

		if (children[0] === c) {
			found = true;
			return;
		}

		c.remove();
	});

	if (found) {
		return;
	}

	var crc = tag.ownerDocument.createElement(schema.byName.CRC_32);
	crc.setCRCValue(0);
	tag.insertBefore(crc, children[0]);
}

function verifySeek(seekHeadTags, targetTag) {
	seekHeadTags.forEach(function(seekHeadTag) {

		var found = false;

		seekHeadTag.eachChildByName(schema.byName.SeekID, function(seekID) {
			var ebmlID = seekID.getUInt();

			if (ebmlID !== targetTag.ebmlID) {
				return;
			}

			found = true;
			return false;
		});

		if (found) {
			return;
		}

		var doc = seekHeadTag.ownerDocument;

		var newSeek = doc.createElement(schema.byName.Seek);
		seekHeadTag.appendChild(newSeek);

		var newSeekID = doc.createElement(schema.byName.SeekID);
		newSeek.appendChild(newSeekID);
		newSeek.setUInt(ebmlID);

		var newSeekPosition = doc.createElement(schema.byName.SeekPosition);
		newSeek.appendChild(newSeekPosition);
		newSeek.setTargetPosition(targetTag);
	});
}

Segment1.prototype.normalize = function(options, callback) {
	if (typeof (options) === "function") {
		callback = options;
		options = null;
	}

	options = options || {};

	var self = this;

	var cluster = this.getFirstChildByName(schema.byName.Cluster);

	var seekHeadTags = this.listChildrenByName(schema.byName.SeekHead);
	seekHeadTags.forEach(function(seekHeadTag) {
		self.moveChildBefore(seekHeadTag, cluster);
		verifyCRC(seekHeadTag);
	});

	this.eachChildByName(schema.byName.Info, function(infoTag) {
		self.moveChildBefore(infoTag, cluster);
		verifyCRC(infoTag);
		verifySeek(seekHeadTags, infoTag);
	});

	this.eachChildByName(schema.byName.Tracks, function(tracksTag) {
		self.moveChildBefore(tracksTag, cluster);
		verifyCRC(tracksTag);
		verifySeek(seekHeadTags, tracksTag);
	});

	this.eachChildByName(schema.byName.AttachedFile, function(attachedFile) {
		verifyCRC(attachedFile);
	});

	this.eachChildByName(schema.byName.Attachments, function(attachementsTag) {
		self.moveChildBefore(attachementsTag, cluster);
		verifyCRC(attachementsTag);
	});

	this.eachChildByName(schema.byName.Tags, function(tagsTag) {
		self.moveChildBefore(tagsTag, cluster);
		verifyCRC(tagsTag);
		verifySeek(seekHeadTags, tagsTag);
	});

	this.eachChildByName(schema.byName.Cues, function(cuesTag) {
		self.moveChildBefore(cuesTag, cluster);
		verifyCRC(cuesTag);
		verifySeek(seekHeadTags, cuesTag);
	});

	this.eachChildByName(schema.byName.Void, function(voidTag) {
		voidTag.remove();
	});

	// console.log("Seek head modified");
	// console.log(this.print());

	return callback();
};
