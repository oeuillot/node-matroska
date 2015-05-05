/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');

var Document1 = require('./document1');
var schema = require('./schema');

function Document2() {
	Document1.call(this);
}

util.inherits(Document2, Document1);

module.exports = Document2;
