/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');

var Element = require('../element');
var schema = require('../schema');
var _proto = require('./_proto');

function Seek(doc, tagId, start, length) {
	Element.call(this, doc, tagId, schema.byName.Seek, start, length);
}

util.inherits(Seek, Element);

module.exports = Seek;

Seek.prototype.toString = function() {
	return "[Seek #" + this.tagId + "]";
};

_proto.addAttribute(Seek.prototype, "SeekID");
_proto.addAttribute(Seek.prototype, "SeekPosition");
