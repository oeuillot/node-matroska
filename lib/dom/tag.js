/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');

var Element = require('../element');
var schema = require('../schema');
var _proto = require('./_proto');

function Tag(doc, tagId, start, length) {
	Element.call(this, doc, tagId, schema.byName.Tag, start, length);
}

util.inherits(Tag, Element);

module.exports = Tag;

Tag.prototype.toString = function() {
	return "[Tag #" + this.tagId + "]";
};

_proto.oneChild(Tag.prototype, "Targets", true);

_proto.addChild(Tag.prototype, "SimpleTag");
