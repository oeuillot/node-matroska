/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');

var Tag = require('./tag');
var schema = require('./schema');

function Segment(doc, tagId, start, length) {
	Tag.call(this, doc, tagId, schema.byName.Segment, start, length);
}

util.inherits(Segment, Tag);

module.exports = Segment;

Segment.prototype.toString = function() {
	return "[Segment #" + this.tagId + "]";
};
