/*jslint node: true, vars: true, nomen: true */
'use strict';

var async = require('async');
var fs = require('fs');
var Mime = require('mime');
var Path = require('path');
var util = require('util');

var Segment2 = require('./segment2');
var schema = require('../schema');

function Segment3(doc, tagId, start, length) {
	Segment2.call(this, doc, tagId, start, length);
}

util.inherits(Segment3, Segment2);

module.exports = Segment3;

Object.defineProperty(Segment3.prototype, "attachments", {
	iterable: false,
	get: function() {
		return this.listChildrenByName(schema.byName.Attachments);
	}
});

Object.defineProperty(Segment3.prototype, "firstAttachments", {
	iterable: false,
	get: function() {
		return this.getFirstChildByName(schema.byName.Attachments);
	}
});

Object.defineProperty(Segment3.prototype, "attachedFiles", {
	iterable: false,
	get: function() {
		return this.listChildrenByName(schema.byName.AttachedFile);
	}
});
