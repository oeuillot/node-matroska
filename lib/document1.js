/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');

var Document = require('./document');

function Document1() {
	Document.call(this);
}

util.inherits(Document1, Document);

module.exports = Document1;

/**
 * 
 */
Document1.prototype.optimizeData = function(callback) {

	if (!this.children) {
		return callback();
	}

	var cnt = 0;

	this.deepWalk(function(child) {
		cnt += child._optimizeData();
	});

	console.log("Optimize " + cnt + " values");

	return callback();
};

Document1.prototype.normalizeLevel1 = function(callback) {
	// Deplace les meta datas au début (CUE/Attachments/Tags)
	// Ajoute les Seeks
	// Ajoute/Verifie les CRC

	return callback();
};
