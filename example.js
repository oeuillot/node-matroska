var matroska = require('./index.js');
var fs = require('fs');
var util = require('util');

var decoder = new matroska.Decoder(matroska.Decoder.OnlyMetaDatas());

var filename = process.argv[2];

if (!filename) {
	filename = "http://download.wavetlan.com/SVV/Media/HTTP/mkv/H264_PCM(mkvmerge).mkv";
}

console.log("Parsing ... " + filename);

var t1 = Date.now();

decoder.parseInfoTagsAndAttachments(filename, function(error, document) {
	var t2 = Date.now();

	console.log("Delta=" + (t2 - t1) + "ms");

	if (error) {
		console.error(error);
		return;
	}

	console.log(document.print());
});
