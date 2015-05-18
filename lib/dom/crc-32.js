/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');

var Element1 =  require('./element1');;
var schema = require('../schema');
var _proto = require('./_proto');

function CRC_32(doc, tagId, start, length) {
	Element1.call(this, doc, tagId, schema.byName.CRC_32, start, length);

	this.setCRCValue(0);
}

util.inherits(CRC_32, Element1);

module.exports = CRC_32;

CRC32.prototype.toString = function() {
	return "[CRC-32 #" + this.tagId + "]";
};
