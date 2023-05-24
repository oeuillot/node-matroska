const convert = require("xml-js"),
  fs = require("fs")

const mapType = type => {
  switch(type) {
    case "binary":
      return "b";
    case "date":
      return "d";
    case "float":
      return "f";
    case "integer":
      return "i";
    case "master":
      return "m";
    case "string":
      return "s";
    case "uinteger":
      return "u";
    case "utf-8":
      return "8";
    default:
      throw `Type ${type} not found`;
  }
}

fs.readFile("ebml_matroska.xml", (err, xml) => {
  if (err) throw err;
  const json = convert.xml2js(xml, {compact: true})

  var out = {}
  for (element of json.EBMLSchema.element) {
    const key = parseInt(element._attributes["id"], 16)

    const docs = "documentation" in element
      ? (Array.isArray(element.documentation) ? element.documentation : [element.documentation])
      : []
    const extensions = "extension" in element
      ? (Array.isArray(element.extension) ? element.extension : [element.extension])
      : []

    let value = {}
    value["name"] = element._attributes["name"]
    for (ext of extensions) {
      if (ext._attributes.type == "libmatroska" && ("cppname" in ext._attributes)) {
        value["cppname"] = ext._attributes.cppname
      }
    }
    value["level"] = element._attributes["path"].split("\\").length - 2
    value["type"] = mapType(element._attributes["type"])
    if ("minOccurs" in element._attributes && element._attributes.minOccurs == 1) {
      value["mandatory"] = true
    }
    if (!("maxOccurs" in element._attributes) || element._attributes.maxOccurs > 1) {
      value["multiple"] = true
    }
    for (attr of ["minver", "maxver"]) {
      if (attr in element._attributes) {
        value[attr] = parseInt(element._attributes[attr])
      }
    }
    for (ext of extensions) {
      if (ext._attributes.type == "webmproject.org" && ext._attributes.webm == "1") {
        value["webm"] = true
      }
      if (ext._attributes.type == "divx.com" && ext._attributes.divx == "1") {
        value["divx"] = true
      }
    }
    for (attr of ["default", "range"]) {
      if (attr in element._attributes) {
        value[attr] = element._attributes[attr]
      }
    }
    for (doc of docs) {
      if (doc._attributes.purpose == "definition") {
        value["description"] = doc._text.replace("\n", " ")
      }
    }

    out[key] = value
  }

  console.log(JSON.stringify(out))
})
