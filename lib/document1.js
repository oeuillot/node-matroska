/*jslint node: true, vars: true, nomen: true */
'use strict';

var async = require('async');
var util = require('util');

var Document = require('./document');
var schema = require('./schema');

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
		var c = child._optimizeData();
		// console.log("child #" + child.tagId + " " + c + " optimisation(s)");

		cnt += c;
	});

	console.log("Optimize " + cnt + " values");

	return callback();
};

Document1.prototype.normalizeSegments = function(options, callback) {
	var segments = this.listSegments();
	options = options || {};

	async.eachSeries(segments, function(segment, callback) {
		segment.normalize(options, callback);
	}, callback);
};
