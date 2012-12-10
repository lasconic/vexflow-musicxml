/**
 * VexFlow - Document Tests (JSON, MusicXML and TabDiv)
 * @author Daniel Ringwalt (ringw)
 */

Vex.Flow.Test.Document = {};

Vex.Flow.Test.Document.Start = function() {
  module("Document");
  Vex.Flow.Test.runTest("Auto-generated Measure Test",
                        Vex.Flow.Test.Document.measure);
  Vex.Flow.Test.runTest("Basic JSON IR Test", Vex.Flow.Test.Document.jsonSimple);
  Vex.Flow.Test.runTest("Complex JSON IR Test", Vex.Flow.Test.Document.jsonComplex);
  Vex.Flow.Test.runTest("Basic MusicXML Test", Vex.Flow.Test.Document.xmlSimple);
  //Vex.Flow.Test.runTest("MusicXML Document Test", Vex.Flow.Test.Document.xmlDoc);
};

Vex.Flow.Test.Document.measure = function(options, contextBuilder) {
  expect(11);
  // Custom backend programmatically generates measures
  var CustomBackend = function() {};
  CustomBackend.appearsValid = function(arg) { return true; };
  CustomBackend.prototype.parse = function(arg) { };
  CustomBackend.prototype.isValid = function() { return true; };
  CustomBackend.prototype.getNumberOfMeasures = function() { return 1; };
  CustomBackend.prototype.getMeasure = function(i) {
    var measure = new Vex.Flow.Measure({time: {num_beats: 4, beat_value: 4}});
    measure.addNote({keys: ["c/4"], duration: "4"});
    measure.addNote({keys: ["d/4"], duration: "4"});
    measure.addNote({keys: ["e/4"], duration: "4"});
    measure.addNote({keys: ["f/4"], duration: "4"});
    ok(true, "added notes to measure");
    return measure;
  };
  // argument must evaluate to true
  var doc = new Vex.Flow.Document({}, {backend: CustomBackend});
  ok(doc instanceof Vex.Flow.Document, "created document");
  ok(doc.getNumberOfMeasures() == 1, "correct number of measures");
  var measure = doc.getMeasure(0);
  ok(measure instanceof Vex.Flow.Measure, "created measure");
  ok(measure.getNumberOfParts() == 1, "measure has correct # parts");
  var part = measure.getPart(0);
  ok(part instanceof Vex.Flow.Measure.Part, "part from measure");
  ok(measure.getNumberOfStaves() == 1, "measures has correct # staves");
  var stave = measure.getStave(0);
  ok(stave instanceof Vex.Flow.Measure.Stave, "stave from measure");

  ok(part.getNumberOfVoices() == 1, "part has correct # voices");
  var voice = part.getVoice(0);
  ok(voice instanceof Vex.Flow.Measure.Voice, "voice from part");

  var ctx = new contextBuilder(options.canvas_sel, 300, 120);
  doc.draw({x: 0, y: 0, width: 300, height: 120, context: ctx});
  ok(true, "drew document");
}

Vex.Flow.Test.Document.jsonSimple = function(options, contextBuilder) {
  expect(4);
  var jsonDoc = {type: "document", measures: [
   {type: "measure", time: {num_beats: 4, beat_value: 4},
    parts: [
     {type: "part", time: {num_beats: 4, beat_value: 4},
      voices: [
       {type: "voice", time: {num_beats: 4, beat_value: 4},
        notes: [
         {type: "note", keys: ["c/4"], duration: "1", stem_direction: -1}
        ]},
       {type: "voice", time: {num_beats: 4, beat_value: 4},
        notes: [
         {type: "note", keys: ["g/4"], duration: "4"},
         {type: "note", keys: ["a/4"], duration: "4"},
         {type: "note", keys: ["b/4"], duration: "8", beam: "begin",
          stem_direction: -1},
         {type: "note", keys: ["c/5"], duration: "8", stem_direction: -1},
         {type: "note", keys: ["d/5"], duration: "16", stem_direction: -1},
         {type: "note", keys: ["e/5"], duration: "16", stem_direction: -1},
         {type: "note", keys: ["f/5"], duration: "8", beam: "end",
          stem_direction: -1}
        ]}
      ]}
    ]}
  ]};
  var doc = new Vex.Flow.Document(jsonDoc);
  ok(doc instanceof Vex.Flow.Document, "created document");
  ok(doc.getNumberOfMeasures() == 1, "correct number of measures");
  var measure = doc.getMeasure(0);
  ok(measure instanceof Vex.Flow.Measure, "created measure");

  var ctx = new contextBuilder(options.canvas_sel, 300, 120);
  doc.draw({x: 0, y: 0, width: 300, height: 120, context: ctx});
  ok(true, "drew document");
}

Vex.Flow.Test.Document.jsonComplex = function(options, contextBuilder) {
  expect(4);
  var jsonDoc = {type: "document", measures: [
   {type: "measure", time: {num_beats: 4, beat_value: 4},
    parts: [
     {type: "part", time: {num_beats: 4, beat_value: 4},
      staves: [
       {type: "stave", time: {num_beats: 4, beat_value: 4}, clef: "treble"},
       {type: "stave", time: {num_beats: 4, beat_value: 4}, clef: "treble"}
      ],
      voices: [
       {type: "voice", time: {num_beats: 4, beat_value: 4}, stave: 1,
        notes: [
         {type: "note", keys: ["c/4"], duration: "1", stem_direction: -1}
        ]},
       {type: "voice", time: {num_beats: 4, beat_value: 4}, stave: 1,
        notes: [
         {type: "note", keys: ["g/4"], duration: "4"},
         {type: "note", keys: ["a/4"], duration: "4"},
         {type: "note", keys: ["b/4"], duration: "4"},
         {type: "note", keys: ["c/5"], duration: "4"}
        ]},
       {type: "voice", time: {num_beats: 4, beat_value: 4}, stave: 0,
        notes: [
         {type: "note", keys: ["g/4"], duration: "4"},
         {type: "note", keys: ["a/4"], duration: "4"},
         {type: "note", keys: ["b/4"], duration: "8", beam: "begin",
          stem_direction: -1},
         {type: "note", keys: ["c/5"], duration: "8", stem_direction: -1},
         {type: "note", keys: ["d/5"], duration: "16", stem_direction: -1},
         {type: "note", keys: ["e/5"], duration: "16", stem_direction: -1},
         {type: "note", keys: ["f/5"], duration: "8", beam: "end",
          stem_direction: -1}
        ]}
      ]}
    ]}
  ]};
  var doc = new Vex.Flow.Document(jsonDoc);
  ok(doc instanceof Vex.Flow.Document, "created document");
  ok(doc.getNumberOfMeasures() == 1, "correct number of measures");
  var measure = doc.getMeasure(0);
  ok(measure instanceof Vex.Flow.Measure, "created measure");

  var ctx = new contextBuilder(options.canvas_sel, 300, 220);
  doc.draw({x: 0, y: 0, width: 300, height: 120, context: ctx});
  ok(true, "drew document");
}

Vex.Flow.Test.Document.xmlSimple = function(options, contextBuilder) {
  expect(2);

  var docString = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\
<!DOCTYPE score-partwise PUBLIC\
    "-//Recordare//DTD MusicXML 3.0 Partwise//EN"\
    "http://www.musicxml.org/dtds/partwise.dtd">\
<score-partwise version="3.0">\
  <part-list>\
    <score-part id="P1">\
      <part-name>Music</part-name>\
    </score-part>\
  </part-list>\
  <part id="P1">\
    <measure number="1">\
      <attributes>\
        <divisions>1</divisions>\
        <key>\
          <fifths>0</fifths>\
        </key>\
        <time>\
          <beats>4</beats>\
          <beat-type>4</beat-type>\
        </time>\
        <clef>\
          <sign>G</sign>\
          <line>2</line>\
        </clef>\
      </attributes>\
      <note>\
        <pitch>\
          <step>C</step>\
          <octave>4</octave>\
        </pitch>\
        <duration>4</duration>\
        <type>whole</type>\
      </note>\
    </measure>\
  </part>\
</score-partwise>';
  var doc = new Vex.Flow.Document(docString);
  ok(true, "created document");

  var ctx = new contextBuilder(options.canvas_sel, 300, 120);
  doc.draw({x: 0, y: 0, width: 300, height: 120, context: ctx});
  ok(true, "drew document");
}
Vex.Flow.Test.Document.Fetch = function(uri) {
  var req = new XMLHttpRequest();
  req.open('GET', uri, false);
  req.send(null);
  if (req.readyState != 4) return undefined;
  return req.responseText;
};
Vex.Flow.Test.Document.xmlDoc = function(options, contextBuilder) {
  var docString;
  try {
    docString = Vex.Flow.Test.Document.Fetch("support/bach_bwv846p.xml");
  }
  catch (e) {
    ok(true, "Skipping test; browser does not support local file:// AJAX");
    return;
  }
  if (! docString) {
    ok(false, "Document support/bach_bwv846p.xml does not exist");
    return;
  }
  expect(2);
  var doc = new Vex.Flow.Document(docString);
  ok(true, "created document");

  var ctx = new contextBuilder(options.canvas_sel, 300, 120);
  doc.draw({x: 0, y: 0, width: 300, height: 120, context: ctx});
  ok(true, "drew document");
};
