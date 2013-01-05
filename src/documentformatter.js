/**
 * DocumentFormatter - format and display a Document
 * @author Daniel Ringwalt (ringw)
 */

/**
 * Accepts document as argument and draws document in discrete blocks
 *
 * @param {Vex.Flow.Document} Document object to retrieve information from
 * @constructor
 */
Vex.Flow.DocumentFormatter = function(document) {
  if (arguments.length > 0) this.init(document);
}

Vex.Flow.DocumentFormatter.prototype.init = function(document) {
  if (typeof document != "object")
    throw new Vex.RERR("ArgumentError",
      "new Vex.Flow.DocumentFormatter() requires Document object argument");
  this.document = document;

  // Groups of measures are contained in blocks (which could correspond to a
  // line or a page of music.)
  // Each block is intended to be drawn on a different canvas.
  // Blocks must be managed by the subclass.
  this.measuresInBlock = []; // block # -> array of measure # in block
  this.blockDimensions = []; // block # -> [width, height]

  // Stave layout managed by subclass
  this.vfStaves = []; // measure # -> stave # -> VexFlow stave

  // Minimum measure widths can be used for formatting by subclasses
  this.minMeasureWidths = [];
}

/**
 * Vex.Flow.DocumentFormatter.prototype.getStaveX: to be defined by subclass
 * Params: m (measure #), s (stave #)
 * Returns: x (number)
 */

/**
 * Calculate vertical position of stave within block
 * @param {Number} Measure number
 * @param {Number} Stave number
 */
Vex.Flow.DocumentFormatter.prototype.getStaveY = function(m, s) {
  // Default behavour: calculate from stave above this one (or 0 for top stave)
  // (Have to make sure not to call getStave on this stave)
  if (s == 0) return 0;

  var higherStave = this.getStave(m, s - 1);
  return higherStave.y + higherStave.getHeight();
}

/**
 * Vex.Flow.DocumentFormatter.prototype.getStaveWidth: defined in subclass
 * Params: m (measure #), s (stave #)
 * Returns: width (number) which should be less than the minimum width
 */

/**
 * Create a Vex.Flow.Stave from a Vex.Flow.Measure.Stave.
 * @param {Vex.Flow.Measure.Stave} Original stave object
 * @param {Number} x position
 * @param {Number} y position
 * @param {Number} width of stave
 * @return {Vex.Flow.Stave} Generated stave object
 */
Vex.Flow.DocumentFormatter.prototype.createVexflowStave = function(s, x,y,w) {
  var vfStave = new Vex.Flow.Stave(x, y, w);
  s.modifiers.forEach(function(mod) {
    switch (mod.type) {
      case "clef": vfStave.addClef(mod.clef); break;
      case "key": vfStave.addKeySignature(mod.key); break;
      case "time":
        var time_sig;
        if (typeof mod.time == "string") time_sig = mod.time;
        else time_sig = mod.num_beats.toString() + "/"
                      + mod.beat_value.toString();
        vfStave.addTimeSignature(time_sig);
        break;
    }
  });
  if (typeof s.clef == "string") vfStave.clef = s.clef;
  return vfStave;
}

/**
 * Use getStaveX, getStaveY, getStaveWidth to create a Vex.Flow.Stave from
 * the document and store it in vfStaves.
 * @param {Number} Measure number
 * @param {Number} Stave number
 * @return {Vex.Flow.Stave} Stave for the measure and stave #
 */
Vex.Flow.DocumentFormatter.prototype.getStave = function(m, s) {
  if (m in this.vfStaves && s in this.vfStaves[m])
    return this.vfStaves[m][s];
  if (typeof this.getStaveX != "function"
      || typeof this.getStaveWidth != "function")
    throw new Vex.RERR("MethodNotImplemented",
                "Document formatter must implement getStaveX, getStaveWidth");
  var stave = this.document.getMeasure(m).getStave(s);
  if (! stave) return undefined;
  var vfStave = this.createVexflowStave(stave,
                                        this.getStaveX(m, s),
                                        this.getStaveY(m, s),
                                        this.getStaveWidth(m, s));
  if (! (m in this.vfStaves)) this.vfStaves[m] = [];
  this.vfStaves[m][s] = vfStave;
  return vfStave;
}

/**
 * Create a Vex.Flow.Voice from a Vex.Flow.Measure.Voice.
 * Each note is added to the proper Vex.Flow.Stave in staves
 * (spanning multiple staves in a single voice not currently supported.)
 * @param {Vex.Flow.Measure.Voice} Voice object
 * @param {Array} Vex.Flow.Staves to add the notes to
 * @return {Array} Vex.Flow.Voice and array of objects to be drawn
 */
Vex.Flow.DocumentFormatter.prototype.getVexflowVoice =function(voice, staves){
  var vfVoice = new Vex.Flow.Voice({num_beats: voice.time.num_beats,
                                  beat_value: voice.time.beat_value,
                                  resolution: Vex.Flow.RESOLUTION});
  // TODO: support spanning multiple staves
  if (typeof voice.stave != "number")
    throw new Vex.RERR("InvalidIRError", "Voice should have stave property");
  vfVoice.setStave(staves[voice.stave]);

  var vexflowObjects = new Array();
  var beamedNotes = null; // array of all vfNotes in beam
  var tiedNote = null; // only last vFNote in tie
  var clef = staves[voice.stave].clef;
  for (var i = 0; i < voice.notes.length; i++) {
    var note = voice.notes[i];
    var vfNote = this.getVexflowNote(voice.notes[i], {clef: clef});
    vfVoice.addTickable(vfNote);
    if (note.beam == "begin") beamedNotes = [vfNote];
    else if (note.beam && beamedNotes) {
      beamedNotes.push(vfNote);
      if (note.beam == "end") {
        vexflowObjects.push(new Vex.Flow.Beam(beamedNotes));
        beamedNotes = null;
      }
    }
    if (note.tie == "end" || note.tie == "continue")
      // TODO: Tie only the correct indices
      vexflowObjects.push(new Vex.Flow.StaveTie({
        first_note: tiedNote, last_note: vfNote
      }));
    if (note.tie == "begin" || note.tie == "continue") tiedNote = vfNote;
  }
  return [vfVoice, vexflowObjects];
}

/**
 * Create a Vex.Flow.StaveNote from a Vex.Flow.Measure.Note.
 * @param {Vex.Flow.Measure.Note} Note object
 * @param {Object} Options (currently only clef)
 * @return {Vex.Flow.StaveNote} StaveNote object
 */
Vex.Flow.DocumentFormatter.prototype.getVexflowNote = function(note, options) {
  var note_struct = Vex.Merge({}, options);
  note_struct.keys = note.keys;
  note_struct.duration = note.duration;
  if (note.stem_direction) note_struct.stem_direction = note.stem_direction;
  var vfNote = new Vex.Flow.StaveNote(note_struct);
  var i = 0;
  if (note.accidentals instanceof Array)
    note.accidentals.forEach(function(acc) {
      if (acc != null) vfNote.addAccidental(i, new Vex.Flow.Accidental(acc));
      i++;
    });
  var numDots = Vex.Flow.parseNoteDurationString(note.duration).dots;
  for (var i = 0; i < numDots; i++) vfNote.addDotToAll();
  return vfNote;
}

Vex.Flow.DocumentFormatter.prototype.getMinMeasureWidth = function(m) {
  if (! this.minMeasureWidths || ! (m in this.minMeasureWidths)) {
    // Calculate the maximum extra width on any stave (due to modifiers)
    var maxExtraWidth = 0;
    var measure = this.document.getMeasure(m);
    var vfStaves = measure.getStaves().map(function(stave) {
      var vfStave = this.createVexflowStave(stave, 0, 0, 500);
      var extraWidth = 500 - (vfStave.getNoteEndX()-vfStave.getNoteStartX());
      if (extraWidth > maxExtraWidth) maxExtraWidth = extraWidth;
      return vfStave;
    }, this);

    var allVfVoices = [];
    var startStave = 0; // stave for part to start on
    measure.getParts().forEach(function(part) {
      var numStaves = part.getNumberOfStaves();
      var partStaves = vfStaves.slice(startStave, numStaves);
      part.getVoices().forEach(function(voice) {
        allVfVoices.push(this.getVexflowVoice(voice, partStaves)[0]); }, this);
      startStave += numStaves;
    }, this);
    var formatter = new Vex.Flow.Formatter();
    var noteWidth = formatter.preCalculateMinTotalWidth(allVfVoices);

    // Find max tickables in any voice, add a minimum space between them
    // to get a sane min width
    var maxTickables = 0;
    allVfVoices.forEach(function(v) {
      var numTickables = v.tickables.length;
      if (numTickables > maxTickables) maxTickables = numTickables;
    });
    this.minMeasureWidths[m] = maxExtraWidth + noteWidth + maxTickables*5 + 10;
  }
  return this.minMeasureWidths[m];
};

// Internal drawing functions
// drawConnector: 0 = none, 1 = single at start, 2 = single at end,
//                4 = single connecting all parts (applies to drawMeasure),
//                8 = brace (with bitwise OR)
Vex.Flow.DocumentFormatter.prototype.drawPart =
  function(part, vfStaves, context, drawConnector) {
  var staves = part.getStaves();
  var voices = part.getVoices();

  vfStaves.forEach(function(stave) { stave.setContext(context).draw(); });
  // Draw connectors for multiple staves
  if (vfStaves.length > 1) {
    if (drawConnector & 1)
      (new Vex.Flow.StaveConnector(vfStaves[0], vfStaves[vfStaves.length-1]))
        .setType(Vex.Flow.StaveConnector.type.SINGLE)
        .setContext(context).draw();
    if (drawConnector & 2) {
      // Create dummy staves which start after these staves
      var stave1 = vfStaves[0], stave2 = vfStaves[vfStaves.length - 1];
      var dummy1 = new Vex.Flow.Stave(stave1.x + stave1.width,
                                      stave1.y, 100);
      var dummy2 = new Vex.Flow.Stave(stave2.x + stave2.width,
                                      stave2.y, 100);
      (new Vex.Flow.StaveConnector(dummy1, dummy2))
        .setType(Vex.Flow.StaveConnector.type.SINGLE)
        .setContext(context).draw();
    }
    if ((drawConnector & 8) && part.showsBrace())
      (new Vex.Flow.StaveConnector(vfStaves[0], vfStaves[vfStaves.length-1]))
        .setType(Vex.Flow.StaveConnector.type.BRACE)
        .setContext(context).draw();
  }

  var allVfObjects = new Array();
  var vfVoices = voices.map(function(voice) {
    var result = this.getVexflowVoice(voice, vfStaves);
    Array.prototype.push.apply(allVfObjects, result[1]);
    var vfVoice = result[0];
    vfVoice.tickables.forEach(function(tickable) {
      tickable.setStave(vfVoice.stave); });
    return vfVoice;
  }, this);
  var formatter = new Vex.Flow.Formatter().joinVoices(vfVoices);
  formatter.format(vfVoices, vfStaves[0].getNoteEndX()
                             - vfStaves[0].getNoteStartX() - 10);
  var i = 0;
  vfVoices.forEach(function(vfVoice) {
    vfVoice.draw(context, vfVoice.stave); });
  allVfObjects.forEach(function(obj) {
    obj.setContext(context).draw(); });
}

Vex.Flow.DocumentFormatter.prototype.drawMeasure =
  function(measure, vfStaves, context, drawConnector) {
  var startStave = 0;
  measure.getParts().forEach(function(part) {
    var numStaves = part.getNumberOfStaves();
    var partStaves = vfStaves.slice(startStave, startStave + numStaves);
    this.drawPart(part, partStaves, context, drawConnector);
    startStave += numStaves;
  }, this);
  if (vfStaves.length > 1 && (drawConnector & 4)) {
    var connector = new Vex.Flow.StaveConnector(vfStaves[0],
                                                vfStaves[vfStaves.length-1]);
    connector.setType(Vex.Flow.StaveConnector.type.SINGLE);
    connector.setContext(context).draw();
  }
}

Vex.Flow.DocumentFormatter.prototype.drawBlock = function(b, context) {
  this.getBlock(b);
  var measures = this.measuresInBlock[b];
  measures.forEach(function(m) {
    var stave = 0;
    while (this.getStave(m, stave)) stave++;
    this.drawMeasure(this.document.getMeasure(m), this.vfStaves[m], context,
                     // Always connect start of individial stave
                     // Connect end if this is the last measure
                     1 | (2*Number(m == measures[measures.length - 1]))
                     // Connect all measures (4) and draw braces (8)
                     // if this is the first measure
                     | (12*Number(m == measures[0])));
  }, this);
}

/**
 * Vex.Flow.DocumentFormatter.prototype.draw - defined in subclass
 * Render document inside HTML element, creating canvases, etc.
 * Called a second time to update as necessary if the width of the element
 * changes, etc.
 * @param {Node} HTML node to draw inside
 * @param {Object} Subclass-specific options
 */

/**
 * Vex.Flow.DocumentFormatter.Liquid - default liquid formatter
 * Fit measures onto lines with a given width, in blocks of 1 line of music
 *
 * @constructor
 */
Vex.Flow.DocumentFormatter.Liquid = function(document) {
  if (arguments.length > 0) Vex.Flow.DocumentFormatter.call(this, document);
  this.width = 500; // default value
}
Vex.Flow.DocumentFormatter.Liquid.prototype = new Vex.Flow.DocumentFormatter();
Vex.Flow.DocumentFormatter.Liquid.constructor
  = Vex.Flow.DocumentFormatter.Liquid;

Vex.Flow.DocumentFormatter.Liquid.prototype.setWidth = function(width) {
  this.width = width; return this; }

Vex.Flow.DocumentFormatter.Liquid.prototype.getBlock = function(b) {
  if (b in this.blockDimensions) return this.blockDimensions[b];

  var startMeasure = 0;
  if (b > 0) {
    this.getBlock(b - 1);
    var prevMeasures = this.measuresInBlock[b - 1];
    startMeasure = prevMeasures[prevMeasures.length - 1] + 1;
  }
  var numMeasures = this.document.getNumberOfMeasures();
  if (startMeasure >= numMeasures) return null;

  // Update modifiers for first measure
  this.document.getMeasure(startMeasure).getParts().forEach(function(part) {
    part.getStaves().forEach(function(s) {
      if (typeof s.clef == "string" && ! s.getModifier("clef")) {
        s.addModifier({type: "clef", clef: s.clef});
      }
      if (typeof s.key == "string" && ! s.getModifier("key")) {
        s.addModifier({type: "key", key: s.key});
      }
      // Time signature on first measure of piece only
      if (startMeasure == 0 && ! s.getModifier("time")) {
        if (typeof s.time_signature == "string")
          s.addModifier({type: "time", time: s.time_signature});
        else if (typeof s.time == "object")
          s.addModifier(Vex.Merge({type: "time"}, s.time));
      }
    });
  });
  
  // Store x, width of staves (y calculated automatically)
  if (! this.measureX) this.measureX = new Array();
  if (! this.measureWidth) this.measureWidth = new Array();

  // Calculate start x (15 if there are braces, 10 otherwise)
  var start_x = 10;
  this.document.getMeasure(startMeasure).getParts().forEach(function(part) {
    if (part.showsBrace()) start_x = 15;
  });

  if (this.getMinMeasureWidth(startMeasure) + start_x + 10 >= this.width) {
    // Use only this measure and the minimum possible width
    var block = [this.getMinMeasureWidth(startMeasure) + start_x + 10, 0];
    this.blockDimensions[b] = block;
    this.measuresInBlock[b] = [startMeasure];
    this.measureX[startMeasure] = start_x;
    this.measureWidth[startMeasure] = block[0] - start_x - 10;
  }
  else {
    var curMeasure = startMeasure;
    var width = start_x + 10;
    while (width < this.width && curMeasure < numMeasures) {
      width += this.getMinMeasureWidth(curMeasure);
      curMeasure++;
    }
    var endMeasure = curMeasure - 1;
    var measureRange = [];
    for (var m = startMeasure; m <= endMeasure; m++) measureRange.push(m);
    this.measuresInBlock[b] = measureRange;

    // Allocate width to measures
    var remainingWidth = this.width - start_x - 10;
    for (var m = startMeasure; m <= endMeasure; m++) {
      // Set each width to the minimum
      this.measureWidth[m] = Math.ceil(this.getMinMeasureWidth(m));
      remainingWidth -= this.measureWidth[m];
    }
    // Split rest of width evenly
    var extraWidth = Math.floor(remainingWidth / (endMeasure-startMeasure+1));
    for (var m = startMeasure; m <= endMeasure; m++)
      this.measureWidth[m] += extraWidth;
    remainingWidth -= extraWidth * (endMeasure - startMeasure + 1);
    this.measureWidth[startMeasure] += remainingWidth; // Add remainder
    // Calculate x value for each measure
    this.measureX[startMeasure] = start_x;
    for (var m = startMeasure + 1; m <= endMeasure; m++)
      this.measureX[m] = this.measureX[m-1] + this.measureWidth[m-1];
    this.blockDimensions[b] = [this.width, 0];
  }

  // Calculate height of first measure, use as total height
  var i = 0;
  var lastStave = undefined;
  var stave = this.getStave(startMeasure, 0);
  while (stave) {
    lastStave = stave;
    i++;
    stave = this.getStave(startMeasure, i);
  }
  var height = this.getStaveY(startMeasure, i-1) + lastStave.getHeight();
  this.blockDimensions[b][1] = height;

  return this.blockDimensions[b];
}

Vex.Flow.DocumentFormatter.Liquid.prototype.getStaveX = function(m, s) {
  if (! (m in this.measureX))
    throw new Vex.RERR("FormattingError",
                "Creating stave for measure which does not belong to a block");
  return this.measureX[m];
}

Vex.Flow.DocumentFormatter.Liquid.prototype.getStaveWidth = function(m, s) {
  if (! (m in this.measureWidth))
    throw new Vex.RERR("FormattingError",
                "Creating stave for measure which does not belong to a block");
  return this.measureWidth[m];
}

Vex.Flow.DocumentFormatter.Liquid.prototype.draw = function(elem, options) {
  if (this._htmlElem != elem) {
    this._htmlElem = elem;
    elem.innerHTML = "";
    this.canvases = [];
  }
  var width = $(elem).width(); // TODO: can we use jQuery?
  if (typeof width == "number") {
    if (width != this.width) {
      // Invalidate all blocks/staves/voices
      this.measuresInBlock = [];
      this.blockDimensions = [];
      this.vfStaves = [];
      this.measureX = [];
      this.measureWidth = [];
    }
    this.setWidth(width);
  }
  var b = 0;
  while (this.getBlock(b)) {
    var canvas, context;
    if (! this.canvases[b]) {
      canvas = document.createElement('canvas');
      canvas.width = this.blockDimensions[b][0];
      canvas.height = this.blockDimensions[b][1];
      if (typeof elem.id == "string")
        canvas.id = elem.id + "_canvas" + b.toString();
      // If a canvas exists after this one, insert before that canvas
      for (var a = b + 1; this.getBlock(a); a++)
        if (typeof this.canvases[a] == "object") {
          elem.insertBefore(canvas, this.canvases[a]);
          break;
        }
      if (! canvas.parentNode)
        elem.appendChild(canvas); // Insert at the end of elem
      this.canvases[b] = canvas;
      context = canvas.getContext("2d");
    }
    else {
      canvas = this.canvases[b];
      canvas.width = this.width;
      var context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    this.drawBlock(b, context);
    b++;
  }
  // TODO: remove old canvases/other elements
}
