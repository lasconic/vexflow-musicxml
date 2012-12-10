/**
 * VexFlow MusicXML - DOM-based MusicXML backend for VexFlow Documents.
 * @author Daniel Ringwalt (ringw)
 */

if (! Vex.Flow.Backend) Vex.Flow.Backend = {};

/** @constructor */
Vex.Flow.Backend.MusicXML = function() {
  this.partList = new Array();

  // Create timewise array of arrays
  // Measures (zero-indexed) -> array of <measure> elements for each part
  this.measures = new Array();

  // Store number of staves for each part (zero-indexed)
  this.numStaves = new Array();

  // Track every child of any <attributes> element in array
  // (except <staves> which is stored in numStaves)
  // Measures -> parts ->
  //  object where keys are names of child elements ->
  //    data representing the attribute
  this.attributes = new Array();
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
    if (node.nodeName == "part") {
      var measureNum = 0;
      for (var j = 0; j < node.childNodes.length; j++) {
        var measure = node.childNodes[j];
        if (measure.nodeName != "measure") continue;
        if (! (j in this.measures)) this.measures[measureNum] = new Array();
        if (this.measures[measureNum].length != partNum) {
          // Some part is missing a measure
          this.valid = false;
          return;
        }
        this.measures[measureNum][partNum] = measure;
        var attributes = measure.getElementsByTagName("attributes")[0];
        if (attributes) {
          var attrObject = {};
          var attrs = attributes.childNodes;
          for (var a = 0; a < attrs.length; a++) {
            switch (attrs[a].nodeName) {
              case "staves":
                // If this is the first measure, we use <staves>
                if (measureNum == 0)
                  this.numStaves[partNum] = parseInt(attrs[a].textContent);
                break;
              case "key":
                attrObject.key = {
                  fifths: parseInt(attrs[a].getElementsByTagName("fifths")[0]
                                           .textContent)
                };
                break;
              case "time":
                attrObject.time = {
                  num_beats: parseInt(attrs[a].getElementsByTagName("beats")[0]
                                              .textContent),
                  beat_value: parseInt(attrs[a].getElementsByTagName("beat-type")[0]
                                               .textContent)
                };
                break;
              case "clef":
                attrObject.time = {
                  sign: attrs[a].getElementsByTagName("sign")[0].textContent };
                break;
              case "divisions":
                attrObject.divisions = parseInt(attrs[a].textContent);
                break;
            }
            if (! (measureNum in this.attributes))
              this.attributes[measureNum] = [];
            if (! (partNum in this.attributes[measureNum]))
              this.attributes[measureNum][partNum] = {};
            this.attributes[measureNum][partNum][attrs[a].nodeName] = attrObject;
          }
        }
        measureNum++;
      }
      // numStaves defaults to 1 for this part
      if (! (partNum in this.numStaves))
        this.numStaves[partNum] = 1;
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
 * Create the mth measure from this.measures[m]
 *
 * @return {Vex.Flow.Measure} mth measure as a Measure object
 */
Vex.Flow.Backend.MusicXML.prototype.getMeasure = function(m) {
  var measure = new Vex.Flow.Measure({time: {num_beats: 4, beat_value: 4}});
  var numParts = this.measures[m].length;
  measure.setNumberOfParts(numParts);
  for (var p = 0; p < numParts; p++) {
    var part = measure.getPart(p);
    var attrs = this.getAttributes(m, p);
    part.setNumberOfStaves(this.numStaves[p]);
    var numVoices = 1; // can expand dynamically
    var noteElems = this.measures[m][p].getElementsByTagName("note");
    var voiceObjects = new Array(); // array of arrays
    for (var i = 0; i < noteElems.length; i++) {
      // FIXME: Chord support
      var noteObj = this.parseNoteElem(noteElems[i], attrs);
      var voice = 0;
      if (noteObj.voice) {
        if (noteObj.voice >= numVoices) part.setNumberOfVoices(noteObj.voice + 1);
        voice = noteObj.voice;
        delete noteObj.voice;
      }
      part.getVoice(voice).addNote(new Vex.Flow.Measure.Note(noteObj));
    }
  }
  return measure;
}

/**
 * Returns complete attributes object for measure m, part p (zero-indexed)
 */
Vex.Flow.Backend.MusicXML.prototype.getAttributes = function(m, p) {
  var attrs = {};
  // Merge with every previous attributes object in order
  for (var i = 0; i <= m; i++) {
    if (! (i in this.attributes)) continue;
    if (! (p in this.attributes[i])) continue;
    Vex.Merge(attrs, this.attributes[i][p]);
  }
  return attrs;
}

/**
 * Converts keys as fifths (e.g. -2 for Bb) to the equivalent major key ("Bb").
 * @param {Number} number of fifths from -7 to 7
 * @return {String} string representation of key
 */
Vex.Flow.Backend.MusicXML.prototype.fifthsToKey = function(fifths) {
  // Find equivalent key in Vex.Flow.keySignature.keySpecs
  for (var i in Vex.Flow.keySignature.keySpecs) {
    var spec = Vex.Flow.keySignature.keySpecs[i];
    if (typeof spec != "object" || ! ("acc" in spec) || ! ("num" in spec))
      continue;
    if (   (fifths < 0 && spec.acc == "b" && spec.num == Math.abs(fifths))
        || (fifths >= 0 && spec.acc != "b" && spec.num == fifths)) return i;
  }
}

Vex.Flow.Backend.MusicXML.prototype.parseNoteElem = function(noteElem, attrs) {
  var step, octave, accidental, type, isRest, duration, ticks, voice;
  var elems = noteElem.childNodes;
  for (var j = 0; j < elems.length; j++)
    switch (elems[j].nodeName) {
      case "pitch":
        step = elems[j].getElementsByTagName("step")[0].textContent;
        octave = parseInt(elems[j].getElementsByTagName("octave")[0].textContent);
        var alter = elems[j].getElementsByTagName("alter")[0];
        if (alter && ! accidental)
          switch (parseInt(alter.textContent)) {
            case 1: accidental = "#"; break;
            case 2: accidental = "##"; break;
            case -1: accidental = "b"; break;
            case -2: accidental = "bb"; break;
          }
        break;
      case "type":
        var type = elems[j].textContent;
        // Look up type
        duration = {
          whole: "1", half: "2", quarter: "4", eighth: "8",
          "16th": "16", "32nd": "32", "64th": "64", "128th": "128", "256th": "256"
        }[type];
        break;
      case "duration":
        // TODO: come up with duration string if we don't have a type
        break;
      case "rest": isRest = true; break;
    }
  var noteObj = {};
  if (isRest) {
    noteObj.keys = ["g/4"]; // TODO: correct display pitch
    noteObj.duration = duration + "r";
  }
  else {
    var pitch = step;
    if (accidental) pitch += accidental;
    pitch += "/" + octave.toString();
    noteObj.keys = [pitch];
    noteObj.duration = duration;
  }
  return noteObj;
}
