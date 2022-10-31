/*jslint node: true, vars: true, nomen: true */
'use strict';

var byEbmlID = {
	0x80: {
		name: "ChapterDisplay",
		level: 4,
		type: "m",
		multiple: true,
		webm: true,
		description: "Contains all possible strings to use for the chapter display."
	},
	0x83: {
		name: "TrackType",
		level: 3,
		type: "u",
		mandatory: true,
		description: "The `TrackType` defines the type of each frame found in the Track. The value **SHOULD** be stored on 1 octet."
	},
	0x85: {
		name: "ChapString",
		cppname: "ChapterString",
		level: 5,
		type: "8",
		mandatory: true,
		webm: true,
		description: "Contains the string to use as the chapter atom."
	},
	0x86: {
		name: "CodecID",
		level: 3,
		type: "s",
		mandatory: true,
		description: "An ID corresponding to the codec, see [@!MatroskaCodec] for more info."
	},
	0x88: {
		name: "FlagDefault",
		cppname: "TrackFlagDefault",
		level: 3,
		type: "u",
		mandatory: true,
		"default": "1",
		range: "0-1",
		description: "Set if that track (audio, video or subs) **SHOULD** be eligible for automatic selection by the player; see (#default-track-selection) for more details."
	},
	0x89: {
		name: "ChapterTrackUID",
		cppname: "ChapterTrackNumber",
		level: 5,
		type: "u",
		mandatory: true,
		multiple: true,
		range: "not 0",
		description: "UID of the Track to apply this chapter to. In the absence of a control track, choosing this chapter will select the listed Tracks and deselect unlisted tracks. Absence of this Element indicates that the Chapter **SHOULD** be applied to any currently used Tracks."
	},
	0x8e: {
		name: "Slices",
		level: 3,
		type: "m",
		maxver: 0,
		description: "Contains slices description."
	},
	0x8f: {
		name: "ChapterTrack",
		level: 4,
		type: "m",
		description: "List of tracks on which the chapter applies. If this Element is not present, all tracks apply"
	},
	0x91: {
		name: "ChapterTimeStart",
		level: 4,
		type: "u",
		mandatory: true,
		webm: true,
		description: "Timestamp of the start of Chapter, expressed in Matroska Ticks -- ie in nanoseconds; see (#timestamp-ticks)."
	},
	0x92: {
		name: "ChapterTimeEnd",
		level: 4,
		type: "u",
		webm: true,
		description: "Timestamp of the end of Chapter timestamp excluded, expressed in Matroska Ticks -- ie in nanoseconds; see (#timestamp-ticks). The value **MUST** be greater than or equal to the `ChapterTimeStart` of the same `ChapterAtom`."
	},
	0x96: {
		name: "CueRefTime",
		level: 5,
		type: "u",
		mandatory: true,
		minver: 2,
		description: "Timestamp of the referenced Block, expressed in Matroska Ticks -- ie in nanoseconds; see (#timestamp-ticks)."
	},
	0x97: {
		name: "CueRefCluster",
		level: 5,
		type: "u",
		mandatory: true,
		minver: 0,
		maxver: 0,
		description: "The Segment Position of the Cluster containing the referenced Block."
	},
	0x98: {
		name: "ChapterFlagHidden",
		level: 4,
		type: "u",
		mandatory: true,
		"default": "0",
		range: "0-1",
		description: "Set to 1 if a chapter is hidden. Hidden chapters **SHOULD NOT** be available to the user interface (but still to Control Tracks; see (#chapterflaghidden) on Chapter flags)."
	},
	0x9a: {
		name: "FlagInterlaced",
		cppname: "VideoFlagInterlaced",
		level: 4,
		type: "u",
		mandatory: true,
		minver: 2,
		webm: true,
		"default": "0",
		description: "Specify whether the video frames in this track are interlaced or not."
	},
	0x9b: {
		name: "BlockDuration",
		level: 3,
		type: "u",
		description: "The duration of the Block, expressed in Track Ticks; see (#timestamp-ticks). The BlockDuration Element can be useful at the end of a Track to define the duration of the last frame (as there is no subsequent Block available), or when there is a break in a track like for subtitle tracks."
	},
	0x9c: {
		name: "FlagLacing",
		cppname: "TrackFlagLacing",
		level: 3,
		type: "u",
		mandatory: true,
		"default": "1",
		range: "0-1",
		description: "Set to 1 if the track **MAY** contain blocks using lacing. When set to 0 all blocks **MUST** have their lacing flags set to No lacing; see (#block-lacing) on Block Lacing."
	},
	0x9d: {
		name: "FieldOrder",
		cppname: "VideoFieldOrder",
		level: 4,
		type: "u",
		mandatory: true,
		minver: 4,
		"default": "2",
		description: "Specify the field ordering of video frames in this track."
	},
	0x9f: {
		name: "Channels",
		cppname: "AudioChannels",
		level: 4,
		type: "u",
		mandatory: true,
		"default": "1",
		range: "not 0",
		description: "Numbers of channels in the track."
	},
	0xa0: {
		name: "BlockGroup",
		level: 2,
		type: "m",
		multiple: true,
		description: "Basic container of information containing a single Block and information specific to that Block."
	},
	0xa1: {
		name: "Block",
		level: 3,
		type: "b",
		mandatory: true,
		description: "Block containing the actual data to be rendered and a timestamp relative to the Cluster Timestamp; see (#block-structure) on Block Structure."
	},
	0xa2: {
		name: "BlockVirtual",
		level: 3,
		type: "b",
		minver: 0,
		maxver: 0,
		description: "A Block with no data. It **MUST** be stored in the stream at the place the real Block would be in display order. "
	},
	0xa3: {
		name: "SimpleBlock",
		level: 2,
		type: "b",
		multiple: true,
		minver: 2,
		webm: true,
		divx: true,
		description: "Similar to Block, see (#block-structure), but without all the extra information, mostly used to reduced overhead when no extra feature is needed; see (#simpleblock-structure) on SimpleBlock Structure."
	},
	0xa4: {
		name: "CodecState",
		level: 3,
		type: "b",
		minver: 2,
		description: "The new codec state to use. Data interpretation is private to the codec. This information **SHOULD** always be referenced by a seek entry."
	},
	0xa5: {
		name: "BlockAdditional",
		level: 5,
		type: "b",
		mandatory: true,
		webm: true,
		description: "Interpreted by the codec as it wishes (using the BlockAddID)."
	},
	0xa6: {
		name: "BlockMore",
		level: 4,
		type: "m",
		mandatory: true,
		multiple: true,
		webm: true,
		description: "Contain the BlockAdditional and some parameters."
	},
	0xa7: {
		name: "Position",
		cppname: "ClusterPosition",
		level: 2,
		type: "u",
		description: "The Segment Position of the Cluster in the Segment (0 in live streams). It might help to resynchronise offset on damaged streams."
	},
	0xaa: {
		name: "CodecDecodeAll",
		level: 3,
		type: "u",
		mandatory: true,
		maxver: 0,
		"default": "1",
		range: "0-1",
		description: "Set to 1 if the codec can decode potentially damaged data."
	},
	0xab: {
		name: "PrevSize",
		cppname: "ClusterPrevSize",
		level: 2,
		type: "u",
		description: "Size of the previous Cluster, in octets. Can be useful for backward playing."
	},
	0xae: {
		name: "TrackEntry",
		level: 2,
		type: "m",
		mandatory: true,
		multiple: true,
		description: "Describes a track with all Elements."
	},
	0xaf: {
		name: "EncryptedBlock",
		level: 2,
		type: "b",
		multiple: true,
		minver: 0,
		maxver: 0,
		description: "Similar to SimpleBlock, see (#simpleblock-structure), but the data inside the Block are Transformed (encrypt and/or signed)."
	},
	0xb0: {
		name: "PixelWidth",
		cppname: "VideoPixelWidth",
		level: 4,
		type: "u",
		mandatory: true,
		range: "not 0",
		description: "Width of the encoded video frames in pixels."
	},
	0xb2: {
		name: "CueDuration",
		level: 4,
		type: "u",
		minver: 4,
		webm: true,
		description: "The duration of the block, expressed in Segment Ticks which is based on TimestampScale; see (#timestamp-ticks). If missing, the track's DefaultDuration does not apply and no duration information is available in terms of the cues."
	},
	0xb3: {
		name: "CueTime",
		level: 3,
		type: "u",
		mandatory: true,
		description: "Absolute timestamp of the seek point, expressed in Matroska Ticks -- ie in nanoseconds; see (#timestamp-ticks)."
	},
	0xb5: {
		name: "SamplingFrequency",
		cppname: "AudioSamplingFreq",
		level: 4,
		type: "f",
		mandatory: true,
		"default": "0x1.f4p+12",
		range: "> 0x0p+0",
		description: "Sampling frequency in Hz."
	},
	0xb6: {
		name: "ChapterAtom",
		level: 3,
		type: "m",
		mandatory: true,
		multiple: true,
		webm: true,
		description: "Contains the atom information to use as the chapter atom (apply to all tracks)."
	},
	0xb7: {
		name: "CueTrackPositions",
		level: 3,
		type: "m",
		mandatory: true,
		multiple: true,
		description: "Contain positions for different tracks corresponding to the timestamp."
	},
	0xb9: {
		name: "FlagEnabled",
		cppname: "TrackFlagEnabled",
		level: 3,
		type: "u",
		mandatory: true,
		minver: 2,
		webm: true,
		"default": "1",
		range: "0-1",
		description: "Set to 1 if the track is usable. It is possible to turn a not usable track into a usable track using chapter codecs or control tracks."
	},
	0xba: {
		name: "PixelHeight",
		cppname: "VideoPixelHeight",
		level: 4,
		type: "u",
		mandatory: true,
		range: "not 0",
		description: "Height of the encoded video frames in pixels."
	},
	0xbb: {
		name: "CuePoint",
		level: 2,
		type: "m",
		mandatory: true,
		multiple: true,
		description: "Contains all information relative to a seek point in the Segment."
	},
	0xbf: {
		name: "CRC-32",
		level: -1,
		type: "b",
		minver: 1,
		webm: false,
		description: "The CRC is computed on all the data of the Master element it's in. The CRC element should be the first in it's parent master for easier reading. All level 1 elements should include a CRC-32. The CRC in use is the IEEE CRC32 Little Endian.",
		crc: true
	},
	0xc0: {
		name: "TrickTrackUID",
		level: 3,
		type: "u",
		minver: 0,
		maxver: 0,
		divx: true,
		description: "The TrackUID of the Smooth FF/RW video in the paired EBML structure corresponding to this video track. See [@?DivXTrickTrack]."
	},
	0xc1: {
		name: "TrickTrackSegmentUID",
		level: 3,
		type: "b",
		minver: 0,
		maxver: 0,
		divx: true,
		description: "The SegmentUID of the Segment containing the track identified by TrickTrackUID. See [@?DivXTrickTrack]."
	},
	0xc4: {
		name: "TrickMasterTrackSegmentUID",
		level: 3,
		type: "b",
		minver: 0,
		maxver: 0,
		divx: true,
		description: "The SegmentUID of the Segment containing the track identified by MasterTrackUID. See [@?DivXTrickTrack]."
	},
	0xc6: {
		name: "TrickTrackFlag",
		level: 3,
		type: "u",
		minver: 0,
		maxver: 0,
		divx: true,
		"default": "0",
		description: "Set to 1 if this video track is a Smooth FF/RW track. If set to 1, MasterTrackUID and MasterTrackSegUID should must be present and BlockGroups for this track must contain ReferenceFrame structures. Otherwise, TrickTrackUID and TrickTrackSegUID must be present if this track has a corresponding Smooth FF/RW track. See [@?DivXTrickTrack]."
	},
	0xc7: {
		name: "TrickMasterTrackUID",
		level: 3,
		type: "u",
		minver: 0,
		maxver: 0,
		divx: true,
		description: "The TrackUID of the video track in the paired EBML structure that corresponds to this Smooth FF/RW track. See [@?DivXTrickTrack]."
	},
	0xc8: {
		name: "ReferenceFrame",
		level: 3,
		type: "m",
		minver: 0,
		maxver: 0,
		divx: true,
		description: "Contains information about the last reference frame. See [@?DivXTrickTrack]."
	},
	0xc9: {
		name: "ReferenceOffset",
		level: 4,
		type: "u",
		mandatory: true,
		minver: 0,
		maxver: 0,
		divx: true,
		description: "The relative offset, in bytes, from the previous BlockGroup element for this Smooth FF/RW video track to the containing BlockGroup element. See [@?DivXTrickTrack]."
	},
	0xca: {
		name: "ReferenceTimestamp",
		cppname: "ReferenceTimeCode",
		level: 4,
		type: "u",
		mandatory: true,
		minver: 0,
		maxver: 0,
		divx: true,
		description: "The timestamp of the BlockGroup pointed to by ReferenceOffset, expressed in Track Ticks; see (#timestamp-ticks). See [@?DivXTrickTrack]."
	},
	0xcb: {
		name: "BlockAdditionID",
		cppname: "SliceBlockAddID",
		level: 5,
		type: "u",
		minver: 0,
		maxver: 0,
		"default": "0",
		description: "The ID of the BlockAdditional Element (0 is the main Block)."
	},
	0xcc: {
		name: "LaceNumber",
		cppname: "SliceLaceNumber",
		level: 5,
		type: "u",
		minver: 0,
		maxver: 0,
		description: "The reverse number of the frame in the lace (0 is the last frame, 1 is the next to last, etc). Being able to interpret this Element is not **REQUIRED** for playback."
	},
	0xcd: {
		name: "FrameNumber",
		cppname: "SliceFrameNumber",
		level: 5,
		type: "u",
		minver: 0,
		maxver: 0,
		"default": "0",
		description: "The number of the frame to generate from this lace with this delay (allow you to generate many frames from the same Block/Frame)."
	},
	0xce: {
		name: "Delay",
		cppname: "SliceDelay",
		level: 5,
		type: "u",
		minver: 0,
		maxver: 0,
		"default": "0",
		description: "The delay to apply to the Element, expressed in Track Ticks; see (#timestamp-ticks)."
	},
	0xcf: {
		name: "SliceDuration",
		level: 5,
		type: "u",
		minver: 0,
		maxver: 0,
		"default": "0",
		description: "The duration to apply to the Element, expressed in Track Ticks; see (#timestamp-ticks)."
	},
	0xd7: {
		name: "TrackNumber",
		level: 3,
		type: "u",
		mandatory: true,
		range: "not 0",
		description: "The track number as used in the Block Header (using more than 127 tracks is not encouraged, though the design allows an unlimited number)."
	},
	0xdb: {
		name: "CueReference",
		level: 4,
		type: "m",
		multiple: true,
		minver: 2,
		description: "The Clusters containing the referenced Blocks."
	},
	0xe0: {
		name: "Video",
		cppname: "TrackVideo",
		level: 3,
		type: "m",
		description: "Video settings."
	},
	0xe1: {
		name: "Audio",
		cppname: "TrackAudio",
		level: 3,
		type: "m",
		description: "Audio settings."
	},
	0xe2: {
		name: "TrackOperation",
		level: 3,
		type: "m",
		minver: 3,
		description: "Operation that needs to be applied on tracks to create this virtual track. For more details look at (#track-operation)."
	},
	0xe3: {
		name: "TrackCombinePlanes",
		level: 4,
		type: "m",
		minver: 3,
		description: "Contains the list of all video plane tracks that need to be combined to create this 3D track"
	},
	0xe4: {
		name: "TrackPlane",
		level: 5,
		type: "m",
		mandatory: true,
		multiple: true,
		minver: 3,
		description: "Contains a video plane track that need to be combined to create this 3D track"
	},
	0xe5: {
		name: "TrackPlaneUID",
		level: 6,
		type: "u",
		mandatory: true,
		minver: 3,
		range: "not 0",
		description: "The trackUID number of the track representing the plane."
	},
	0xe6: {
		name: "TrackPlaneType",
		level: 6,
		type: "u",
		mandatory: true,
		minver: 3,
		description: "The kind of plane this track corresponds to."
	},
	0xe7: {
		name: "Timestamp",
		cppname: "ClusterTimecode",
		level: 2,
		type: "u",
		mandatory: true,
		description: "Absolute timestamp of the cluster, expressed in Segment Ticks which is based on TimestampScale; see (#timestamp-ticks)."
	},
	0xe8: {
		name: "TimeSlice",
		level: 4,
		type: "m",
		multiple: true,
		minver: 0,
		maxver: 0,
		description: "Contains extra time information about the data contained in the Block. Being able to interpret this Element is not **REQUIRED** for playback."
	},
	0xe9: {
		name: "TrackJoinBlocks",
		level: 4,
		type: "m",
		minver: 3,
		description: "Contains the list of all tracks whose Blocks need to be combined to create this virtual track"
	},
	0xea: {
		name: "CueCodecState",
		level: 4,
		type: "u",
		mandatory: true,
		minver: 2,
		"default": "0",
		description: "The Segment Position of the Codec State corresponding to this Cue Element. 0 means that the data is taken from the initial Track Entry."
	},
	0xeb: {
		name: "CueRefCodecState",
		level: 5,
		type: "u",
		minver: 0,
		maxver: 0,
		"default": "0",
		description: "The Segment Position of the Codec State corresponding to this referenced Element. 0 means that the data is taken from the initial Track Entry."
	},
	0xec: {
		name: "Void",
		level: -1,
		type: "b",
		minver: 1,
		description: "Used to void damaged data, to avoid unexpected behaviors when using damaged data. The content is discarded. Also used to reserve space in a sub-element for later use."
	},
	0xed: {
		name: "TrackJoinUID",
		level: 5,
		type: "u",
		mandatory: true,
		multiple: true,
		minver: 3,
		range: "not 0",
		description: "The trackUID number of a track whose blocks are used to create this virtual track."
	},
	0xee: {
		name: "BlockAddID",
		level: 5,
		type: "u",
		mandatory: true,
		webm: true,
		"default": "1",
		range: "not 0",
		description: "An ID to identify the BlockAdditional level. If BlockAddIDType of the corresponding block is 0, this value is also the value of BlockAddIDType for the meaning of the content of BlockAdditional."
	},
	0xf0: {
		name: "CueRelativePosition",
		level: 4,
		type: "u",
		minver: 4,
		webm: true,
		description: "The relative position inside the Cluster of the referenced SimpleBlock or BlockGroup with 0 being the first possible position for an Element inside that Cluster."
	},
	0xf1: {
		name: "CueClusterPosition",
		level: 4,
		type: "u",
		mandatory: true,
		description: "The Segment Position of the Cluster containing the associated Block."
	},
	0xf7: {
		name: "CueTrack",
		level: 4,
		type: "u",
		mandatory: true,
		range: "not 0",
		description: "The track for which a position is given."
	},
	0xfa: {
		name: "ReferencePriority",
		level: 3,
		type: "u",
		mandatory: true,
		"default": "0",
		description: "This frame is referenced and has the specified cache priority. In cache only a frame of the same or higher priority can replace this frame. A value of 0 means the frame is not referenced."
	},
	0xfb: {
		name: "ReferenceBlock",
		level: 3,
		type: "i",
		multiple: true,
		description: "A timestamp value, relative to the timestamp of the Block in this BlockGroup, expressed in Track Ticks; see (#timestamp-ticks). This is used to reference other frames necessary to decode this frame. The relative value **SHOULD** correspond to a valid `Block` this `Block` depends on. Historically Matroska Writer didn't write the actual `Block(s)` this `Block` depends on, but *some* `Block` in the past.  The value \"0\" **MAY** also be used to signify this `Block` cannot be decoded on its own, but without knownledge of which `Block` is necessary. In this case, other `ReferenceBlock` **MUST NOT** be found in the same `BlockGroup`.  If the `BlockGroup` doesn't have any `ReferenceBlock` element, then the `Block` it contains can be decoded without using any other `Block` data."
	},
	0xfd: {
		name: "ReferenceVirtual",
		level: 3,
		type: "i",
		minver: 0,
		maxver: 0,
		description: "The Segment Position of the data that would otherwise be in position of the virtual block."
	},
	0x41a4: {
		name: "BlockAddIDName",
		level: 4,
		type: "s",
		minver: 4,
		description: "A human-friendly name describing the type of BlockAdditional data, as defined by the associated Block Additional Mapping."
	},
	0x41e4: {
		name: "BlockAdditionMapping",
		level: 3,
		type: "m",
		multiple: true,
		minver: 4,
		description: "Contains elements that extend the track format, by adding content either to each frame, with BlockAddID ((#blockaddid-element)), or to the track as a whole with BlockAddIDExtraData."
	},
	0x41e7: {
		name: "BlockAddIDType",
		level: 4,
		type: "u",
		mandatory: true,
		minver: 4,
		"default": "0",
		description: "Stores the registered identifier of the Block Additional Mapping to define how the BlockAdditional data should be handled."
	},
	0x41ed: {
		name: "BlockAddIDExtraData",
		level: 4,
		type: "b",
		minver: 4,
		description: "Extra binary data that the BlockAddIDType can use to interpret the BlockAdditional data. The interpretation of the binary data depends on the BlockAddIDType value and the corresponding Block Additional Mapping."
	},
	0x41f0: {
		name: "BlockAddIDValue",
		level: 4,
		type: "u",
		minver: 4,
		range: ">=2",
		description: "If the track format extension needs content beside frames, the value refers to the BlockAddID ((#blockaddid-element)), value being described. To keep MaxBlockAdditionID as low as possible, small values **SHOULD** be used."
	},
	0x4254: {
		name: "ContentCompAlgo",
		level: 6,
		type: "u",
		mandatory: true,
		"default": "0",
		description: "The compression algorithm used."
	},
	0x4255: {
		name: "ContentCompSettings",
		level: 6,
		type: "b",
		description: "Settings that might be needed by the decompressor. For Header Stripping (`ContentCompAlgo`=3), the bytes that were removed from the beginning of each frames of the track."
	},
	0x4282: {
		name: "DocType",
		level: 1,
		type: "s",
		mandatory: true,
		"default": "matroska",
		minver: 1,
		description: "A string that describes the type of document that follows this EBML header. 'matroska' in our case or 'webm' for webm files."
	},
	0x4285: {
		name: "DocTypeReadVersion",
		level: 1,
		type: "u",
		mandatory: true,
		"default": 1,
		minver: 1,
		description: "The minimum DocType version an interpreter has to support to read this file."
	},
	0x4286: {
		name: "EBMLVersion",
		level: 1,
		type: "u",
		mandatory: true,
		"default": 1,
		minver: 1,
		description: "The version of EBML parser used to create the file."
	},
	0x4287: {
		name: "DocTypeVersion",
		level: 1,
		type: "u",
		mandatory: true,
		"default": 1,
		minver: 1,
		description: "The version of DocType interpreter used to create the file."
	},
	0x42f2: {
		name: "EBMLMaxIDLength",
		level: 1,
		type: "u",
		mandatory: true,
		"default": "4",
		range: ">=4"
	},
	0x42f3: {
		name: "EBMLMaxSizeLength",
		level: 1,
		type: "u",
		mandatory: true,
		"default": "8",
		range: "not 0"
	},
	0x42f7: {
		name: "EBMLReadVersion",
		level: 1,
		type: "u",
		mandatory: true,
		"default": 1,
		minver: 1,
		description: "The minimum EBML version a parser has to support to read this file."
	},
	0x437c: {
		name: "ChapLanguage",
		cppname: "ChapterLanguage",
		level: 5,
		type: "s",
		mandatory: true,
		multiple: true,
		webm: true,
		"default": "eng",
		description: "A language corresponding to the string, in the bibliographic ISO-639-2 form [@!ISO639-2]. This Element **MUST** be ignored if a ChapLanguageIETF Element is used within the same ChapterDisplay Element."
	},
	0x437d: {
		name: "ChapLanguageIETF",
		level: 5,
		type: "s",
		multiple: true,
		minver: 4,
		description: "Specifies a language corresponding to the ChapString in the format defined in [@!BCP47] and using the IANA Language Subtag Registry [@!IANALangRegistry]. If a ChapLanguageIETF Element is used, then any ChapLanguage and ChapCountry Elements used in the same ChapterDisplay **MUST** be ignored."
	},
	0x437e: {
		name: "ChapCountry",
		cppname: "ChapterCountry",
		level: 5,
		type: "s",
		multiple: true,
		webm: true,
		description: "A country corresponding to the string, using the same 2 octets country-codes as in Internet domains [@!IANADomains] based on [@!ISO3166-1] alpha-2 codes. This Element **MUST** be ignored if a ChapLanguageIETF Element is used within the same ChapterDisplay Element."
	},
	0x4444: {
		name: "SegmentFamily",
		level: 2,
		type: "b",
		multiple: true,
		description: "A randomly generated unique ID that all Segments of a Linked Segment **MUST** share (128 bits)."
	},
	0x4461: {
		name: "DateUTC",
		level: 2,
		type: "d",
		description: "The date and time that the Segment was created by the muxing application or library."
	},
	0x447a: {
		name: "TagLanguage",
		cppname: "TagLangue",
		level: 4,
		type: "s",
		mandatory: true,
		webm: true,
		"default": "und",
		description: "Specifies the language of the tag specified, in the Matroska languages form; see (#language-codes) on language codes. This Element **MUST** be ignored if the TagLanguageIETF Element is used within the same SimpleTag Element."
	},
	0x447b: {
		name: "TagLanguageIETF",
		level: 4,
		type: "s",
		minver: 4,
		description: "Specifies the language used in the TagString according to [@!BCP47] and using the IANA Language Subtag Registry [@!IANALangRegistry]. If this Element is used, then any TagLanguage Elements used in the same SimpleTag **MUST** be ignored."
	},
	0x4484: {
		name: "TagDefault",
		level: 4,
		type: "u",
		mandatory: true,
		webm: true,
		"default": "1",
		range: "0-1",
		description: "A boolean value to indicate if this is the default/original language to use for the given tag."
	},
	0x4485: {
		name: "TagBinary",
		level: 4,
		type: "b",
		webm: true,
		description: "The values of the Tag, if it is binary. Note that this cannot be used in the same SimpleTag as TagString."
	},
	0x4487: {
		name: "TagString",
		level: 4,
		type: "8",
		webm: true,
		description: "The value of the Tag."
	},
	0x4489: {
		name: "Duration",
		level: 2,
		type: "f",
		range: "> 0x0p+0",
		description: "Duration of the Segment, expressed in Segment Ticks which is based on TimestampScale; see (#timestamp-ticks)."
	},
	0x44b4: {
		name: "TagDefaultBogus",
		level: 4,
		type: "u",
		mandatory: true,
		minver: 0,
		maxver: 0,
		"default": "1",
		range: "0-1",
		description: "A variant of the TagDefault element with a bogus Element ID; see (#tagdefault-element)."
	},
	0x450d: {
		name: "ChapProcessPrivate",
		cppname: "ChapterProcessPrivate",
		level: 5,
		type: "b",
		description: "Some optional data attached to the ChapProcessCodecID information. For ChapProcessCodecID = 1, it is the \"DVD level\" equivalent; see (#menu-features) on DVD menus."
	},
	0x4598: {
		name: "ChapterFlagEnabled",
		level: 4,
		type: "u",
		mandatory: true,
		"default": "1",
		range: "0-1",
		description: "Set to 1 if the chapter is enabled. It can be enabled/disabled by a Control Track. When disabled, the movie **SHOULD** skip all the content between the TimeStart and TimeEnd of this chapter; see (#chapter-flags) on Chapter flags."
	},
	0x45a3: {
		name: "TagName",
		level: 4,
		type: "8",
		mandatory: true,
		webm: true,
		description: "The name of the Tag that is going to be stored."
	},
	0x45b9: {
		name: "EditionEntry",
		level: 2,
		type: "m",
		mandatory: true,
		multiple: true,
		webm: true,
		description: "Contains all information about a Segment edition."
	},
	0x45bc: {
		name: "EditionUID",
		level: 3,
		type: "u",
		range: "not 0",
		description: "A unique ID to identify the edition. It's useful for tagging an edition."
	},
	0x45bd: {
		name: "EditionFlagHidden",
		level: 3,
		type: "u",
		mandatory: true,
		"default": "0",
		range: "0-1",
		description: "Set to 1 if an edition is hidden. Hidden editions **SHOULD NOT** be available to the user interface (but still to Control Tracks; see (#chapter-flags) on Chapter flags)."
	},
	0x45db: {
		name: "EditionFlagDefault",
		level: 3,
		type: "u",
		mandatory: true,
		"default": "0",
		range: "0-1",
		description: "Set to 1 if the edition **SHOULD** be used as the default one."
	},
	0x45dd: {
		name: "EditionFlagOrdered",
		level: 3,
		type: "u",
		mandatory: true,
		"default": "0",
		range: "0-1",
		description: "Set to 1 if the chapters can be defined multiple times and the order to play them is enforced; see (#editionflagordered)."
	},
	0x465c: {
		name: "FileData",
		level: 3,
		type: "b",
		mandatory: true,
		description: "The data of the file."
	},
	0x4660: {
		name: "FileMimeType",
		cppname: "MimeType",
		level: 3,
		type: "s",
		mandatory: true,
		description: "MIME type of the file."
	},
	0x4661: {
		name: "FileUsedStartTime",
		level: 3,
		type: "u",
		minver: 0,
		maxver: 0,
		divx: true,
		description: "The timestamp at which this optimized font attachment comes into context, expressed in Segment Ticks which is based on TimestampScale. See [@?DivXWorldFonts]."
	},
	0x4662: {
		name: "FileUsedEndTime",
		level: 3,
		type: "u",
		minver: 0,
		maxver: 0,
		divx: true,
		description: "The timestamp at which this optimized font attachment goes out of context, expressed in Segment Ticks which is based on TimestampScale. See [@?DivXWorldFonts]."
	},
	0x466e: {
		name: "FileName",
		level: 3,
		type: "8",
		mandatory: true,
		description: "Filename of the attached file."
	},
	0x4675: {
		name: "FileReferral",
		level: 3,
		type: "b",
		minver: 0,
		maxver: 0,
		description: "A binary value that a track/codec can refer to when the attachment is needed."
	},
	0x467e: {
		name: "FileDescription",
		level: 3,
		type: "8",
		description: "A human-friendly name for the attached file."
	},
	0x46ae: {
		name: "FileUID",
		level: 3,
		type: "u",
		mandatory: true,
		range: "not 0",
		description: "Unique ID representing the file, as random as possible."
	},
	0x47e1: {
		name: "ContentEncAlgo",
		level: 6,
		type: "u",
		mandatory: true,
		webm: true,
		"default": "0",
		description: "The encryption algorithm used. The value \"0\" means that the contents have not been encrypted."
	},
	0x47e2: {
		name: "ContentEncKeyID",
		level: 6,
		type: "b",
		webm: true,
		description: "For public key algorithms this is the ID of the public key the the data was encrypted with."
	},
	0x47e3: {
		name: "ContentSignature",
		level: 6,
		type: "b",
		maxver: 0,
		description: "A cryptographic signature of the contents."
	},
	0x47e4: {
		name: "ContentSigKeyID",
		level: 6,
		type: "b",
		maxver: 0,
		description: "This is the ID of the private key the data was signed with."
	},
	0x47e5: {
		name: "ContentSigAlgo",
		level: 6,
		type: "u",
		maxver: 0,
		"default": "0",
		description: "The algorithm used for the signature."
	},
	0x47e6: {
		name: "ContentSigHashAlgo",
		level: 6,
		type: "u",
		maxver: 0,
		"default": "0",
		description: "The hash algorithm used for the signature."
	},
	0x47e7: {
		name: "ContentEncAESSettings",
		level: 6,
		type: "m",
		minver: 4,
		webm: true,
		description: "Settings describing the encryption algorithm used. If `ContentEncAlgo` != 5 this **MUST** be ignored."
	},
	0x47e8: {
		name: "AESSettingsCipherMode",
		level: 7,
		type: "u",
		mandatory: true,
		minver: 4,
		webm: true,
		description: "The AES cipher mode used in the encryption."
	},
	0x4d80: {
		name: "MuxingApp",
		level: 2,
		type: "8",
		mandatory: true,
		description: "Muxing application or library (example: \"libmatroska-0.4.3\")."
	},
	0x4dbb: {
		name: "Seek",
		level: 2,
		type: "m",
		mandatory: true,
		multiple: true,
		description: "Contains a single seek entry to an EBML Element."
	},
	0x5031: {
		name: "ContentEncodingOrder",
		level: 5,
		type: "u",
		mandatory: true,
		webm: true,
		"default": "0",
		description: "Tells when this modification was used during encoding/muxing starting with 0 and counting upwards. The decoder/demuxer has to start with the highest order number it finds and work its way down. This value has to be unique over all ContentEncodingOrder Elements in the TrackEntry that contains this ContentEncodingOrder element."
	},
	0x5032: {
		name: "ContentEncodingScope",
		level: 5,
		type: "u",
		mandatory: true,
		webm: true,
		"default": "1",
		description: "A bit field that describes which Elements have been modified in this way. Values (big-endian) can be OR'ed."
	},
	0x5033: {
		name: "ContentEncodingType",
		level: 5,
		type: "u",
		mandatory: true,
		webm: true,
		"default": "0",
		description: "A value describing what kind of transformation is applied."
	},
	0x5034: {
		name: "ContentCompression",
		level: 5,
		type: "m",
		description: "Settings describing the compression used. This Element **MUST** be present if the value of ContentEncodingType is 0 and absent otherwise. Each block **MUST** be decompressable even if no previous block is available in order not to prevent seeking."
	},
	0x5035: {
		name: "ContentEncryption",
		level: 5,
		type: "m",
		webm: true,
		description: "Settings describing the encryption used. This Element **MUST** be present if the value of `ContentEncodingType` is 1 (encryption) and **MUST** be ignored otherwise."
	},
	0x535f: {
		name: "CueRefNumber",
		level: 5,
		type: "u",
		minver: 0,
		maxver: 0,
		"default": "1",
		range: "not 0",
		description: "Number of the referenced Block of Track X in the specified Cluster."
	},
	0x536e: {
		name: "Name",
		cppname: "TrackName",
		level: 3,
		type: "8",
		description: "A human-readable track name."
	},
	0x5378: {
		name: "CueBlockNumber",
		level: 4,
		type: "u",
		range: "not 0",
		description: "Number of the Block in the specified Cluster."
	},
	0x537f: {
		name: "TrackOffset",
		level: 3,
		type: "i",
		minver: 0,
		maxver: 0,
		"default": "0",
		description: "A value to add to the Block's Timestamp, expressed in Matroska Ticks -- ie in nanoseconds; see (#timestamp-ticks). This can be used to adjust the playback offset of a track."
	},
	0x53ab: {
		name: "SeekID",
		level: 3,
		type: "b",
		mandatory: true,
		description: "The binary ID corresponding to the Element name."
	},
	0x53ac: {
		name: "SeekPosition",
		level: 3,
		type: "u",
		mandatory: true,
		description: "The Segment Position of the Element."
	},
	0x53b8: {
		name: "StereoMode",
		cppname: "VideoStereoMode",
		level: 4,
		type: "u",
		mandatory: true,
		minver: 3,
		webm: true,
		"default": "0",
		description: "Stereo-3D video mode. There are some more details in (#multi-planar-and-3d-videos)."
	},
	0x53b9: {
		name: "OldStereoMode",
		level: 4,
		type: "u",
		maxver: 0,
		description: "DEPRECATED, DO NOT USE. Bogus StereoMode value used in old versions of libmatroska."
	},
	0x53c0: {
		name: "AlphaMode",
		cppname: "VideoAlphaMode",
		level: 4,
		type: "u",
		mandatory: true,
		minver: 3,
		webm: true,
		"default": "0",
		description: "Indicate whether the BlockAdditional Element with BlockAddID of \"1\" contains Alpha data, as defined by to the Codec Mapping for the `CodecID`. Undefined values **SHOULD NOT** be used as the behavior of known implementations is different (considered either as 0 or 1)."
	},
	0x54aa: {
		name: "PixelCropBottom",
		cppname: "VideoPixelCropBottom",
		level: 4,
		type: "u",
		mandatory: true,
		"default": "0",
		description: "The number of video pixels to remove at the bottom of the image."
	},
	0x54b0: {
		name: "DisplayWidth",
		cppname: "VideoDisplayWidth",
		level: 4,
		type: "u",
		range: "not 0",
		description: "Width of the video frames to display. Applies to the video frame after cropping (PixelCrop* Elements)."
	},
	0x54b2: {
		name: "DisplayUnit",
		cppname: "VideoDisplayUnit",
		level: 4,
		type: "u",
		mandatory: true,
		"default": "0",
		description: "How DisplayWidth & DisplayHeight are interpreted."
	},
	0x54b3: {
		name: "AspectRatioType",
		cppname: "VideoAspectRatio",
		level: 4,
		type: "u",
		minver: 0,
		maxver: 0,
		"default": "0",
		description: "Specify the possible modifications to the aspect ratio."
	},
	0x54ba: {
		name: "DisplayHeight",
		cppname: "VideoDisplayHeight",
		level: 4,
		type: "u",
		range: "not 0",
		description: "Height of the video frames to display. Applies to the video frame after cropping (PixelCrop* Elements)."
	},
	0x54bb: {
		name: "PixelCropTop",
		cppname: "VideoPixelCropTop",
		level: 4,
		type: "u",
		mandatory: true,
		"default": "0",
		description: "The number of video pixels to remove at the top of the image."
	},
	0x54cc: {
		name: "PixelCropLeft",
		cppname: "VideoPixelCropLeft",
		level: 4,
		type: "u",
		mandatory: true,
		"default": "0",
		description: "The number of video pixels to remove on the left of the image."
	},
	0x54dd: {
		name: "PixelCropRight",
		cppname: "VideoPixelCropRight",
		level: 4,
		type: "u",
		mandatory: true,
		"default": "0",
		description: "The number of video pixels to remove on the right of the image."
	},
	0x55aa: {
		name: "FlagForced",
		cppname: "TrackFlagForced",
		level: 3,
		type: "u",
		mandatory: true,
		"default": "0",
		range: "0-1",
		description: "Applies only to subtitles. Set if that track **SHOULD** be eligible for automatic selection by the player if it matches the user's language preference, even if the user's preferences would normally not enable subtitles with the selected audio track; this can be used for tracks containing only translations of foreign-language audio or onscreen text. See (#default-track-selection) for more details."
	},
	0x55ab: {
		name: "FlagHearingImpaired",
		level: 3,
		type: "u",
		minver: 4,
		range: "0-1",
		description: "Set to 1 if that track is suitable for users with hearing impairments, set to 0 if it is unsuitable for users with hearing impairments."
	},
	0x55ac: {
		name: "FlagVisualImpaired",
		level: 3,
		type: "u",
		minver: 4,
		range: "0-1",
		description: "Set to 1 if that track is suitable for users with visual impairments, set to 0 if it is unsuitable for users with visual impairments."
	},
	0x55ad: {
		name: "FlagTextDescriptions",
		level: 3,
		type: "u",
		minver: 4,
		range: "0-1",
		description: "Set to 1 if that track contains textual descriptions of video content, set to 0 if that track does not contain textual descriptions of video content."
	},
	0x55ae: {
		name: "FlagOriginal",
		level: 3,
		type: "u",
		minver: 4,
		range: "0-1",
		description: "Set to 1 if that track is in the content's original language, set to 0 if it is a translation."
	},
	0x55af: {
		name: "FlagCommentary",
		level: 3,
		type: "u",
		minver: 4,
		range: "0-1",
		description: "Set to 1 if that track contains commentary, set to 0 if it does not contain commentary."
	},
	0x55b0: {
		name: "Colour",
		cppname: "VideoColour",
		level: 4,
		type: "m",
		minver: 4,
		webm: true,
		description: "Settings describing the colour format."
	},
	0x55b1: {
		name: "MatrixCoefficients",
		cppname: "VideoColourMatrix",
		level: 5,
		type: "u",
		mandatory: true,
		minver: 4,
		webm: true,
		"default": "2",
		description: "The Matrix Coefficients of the video used to derive luma and chroma values from red, green, and blue color primaries. For clarity, the value and meanings for MatrixCoefficients are adopted from Table 4 of ISO/IEC 23001-8:2016 or ITU-T H.273."
	},
	0x55b2: {
		name: "BitsPerChannel",
		cppname: "VideoBitsPerChannel",
		level: 5,
		type: "u",
		mandatory: true,
		minver: 4,
		webm: true,
		"default": "0",
		description: "Number of decoded bits per channel. A value of 0 indicates that the BitsPerChannel is unspecified."
	},
	0x55b3: {
		name: "ChromaSubsamplingHorz",
		cppname: "VideoChromaSubsampHorz",
		level: 5,
		type: "u",
		minver: 4,
		webm: true,
		description: "The amount of pixels to remove in the Cr and Cb channels for every pixel not removed horizontally. Example: For video with 4:2:0 chroma subsampling, the ChromaSubsamplingHorz **SHOULD** be set to 1."
	},
	0x55b4: {
		name: "ChromaSubsamplingVert",
		cppname: "VideoChromaSubsampVert",
		level: 5,
		type: "u",
		minver: 4,
		webm: true,
		description: "The amount of pixels to remove in the Cr and Cb channels for every pixel not removed vertically. Example: For video with 4:2:0 chroma subsampling, the ChromaSubsamplingVert **SHOULD** be set to 1."
	},
	0x55b5: {
		name: "CbSubsamplingHorz",
		cppname: "VideoCbSubsampHorz",
		level: 5,
		type: "u",
		minver: 4,
		webm: true,
		description: "The amount of pixels to remove in the Cb channel for every pixel not removed horizontally. This is additive with ChromaSubsamplingHorz. Example: For video with 4:2:1 chroma subsampling, the ChromaSubsamplingHorz **SHOULD** be set to 1 and CbSubsamplingHorz **SHOULD** be set to 1."
	},
	0x55b6: {
		name: "CbSubsamplingVert",
		cppname: "VideoCbSubsampVert",
		level: 5,
		type: "u",
		minver: 4,
		webm: true,
		description: "The amount of pixels to remove in the Cb channel for every pixel not removed vertically. This is additive with ChromaSubsamplingVert."
	},
	0x55b7: {
		name: "ChromaSitingHorz",
		cppname: "VideoChromaSitHorz",
		level: 5,
		type: "u",
		mandatory: true,
		minver: 4,
		webm: true,
		"default": "0",
		description: "How chroma is subsampled horizontally."
	},
	0x55b8: {
		name: "ChromaSitingVert",
		cppname: "VideoChromaSitVert",
		level: 5,
		type: "u",
		mandatory: true,
		minver: 4,
		webm: true,
		"default": "0",
		description: "How chroma is subsampled vertically."
	},
	0x55b9: {
		name: "Range",
		cppname: "VideoColourRange",
		level: 5,
		type: "u",
		mandatory: true,
		minver: 4,
		webm: true,
		"default": "0",
		description: "Clipping of the color ranges."
	},
	0x55ba: {
		name: "TransferCharacteristics",
		cppname: "VideoColourTransferCharacter",
		level: 5,
		type: "u",
		mandatory: true,
		minver: 4,
		webm: true,
		"default": "2",
		description: "The transfer characteristics of the video. For clarity, the value and meanings for TransferCharacteristics are adopted from Table 3 of ISO/IEC 23091-4 or ITU-T H.273."
	},
	0x55bb: {
		name: "Primaries",
		cppname: "VideoColourPrimaries",
		level: 5,
		type: "u",
		mandatory: true,
		minver: 4,
		webm: true,
		"default": "2",
		description: "The colour primaries of the video. For clarity, the value and meanings for Primaries are adopted from Table 2 of ISO/IEC 23091-4 or ITU-T H.273."
	},
	0x55bc: {
		name: "MaxCLL",
		cppname: "VideoColourMaxCLL",
		level: 5,
		type: "u",
		minver: 4,
		webm: true,
		description: "Maximum brightness of a single pixel (Maximum Content Light Level) in candelas per square meter (cd/m^2^)."
	},
	0x55bd: {
		name: "MaxFALL",
		cppname: "VideoColourMaxFALL",
		level: 5,
		type: "u",
		minver: 4,
		webm: true,
		description: "Maximum brightness of a single full frame (Maximum Frame-Average Light Level) in candelas per square meter (cd/m^2^)."
	},
	0x55d0: {
		name: "MasteringMetadata",
		cppname: "VideoColourMasterMeta",
		level: 5,
		type: "m",
		minver: 4,
		webm: true,
		description: "SMPTE 2086 mastering data."
	},
	0x55d1: {
		name: "PrimaryRChromaticityX",
		cppname: "VideoRChromaX",
		level: 6,
		type: "f",
		minver: 4,
		webm: true,
		range: "0-1",
		description: "Red X chromaticity coordinate, as defined by CIE 1931."
	},
	0x55d2: {
		name: "PrimaryRChromaticityY",
		cppname: "VideoRChromaY",
		level: 6,
		type: "f",
		minver: 4,
		webm: true,
		range: "0-1",
		description: "Red Y chromaticity coordinate, as defined by CIE 1931."
	},
	0x55d3: {
		name: "PrimaryGChromaticityX",
		cppname: "VideoGChromaX",
		level: 6,
		type: "f",
		minver: 4,
		webm: true,
		range: "0-1",
		description: "Green X chromaticity coordinate, as defined by CIE 1931."
	},
	0x55d4: {
		name: "PrimaryGChromaticityY",
		cppname: "VideoGChromaY",
		level: 6,
		type: "f",
		minver: 4,
		webm: true,
		range: "0-1",
		description: "Green Y chromaticity coordinate, as defined by CIE 1931."
	},
	0x55d5: {
		name: "PrimaryBChromaticityX",
		cppname: "VideoBChromaX",
		level: 6,
		type: "f",
		minver: 4,
		webm: true,
		range: "0-1",
		description: "Blue X chromaticity coordinate, as defined by CIE 1931."
	},
	0x55d6: {
		name: "PrimaryBChromaticityY",
		cppname: "VideoBChromaY",
		level: 6,
		type: "f",
		minver: 4,
		webm: true,
		range: "0-1",
		description: "Blue Y chromaticity coordinate, as defined by CIE 1931."
	},
	0x55d7: {
		name: "WhitePointChromaticityX",
		cppname: "VideoWhitePointChromaX",
		level: 6,
		type: "f",
		minver: 4,
		webm: true,
		range: "0-1",
		description: "White X chromaticity coordinate, as defined by CIE 1931."
	},
	0x55d8: {
		name: "WhitePointChromaticityY",
		cppname: "VideoWhitePointChromaY",
		level: 6,
		type: "f",
		minver: 4,
		webm: true,
		range: "0-1",
		description: "White Y chromaticity coordinate, as defined by CIE 1931."
	},
	0x55d9: {
		name: "LuminanceMax",
		cppname: "VideoLuminanceMax",
		level: 6,
		type: "f",
		minver: 4,
		webm: true,
		range: ">= 0x0p+0",
		description: "Maximum luminance. Represented in candelas per square meter (cd/m^2^)."
	},
	0x55da: {
		name: "LuminanceMin",
		cppname: "VideoLuminanceMin",
		level: 6,
		type: "f",
		minver: 4,
		webm: true,
		range: ">= 0x0p+0",
		description: "Minimum luminance. Represented in candelas per square meter (cd/m^2^)."
	},
	0x55ee: {
		name: "MaxBlockAdditionID",
		level: 3,
		type: "u",
		mandatory: true,
		"default": "0",
		description: "The maximum value of BlockAddID ((#blockaddid-element)). A value 0 means there is no BlockAdditions ((#blockadditions-element)) for this track."
	},
	0x5654: {
		name: "ChapterStringUID",
		level: 4,
		type: "8",
		minver: 3,
		webm: true,
		description: "A unique string ID to identify the Chapter. Use for WebVTT cue identifier storage [@!WebVTT]."
	},
	0x56aa: {
		name: "CodecDelay",
		level: 3,
		type: "u",
		mandatory: true,
		minver: 4,
		webm: true,
		description: "CodecDelay is The codec-built-in delay, expressed in Matroska Ticks -- ie in nanoseconds; see (#timestamp-ticks). It represents the amount of codec samples that will be discarded by the decoder during playback. This timestamp value **MUST** be subtracted from each frame timestamp in order to get the timestamp that will be actually played. The value **SHOULD** be small so the muxing of tracks with the same actual timestamp are in the same Cluster."
	},
	0x56bb: {
		name: "SeekPreRoll",
		level: 3,
		type: "u",
		mandatory: true,
		minver: 4,
		webm: true,
		"default": "0",
		description: "After a discontinuity, SeekPreRoll is the duration of the data the decoder **MUST** decode before the decoded data is valid, expressed in Matroska Ticks -- ie in nanoseconds; see (#timestamp-ticks)."
	},
	0x5741: {
		name: "WritingApp",
		level: 2,
		type: "8",
		mandatory: true,
		description: "Writing application (example: \"mkvmerge-0.3.3\")."
	},
	0x5854: {
		name: "SilentTracks",
		cppname: "ClusterSilentTracks",
		level: 2,
		type: "m",
		minver: 0,
		maxver: 0,
		description: "The list of tracks that are not used in that part of the stream. It is useful when using overlay tracks on seeking or to decide what track to use."
	},
	0x58d7: {
		name: "SilentTrackNumber",
		cppname: "ClusterSilentTrackNumber",
		level: 3,
		type: "u",
		multiple: true,
		minver: 0,
		maxver: 0,
		description: "One of the track number that are not used from now on in the stream. It could change later if not specified as silent in a further Cluster."
	},
	0x61a7: {
		name: "AttachedFile",
		cppname: "Attached",
		level: 2,
		type: "m",
		mandatory: true,
		multiple: true,
		description: "An attached file."
	},
	0x6240: {
		name: "ContentEncoding",
		level: 4,
		type: "m",
		mandatory: true,
		multiple: true,
		webm: true,
		description: "Settings for one content encoding like compression or encryption."
	},
	0x6264: {
		name: "BitDepth",
		cppname: "AudioBitDepth",
		level: 4,
		type: "u",
		range: "not 0",
		description: "Bits per sample, mostly used for PCM."
	},
	0x63a2: {
		name: "CodecPrivate",
		level: 3,
		type: "b",
		description: "Private data only known to the codec."
	},
	0x63c0: {
		name: "Targets",
		cppname: "TagTargets",
		level: 3,
		type: "m",
		mandatory: true,
		webm: true,
		description: "Specifies which other elements the metadata represented by the Tag applies to. If empty or not present, then the Tag describes everything in the Segment."
	},
	0x63c3: {
		name: "ChapterPhysicalEquiv",
		level: 4,
		type: "u",
		description: "Specify the physical equivalent of this ChapterAtom like \"DVD\" (60) or \"SIDE\" (50); see (#physical-types) for a complete list of values."
	},
	0x63c4: {
		name: "TagChapterUID",
		level: 4,
		type: "u",
		multiple: true,
		"default": "0",
		description: "A unique ID to identify the Chapter(s) the tags belong to."
	},
	0x63c5: {
		name: "TagTrackUID",
		level: 4,
		type: "u",
		multiple: true,
		webm: true,
		"default": "0",
		description: "A unique ID to identify the Track(s) the tags belong to."
	},
	0x63c6: {
		name: "TagAttachmentUID",
		level: 4,
		type: "u",
		multiple: true,
		"default": "0",
		description: "A unique ID to identify the Attachment(s) the tags belong to."
	},
	0x63c9: {
		name: "TagEditionUID",
		level: 4,
		type: "u",
		multiple: true,
		"default": "0",
		description: "A unique ID to identify the EditionEntry(s) the tags belong to."
	},
	0x63ca: {
		name: "TargetType",
		cppname: "TagTargetType",
		level: 4,
		type: "s",
		webm: true,
		description: "An informational string that can be used to display the logical level of the target like \"ALBUM\", \"TRACK\", \"MOVIE\", \"CHAPTER\", etc ; see Section 6.4 of [@!MatroskaTags]."
	},
	0x6532: {
		name: "SignedElement",
		level: 2,
		type: "b",
		multiple: true,
		webm: false,
		description: "An element ID whose data will be used to compute the signature."
	},
	0x6624: {
		name: "TrackTranslate",
		level: 3,
		type: "m",
		multiple: true,
		description: "The mapping between this `TrackEntry` and a track value in the given Chapter Codec."
	},
	0x66a5: {
		name: "TrackTranslateTrackID",
		level: 4,
		type: "b",
		mandatory: true,
		description: "The binary value used to represent this `TrackEntry` in the chapter codec data. The format depends on the `ChapProcessCodecID` used; see (#chapprocesscodecid-element)."
	},
	0x66bf: {
		name: "TrackTranslateCodec",
		level: 4,
		type: "u",
		mandatory: true,
		description: "This `TrackTranslate` applies to this chapter codec of the given chapter edition(s); see (#chapprocesscodecid-element)."
	},
	0x66fc: {
		name: "TrackTranslateEditionUID",
		level: 4,
		type: "u",
		multiple: true,
		description: "Specify a chapter edition UID on which this `TrackTranslate` applies."
	},
	0x67c8: {
		name: "SimpleTag",
		cppname: "TagSimple",
		level: 3,
		type: "m",
		mandatory: true,
		multiple: true,
		webm: true,
		description: "Contains general information about the target."
	},
	0x68ca: {
		name: "TargetTypeValue",
		cppname: "TagTargetTypeValue",
		level: 4,
		type: "u",
		mandatory: true,
		webm: true,
		"default": "50",
		description: "A number to indicate the logical level of the target."
	},
	0x6911: {
		name: "ChapProcessCommand",
		cppname: "ChapterProcessCommand",
		level: 5,
		type: "m",
		multiple: true,
		description: "Contains all the commands associated to the Atom."
	},
	0x6922: {
		name: "ChapProcessTime",
		cppname: "ChapterProcessTime",
		level: 6,
		type: "u",
		mandatory: true,
		description: "Defines when the process command **SHOULD** be handled"
	},
	0x6924: {
		name: "ChapterTranslate",
		level: 2,
		type: "m",
		multiple: true,
		description: "The mapping between this `Segment` and a segment value in the given Chapter Codec."
	},
	0x6933: {
		name: "ChapProcessData",
		cppname: "ChapterProcessData",
		level: 6,
		type: "b",
		mandatory: true,
		description: "Contains the command information. The data **SHOULD** be interpreted depending on the ChapProcessCodecID value. For ChapProcessCodecID = 1, the data correspond to the binary DVD cell pre/post commands; see (#menu-features) on DVD menus."
	},
	0x6944: {
		name: "ChapProcess",
		cppname: "ChapterProcess",
		level: 4,
		type: "m",
		multiple: true,
		description: "Contains all the commands associated to the Atom."
	},
	0x6955: {
		name: "ChapProcessCodecID",
		cppname: "ChapterProcessCodecID",
		level: 5,
		type: "u",
		mandatory: true,
		"default": "0",
		description: "Contains the type of the codec used for the processing. A value of 0 means native Matroska processing (to be defined), a value of 1 means the DVD command set is used; see (#menu-features) on DVD menus. More codec IDs can be added later."
	},
	0x69a5: {
		name: "ChapterTranslateID",
		level: 3,
		type: "b",
		mandatory: true,
		description: "The binary value used to represent this Segment in the chapter codec data. The format depends on the ChapProcessCodecID used; see (#chapprocesscodecid-element)."
	},
	0x69bf: {
		name: "ChapterTranslateCodec",
		level: 3,
		type: "u",
		mandatory: true,
		description: "This `ChapterTranslate` applies to this chapter codec of the given chapter edition(s); see (#chapprocesscodecid-element)."
	},
	0x69fc: {
		name: "ChapterTranslateEditionUID",
		level: 3,
		type: "u",
		multiple: true,
		description: "Specify a chapter edition UID on which this `ChapterTranslate` applies."
	},
	0x6d80: {
		name: "ContentEncodings",
		level: 3,
		type: "m",
		webm: true,
		description: "Settings for several content encoding mechanisms like compression or encryption."
	},
	0x6de7: {
		name: "MinCache",
		cppname: "TrackMinCache",
		level: 3,
		type: "u",
		mandatory: true,
		"default": "0",
		description: "The minimum number of frames a player **SHOULD** be able to cache during playback. If set to 0, the reference pseudo-cache system is not used."
	},
	0x6df8: {
		name: "MaxCache",
		cppname: "TrackMaxCache",
		level: 3,
		type: "u",
		description: "The maximum cache size necessary to store referenced frames in and the current frame. 0 means no cache is needed."
	},
	0x6e67: {
		name: "ChapterSegmentUID",
		level: 4,
		type: "b",
		range: ">0",
		description: "The SegmentUID of another Segment to play during this chapter."
	},
	0x6ebc: {
		name: "ChapterSegmentEditionUID",
		level: 4,
		type: "u",
		range: "not 0",
		description: "The EditionUID to play from the Segment linked in ChapterSegmentUID. If ChapterSegmentEditionUID is undeclared, then no Edition of the linked Segment is used; see (#medium-linking) on medium-linking Segments."
	},
	0x6fab: {
		name: "TrackOverlay",
		level: 3,
		type: "u",
		multiple: true,
		description: "Specify that this track is an overlay track for the Track specified (in the u-integer). That means when this track has a gap, see (#silenttracks-element) on SilentTracks, the overlay track **SHOULD** be used instead. The order of multiple TrackOverlay matters, the first one is the one that **SHOULD** be used. If not found it **SHOULD** be the second, etc."
	},
	0x7373: {
		name: "Tag",
		level: 2,
		type: "m",
		mandatory: true,
		multiple: true,
		webm: true,
		description: "A single metadata descriptor."
	},
	0x7384: {
		name: "SegmentFilename",
		level: 2,
		type: "8",
		description: "A filename corresponding to this Segment."
	},
	0x73a4: {
		name: "SegmentUID",
		level: 2,
		type: "b",
		range: "not 0",
		description: "A randomly generated unique ID to identify the Segment amongst many others (128 bits)."
	},
	0x73c4: {
		name: "ChapterUID",
		level: 4,
		type: "u",
		mandatory: true,
		webm: true,
		range: "not 0",
		description: "A unique ID to identify the Chapter."
	},
	0x73c5: {
		name: "TrackUID",
		level: 3,
		type: "u",
		mandatory: true,
		range: "not 0",
		description: "A unique ID to identify the Track."
	},
	0x7446: {
		name: "AttachmentLink",
		cppname: "TrackAttachmentLink",
		level: 3,
		type: "u",
		maxver: 3,
		range: "not 0",
		description: "The UID of an attachment that is used by this codec."
	},
	0x75a1: {
		name: "BlockAdditions",
		level: 3,
		type: "m",
		webm: true,
		description: "Contain additional blocks to complete the main one. An EBML parser that has no knowledge of the Block structure could still see and use/skip these data."
	},
	0x75a2: {
		name: "DiscardPadding",
		level: 3,
		type: "i",
		minver: 4,
		webm: true,
		description: "Duration of the silent data added to the Block, expressed in Matroska Ticks -- ie in nanoseconds; see (#timestamp-ticks) (padding at the end of the Block for positive value, at the beginning of the Block for negative value). The duration of DiscardPadding is not calculated in the duration of the TrackEntry and **SHOULD** be discarded during playback."
	},
	0x7670: {
		name: "Projection",
		cppname: "VideoProjection",
		level: 4,
		type: "m",
		minver: 4,
		webm: true,
		description: "Describes the video projection details. Used to render spherical, VR videos or flipping videos horizontally/vertically."
	},
	0x7671: {
		name: "ProjectionType",
		cppname: "VideoProjectionType",
		level: 5,
		type: "u",
		mandatory: true,
		minver: 4,
		webm: true,
		"default": "0",
		description: "Describes the projection used for this video track."
	},
	0x7672: {
		name: "ProjectionPrivate",
		cppname: "VideoProjectionPrivate",
		level: 5,
		type: "b",
		minver: 4,
		webm: true,
		description: "Private data that only applies to a specific projection.  *  If `ProjectionType` equals 0 (Rectangular), then this element must not be present. *  If `ProjectionType` equals 1 (Equirectangular), then this element must be present and contain the same binary data that would be stored inside an ISOBMFF Equirectangular Projection Box ('equi'). *  If `ProjectionType` equals 2 (Cubemap), then this element must be present and contain the same binary data that would be stored inside an ISOBMFF Cubemap Projection Box ('cbmp'). *  If `ProjectionType` equals 3 (Mesh), then this element must be present and contain the same binary data that would be stored inside an ISOBMFF Mesh Projection Box ('mshp')."
	},
	0x7673: {
		name: "ProjectionPoseYaw",
		cppname: "VideoProjectionPoseYaw",
		level: 5,
		type: "f",
		mandatory: true,
		minver: 4,
		webm: true,
		"default": "0x0p+0",
		range: ">= -0xB4p+0, <= 0xB4p+0",
		description: "Specifies a yaw rotation to the projection.  Value represents a clockwise rotation, in degrees, around the up vector. This rotation must be applied before any `ProjectionPosePitch` or `ProjectionPoseRoll` rotations. The value of this element **MUST** be in the -180 to 180 degree range, both included.  Setting `ProjectionPoseYaw` to 180 or -180 degrees, with the `ProjectionPoseRoll` and `ProjectionPosePitch` set to 0 degrees flips the image horizontally."
	},
	0x7674: {
		name: "ProjectionPosePitch",
		cppname: "VideoProjectionPosePitch",
		level: 5,
		type: "f",
		mandatory: true,
		minver: 4,
		webm: true,
		"default": "0x0p+0",
		range: ">= -0x5Ap+0, <= 0x5Ap+0",
		description: "Specifies a pitch rotation to the projection.  Value represents a counter-clockwise rotation, in degrees, around the right vector. This rotation must be applied after the `ProjectionPoseYaw` rotation and before the `ProjectionPoseRoll` rotation. The value of this element **MUST** be in the -90 to 90 degree range, both included."
	},
	0x7675: {
		name: "ProjectionPoseRoll",
		cppname: "VideoProjectionPoseRoll",
		level: 5,
		type: "f",
		mandatory: true,
		minver: 4,
		webm: true,
		"default": "0x0p+0",
		range: ">= -0xB4p+0, <= 0xB4p+0",
		description: "Specifies a roll rotation to the projection.  Value represents a counter-clockwise rotation, in degrees, around the forward vector. This rotation must be applied after the `ProjectionPoseYaw` and `ProjectionPosePitch` rotations. The value of this element **MUST** be in the -180 to 180 degree range, both included.  Setting `ProjectionPoseRoll` to 180 or -180 degrees, the `ProjectionPoseYaw` to 180 or -180 degrees with `ProjectionPosePitch` set to 0 degrees flips the image vertically.  Setting `ProjectionPoseRoll` to 180 or -180 degrees, with the `ProjectionPoseYaw` and `ProjectionPosePitch` set to 0 degrees flips the image horizontally and vertically."
	},
	0x78b5: {
		name: "OutputSamplingFrequency",
		cppname: "AudioOutputSamplingFreq",
		level: 4,
		type: "f",
		range: "> 0x0p+0",
		description: "Real output sampling frequency in Hz (used for SBR techniques)."
	},
	0x7ba9: {
		name: "Title",
		level: 2,
		type: "8",
		webm: true,
		description: "General name of the Segment."
	},
	0x7d7b: {
		name: "ChannelPositions",
		cppname: "AudioPosition",
		level: 4,
		type: "b",
		minver: 0,
		maxver: 0,
		description: "Table of horizontal angles for each successive channel."
	},
	0x7e5b: {
		name: "SignatureElements",
		level: 1,
		type: "m",
		webm: false,
		description: "Contains elements that will be used to compute the signature."
	},
	0x7e7b: {
		name: "SignatureElementList",
		level: 2,
		type: "m",
		multiple: true,
		webm: false,
		i: "Cluster|Block|BlockAdditional",
		description: "A list consists of a number of consecutive elements that represent one case where data is used in signature. Ex:  means that the BlockAdditional of all Blocks in all Clusters is used for encryption."
	},
	0x7e8a: {
		name: "SignatureAlgo",
		level: 2,
		type: "u",
		webm: false,
		description: "Signature algorithm used (1=RSA, 2=elliptic)."
	},
	0x7e9a: {
		name: "SignatureHash",
		level: 2,
		type: "u",
		webm: false,
		description: "Hash algorithm used (1=SHA1-160, 2=MD5)."
	},
	0x7ea5: {
		name: "SignaturePublicKey",
		level: 2,
		type: "b",
		webm: false,
		description: "The public key to use with the algorithm (in the case of a PKI-based signature)."
	},
	0x7eb5: {
		name: "Signature",
		level: 2,
		type: "b",
		webm: false,
		description: "The signature of the data (until a new."
	},
	0x22b59c: {
		name: "Language",
		cppname: "TrackLanguage",
		level: 3,
		type: "s",
		mandatory: true,
		"default": "eng",
		description: "Specifies the language of the track in the Matroska languages form; see (#language-codes) on language codes. This Element **MUST** be ignored if the LanguageIETF Element is used in the same TrackEntry."
	},
	0x22b59d: {
		name: "LanguageIETF",
		level: 3,
		type: "s",
		minver: 4,
		description: "Specifies the language of the track according to [@!BCP47] and using the IANA Language Subtag Registry [@!IANALangRegistry]. If this Element is used, then any Language Elements used in the same TrackEntry **MUST** be ignored."
	},
	0x23314f: {
		name: "TrackTimestampScale",
		cppname: "TrackTimecodeScale",
		level: 3,
		type: "f",
		mandatory: true,
		maxver: 3,
		"default": "0x1p+0",
		range: "> 0x0p+0",
		description: "DEPRECATED, DO NOT USE. The scale to apply on this track to work at normal speed in relation with other tracks (mostly used to adjust video speed when the audio length differs)."
	},
	0x234e7a: {
		name: "DefaultDecodedFieldDuration",
		cppname: "TrackDefaultDecodedFieldDuration",
		level: 3,
		type: "u",
		minver: 4,
		range: "not 0",
		description: "The period between two successive fields at the output of the decoding process, expressed in Matroska Ticks -- ie in nanoseconds; see (#timestamp-ticks). see (#defaultdecodedfieldduration) for more information"
	},
	0x2383e3: {
		name: "FrameRate",
		cppname: "VideoFrameRate",
		level: 4,
		type: "f",
		minver: 0,
		maxver: 0,
		range: "> 0x0p+0",
		description: "Number of frames per second. This value is Informational only. It is intended for constant frame rate streams, and **SHOULD NOT** be used for a variable frame rate TrackEntry."
	},
	0x23e383: {
		name: "DefaultDuration",
		cppname: "TrackDefaultDuration",
		level: 3,
		type: "u",
		range: "not 0",
		description: "Number of nanoseconds per frame, expressed in Matroska Ticks -- ie in nanoseconds; see (#timestamp-ticks) (frame in the Matroska sense -- one Element put into a (Simple)Block)."
	},
	0x258688: {
		name: "CodecName",
		level: 3,
		type: "8",
		description: "A human-readable string specifying the codec."
	},
	0x26b240: {
		name: "CodecDownloadURL",
		level: 3,
		type: "s",
		multiple: true,
		minver: 0,
		maxver: 0,
		description: "A URL to download about the codec used."
	},
	0x2ad7b1: {
		name: "TimestampScale",
		cppname: "TimecodeScale",
		level: 2,
		type: "u",
		mandatory: true,
		"default": "1000000",
		range: "not 0",
		description: "Base unit for Segment Ticks and Track Ticks, in nanoseconds. A TimestampScale value of 1.000.000 means scaled timestamps in the Segment are expressed in milliseconds; see (#timestamps) on how to interpret timestamps."
	},
	0x2ad7b2: {
		name: "TimecodeScaleDenominator",
		level: 2,
		type: "u",
		mandatory: true,
		minver: 4,
		"default": "1000000000",
		description: "Timestamp scale numerator, see TimecodeScale."
	},
	0x2eb524: {
		name: "UncompressedFourCC",
		cppname: "VideoColourSpace",
		level: 4,
		type: "b",
		description: "Specify the uncompressed pixel format used for the Track's data as a FourCC. This value is similar in scope to the biCompression value of AVI's `BITMAPINFO` [@?AVIFormat]. See the YUV video formats [@?FourCC-YUV] and RGB video formats [@?FourCC-RGB] for common values."
	},
	0x2fb523: {
		name: "GammaValue",
		cppname: "VideoGamma",
		level: 4,
		type: "f",
		minver: 0,
		maxver: 0,
		range: "> 0x0p+0",
		description: "Gamma Value."
	},
	0x3a9697: {
		name: "CodecSettings",
		level: 3,
		type: "8",
		minver: 0,
		maxver: 0,
		description: "A string describing the encoding setting used."
	},
	0x3b4040: {
		name: "CodecInfoURL",
		level: 3,
		type: "s",
		multiple: true,
		minver: 0,
		maxver: 0,
		description: "A URL to find information about the codec used."
	},
	0x3c83ab: {
		name: "PrevFilename",
		level: 2,
		type: "8",
		description: "A filename corresponding to the file of the previous Linked Segment."
	},
	0x3cb923: {
		name: "PrevUID",
		level: 2,
		type: "b",
		description: "A unique ID to identify the previous Segment of a Linked Segment (128 bits)."
	},
	0x3e83bb: {
		name: "NextFilename",
		level: 2,
		type: "8",
		description: "A filename corresponding to the file of the next Linked Segment."
	},
	0x3eb923: {
		name: "NextUID",
		level: 2,
		type: "b",
		description: "A unique ID to identify the next Segment of a Linked Segment (128 bits)."
	},
	0x1043a770: {
		name: "Chapters",
		level: 1,
		type: "m",
		webm: true,
		description: "A system to define basic menus and partition data. For more detailed information, look at the Chapters explanation in (#chapters)."
	},
	0x114d9b74: {
		name: "SeekHead",
		level: 1,
		type: "m",
		multiple: true,
		description: "Contains the Segment Position of other Top-Level Elements."
	},
	0x1254c367: {
		name: "Tags",
		level: 1,
		type: "m",
		multiple: true,
		webm: true,
		description: "Element containing metadata describing Tracks, Editions, Chapters, Attachments, or the Segment as a whole. A list of valid tags can be found in [@!MatroskaTags]."
	},
	0x1549a966: {
		name: "Info",
		level: 1,
		type: "m",
		mandatory: true,
		description: "Contains general information about the Segment."
	},
	0x1654ae6b: {
		name: "Tracks",
		level: 1,
		type: "m",
		description: "A Top-Level Element of information with many tracks described."
	},
	0x18538067: {
		name: "Segment",
		level: 0,
		type: "m",
		mandatory: true,
		description: "The Root Element that contains all other Top-Level Elements (Elements defined only at Level 1). A Matroska file is composed of 1 Segment."
	},
	0x1941a469: {
		name: "Attachments",
		level: 1,
		type: "m",
		description: "Contain attached files."
	},
	0x1a45dfa3: {
		name: "EBML",
		level: "0",
		type: "m",
		mandatory: true,
		multiple: false,
		minver: 1,
		description: "Set the EBML characteristics of the data to follow. Each EBML document has to start with this."
	},
	0x1b538667: {
		name: "SignatureSlot",
		level: 1,
		type: "m",
		multiple: true,
		webm: false,
		description: "Contain signature of some (coming) elements in the stream."
	},
	0x1c53bb6b: {
		name: "Cues",
		level: 1,
		type: "m",
		description: "A Top-Level Element to speed seeking access. All entries are local to the Segment."
	},
	0x1f43b675: {
		name: "Cluster",
		level: 1,
		type: "m",
		multiple: true,
		description: "The Top-Level Element containing the (monolithic) Block structure."
	}
};

var byName = {};

var schema = {
	byEbmlID: byEbmlID,
	byName: byName
}

for ( var ebmlID in byEbmlID) {
	var desc = byEbmlID[ebmlID];
	byName[desc.name.replace('-', '_')] = parseInt(ebmlID, 10);
}

module.exports = schema;
