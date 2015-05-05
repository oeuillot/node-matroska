/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');

var Element = require('../element');
var schema = require('../schema');
var _proto = require('./_proto');

function Tags(doc, tagId, start, length) {
	Element.call(this, doc, tagId, schema.byName.Tags, start, length);
}

util.inherits(Tags, Element);

module.exports = Tags;

Tags.prototype.toString = function() {
	return "[Tags #" + this.tagId + "]";
};

_proto.addChild(Tags.prototype, "Tag");
