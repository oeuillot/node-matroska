/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');

var Element = require('../element');
var schema = require('../schema');
var _proto = require('./_proto');

function AttachedFile(doc, tagId, start, length) {
	Element.call(this, doc, tagId, schema.byName.AttachedFile, start, length);
}

util.inherits(AttachedFile, Element);

module.exports = AttachedFile;

AttachedFile.prototype.toString = function() {
	return "[AttachedFile #" + this.tagId + "]";
};

_proto.addAttribute(AttachedFile.prototype, "FileName");
_proto.addAttribute(AttachedFile.prototype, "FileMimeType");
_proto.addAttribute(AttachedFile.prototype, "FileDescription");
_proto.addAttribute(AttachedFile.prototype, "FileData");
_proto.addAttribute(AttachedFile.prototype, "FileUID");
