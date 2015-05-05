/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');

var Document2 = require('./document2');
var schema = require('./schema');

var HIDE_TAGID = false;
var HIDE_MARKER = false;

function Document3() {
	Document2.call(this);
}

util.inherits(Document3, Document2);

module.exports = Document3;

function toJSON(tag, options) {
	var ret = {};

	if (options.noTagId !== true) {
		Object.defineProperty(ret, '$$tagId', {
			enumerable: !HIDE_TAGID,
			writable: true,
			value: tag.tagId
		});
	}

	tag.eachChild(function(child) {

		var old = ret[child.name];
		if (old) {
			if (!util.isArray(old)) {
				old = [ old ];
				ret[child.name] = old;
			}

			if (child.masterType) {
				old.push(toJSON(child, options));
				return;
			}

			var cv = child.getValue();
			old.push(cv);
			return;
		}

		if (child.masterType) {
			ret[child.name] = toJSON(child, options);
			return;
		}

		var v = child.getValue();
		ret[child.name] = v;
	});

	return ret;
}
Document3._toJSON = toJSON;

Document3.prototype.getTagById = function(tagId) {
	if (typeof (tagId) !== "number") {
		tagId = tagId.$$tagId;
		if (typeof (tagId) !== "number") {
			throw new Error("Tag identifier is unknown (" + tagId + ")");
		}
	}

	return Document.prototype.getTagById.call(this, tagId);
};

Document3.prototype.getTagPropertyStream = function(tagId, property, callback) {
	var tag = this.getTagById(tagId);

	if (!property) {
		if (tag.masterType) {
			return callback(new Error("Tag is a master (container)"));
		}

		return tag.getDataStream(callback);
	}

	var prop = tag.getDirectChildByName(property);
	if (!prop) {
		return callback(new Error("Can not find property '" + property + "'"));
	}

	return prop.getDataStream(callback);
};

Document3.prototype.syncTags = function(jsonTags, defaultType) {
	var context = {
		marker: Math.random() || 1
	};

	if (jsonTags.$$tagId) {
		var tag = this.getTagById(jsonTags);
		this._updateTag(context, tag);
		return;
	}

	if (util.isArray(jsonTags)) {
		var self = this;
		jsonTags.forEach(function(jsonTag) {
			if (!tag.$$tagId) {
				if (!defaultType) {
					console.error("Invalid object ", tag);
					return;
				}

				self._createElement(context, jsonTag, defaultType);
				return;
			}

			var tag = self.getTagById(jsonTags);
			self._updateTag(context, tag, jsonTags);
		});
	}

	throw new Error("Invalid parameter " + jsonTags);
};

Document3.prototype._createElement = function(context, json, ebmlID) {

	var tag = this.createTag(ebmlID);

	this._updateTag(context, tag, json);

	return tag;
};

Document3.prototype._updateTag = function(context, tag, json) {

	if (json.$$marker === context.marker) {
		console.log("Cycle ?");
		return;
	}

	if (!json.$$marker) {
		Object.defineProperty(json, '$$marker', {
			enumerable: !HIDE_MARKER,
			writable: true
		});
	}
	json.$$marker = context.marker;

	var tagIds = {};
	for ( var name in json) {
		var jValue = json[name];
		var tValue = tag.getDirectChildByName(name);

		if (jValue === null || jValue === undefined) {
			if (!tValue) {
				continue;
			}

			tValue.remove();
			continue;
		}

		var ebmlID = schema.byName[name];
		// New property ?
		if (!ebmlID) {
			// Unknown schema ?

			console.log("Ignore property '" + name + "' value=", jValue);
			continue;
		}

		if (!tValue) {
			if (util.isArray(jValue)) {
				for (var i = 0; i < jValue.length; i++) {
					var newTag2 = this._createElement(context, jValue[i], ebmlID);
					tag.appendChild(newTag2);
					tagIds[tag.tagId] = true;
				}

				continue;
			}

			var newTag = this._createElement(context, jValue, ebmlID);
			tag.appendChild(newTag);
			tagIds[tag.tagId] = true;
			continue;
		}

		if (util.isArray(jValue)) {
			var cs = tag.listChildrenByName(name);

			var j;
			for (j = 0; j < cs.length && j < jValue.length; j++) {
				this._updateTag(context, cs[j], jValue[j]);
				tagIds[cs[j].tagId] = true;
			}
			for (; j < cs.length; j++) {
				cs[j].remove();
			}
			for (; j < jValue.length; j++) {
				var newTag3 = this._createElement(context, jValue[j], ebmlID);
				tag.appendChild(newTag3);
				tagIds[tag.tagId] = true;
			}
			continue;
		}

		if (!tValue.masterType) {
			var v = tValue.getValue();
			if (v === jValue) {
				continue;
			}

			tValue.setValue(jValue);
			continue;
		}

		if (typeof (jValue) !== "object") {
			console.log("Invalid object ", jValue, " for tag #" + tValue.tagId);
			continue;
		}

		this._updateTag(context, tValue, jValue);
	}

	var cs = tag.children;
	if (!cs || !cs.length) {
		return;
	}
	for (var k = 0; k < cs.length; k++) {
		var c = cs[k];
		if (tagIds[c.tagId]) {
			continue;
		}

		c.remove();
	}
};
