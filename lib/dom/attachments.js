/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');

var Element = require('../element');
var schema = require('../schema');
var _proto = require('./_proto');

function Attachments(doc, tagId, start, length) {
	Element.call(this, doc, tagId, schema.byName.Attachments, start, length);
}

util.inherits(Attachments, Element);

module.exports = Attachments;

Attachments.prototype.toString = function() {
	return "[Attachments #" + this.tagId + "]";
};

_proto.addChild(Attachments.prototype, "AttachedFile");
