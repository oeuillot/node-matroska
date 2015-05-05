/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');

var Element = require('../element');
var schema = require('../schema');
var _proto = require('./_proto');

function Segment(doc, tagId, start, length) {
	Element.call(this, doc, tagId, schema.byName.Segment, start, length);
}

util.inherits(Segment, Element);

module.exports = Segment;

Segment.prototype.toString = function() {
	return "[Segment #" + this.tagId + "]";
};

_proto.oneChild(Segment.prototype, "Info", true);

_proto.oneChild(Segment.prototype, "SeekHead", true);

_proto.oneChild(Segment.prototype, "Attachments", true);

_proto.oneChild(Segment.prototype, "Tags", true);
