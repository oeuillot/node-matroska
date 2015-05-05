/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');

var Element = require('../element');
var schema = require('../schema');
var _proto = require('./_proto');

function SeekHead(doc, tagId, start, length) {
	Element.call(this, doc, tagId, schema.byName.SeekHead, start, length);
}

util.inherits(SeekHead, Element);

module.exports = SeekHead;

SeekHead.prototype.toString = function() {
	return "[SeekHead #" + this.tagId + "]";
};

_proto.addChild(SeekHead.prototype, "Seek");
