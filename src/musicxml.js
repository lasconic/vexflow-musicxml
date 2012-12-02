/**
 * VexFlow MusicXML - A DOM-based parser for MusicXML.
 * @author Daniel Ringwalt (ringw)
 */

if (! Vex.Flow.Backend) Vex.Flow.Backend = {};

/** @constructor */
Vex.Flow.Backend.MusicXML = function() {
  this.partList = new Array();

  // Create timewise array of arrays
  // Measures (zero-indexed) -> array of <measure> elements for each part
  this.measures = new Array();
}

/**
 * Parse an XML string, or "parse" an existing DOM Document object.
 * If the parse fails, a Vex.RuntimeError is thrown.
 * Upon success, no exception is thrown and #isValid returns true.
 *
 * @param data The MusicXML data to parse.
 */
Vex.Flow.Backend.MusicXML.prototype.parse = function(data) {
  if (typeof data == "string") {
    // Parse XML string
    if (window.DOMParser && typeof XMLDocument != "undefined") {
      this.document = (new window.DOMParser()).parseFromString(data, "text/xml"); }
    else if (window.ActiveXObject && new window.ActiveXObject("Microsoft.XMLDOM")) {
      this.document = new window.ActiveXObject("Microsoft.XMLDOM");
      this.document.async = "false";
      this.document.loadXML(data);
    }
    else { throw new Vex.RERR("UnsupportedBrowserError", "No XML parser found"); }
  }
  else if (data instanceof Document) this.document = data;
  else {
    this.valid = false;
    throw new Vex.RERR("ArgumentError",
                       "MusicXML requires XML string or DOM Document object");
  }
  this.documentElement = this.document.documentElement;
  if (this.documentElement.nodeName != 'score-partwise')
    throw new Vex.RERR("ArgumentError", "VexFlow only supports partwise scores");

  // Go through each part, pushing the measures on the correct sub-array
  var partNum = 0;
  for (var i = 0; i < this.documentElement.childNodes.length; i++) {
    var node = this.documentElement.childNodes[i];
    if (node.tagName == "part") {
      var measureNum = 0;
      for (var j = 0; j < node.childNodes.length; j++) {
        var measure = node.childNodes[measureNum];
        if (measure.tagName != "measure") continue;
        if (! (j in this.measures)) this.measures[measureNum] = new Array();
        if (this.measures[measureNum].length != partNum) {
          // Some part is missing a measure
          this.valid = false;
          return;
        }
        this.measures[measureNum][partNum] = measure;
        measureNum++;
      }
      partNum++;
    }
  }

  this.valid = true;
}

/**
 * Class method.
 * Returns true if the argument appears to be valid MusicXML.
 * Used when automatically detecting MusicXML.
 *
 * @return {Boolean} True if data looks like valid MusicXML.
 */
Vex.Flow.Backend.MusicXML.appearsValid = function(data) {
  if (typeof data == "string") {
    return data.search(/<score-partwise/i) != -1;
  }
  return (data instanceof Document) &&
         (data.documentElement.nodeName == 'score-partwise');
}

/**
 * Returns true if the passed-in code parsed without errors.
 *
 * @return {Boolean} True if code is error-free.
 */
Vex.Flow.Backend.MusicXML.prototype.isValid = function() { return this.valid; }

/**
 * Number of measures in the document
 *
 * @return {Number} Total number of measures
 */
Vex.Flow.Backend.MusicXML.prototype.getNumberOfMeasures = function() {
  return this.measures.length;
}

/**
 * Create the ith measure from this.measures[i]
 *
 * @return {Vex.Flow.Measure} ith measure as a Measure object
 */
Vex.Flow.Backend.MusicXML.prototype.getMeasure = function(i) {
  var measure = new Vex.Flow.Measure({num_beats: 4, beat_value: 4});
  // FIXME: Initialize measure with the correct information
  return measure;
}
