/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');

var Element = require('../element');
var schema = require('../schema');
var _proto = require('./_proto');

function SimpleTag(doc, tagId, start, length) {
	Element.call(this, doc, tagId, schema.byName.SimpleTag, start, length);
}

util.inherits(SimpleTag, Element);

module.exports = SimpleTag;

SimpleTag.prototype.toString = function() {
	return "[SimpleTag #" + this.tagId + "]";
};

_proto.addChild(SimpleTag.prototype, "SimpleTag");

_proto.addAttribute(SimpleTag.prototype, "TagName");
_proto.addAttribute(SimpleTag.prototype, "TagLanguage");
_proto.addAttribute(SimpleTag.prototype, "TagDefault");
_proto.addAttribute(SimpleTag.prototype, "TagString");
_proto.addAttribute(SimpleTag.prototype, "TagBinary");
