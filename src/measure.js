/**
 * Measure - intermediate representation of measures of a Vex.Flow.Document
 * @author Daniel Ringwalt (ringw)
 */

/** @constructor */
Vex.Flow.Measure = function(object) {
  if (typeof object != "object")
    throw new Vex.RERR("ArgumentError", "Invalid argument to Vex.Flow.Measure");
  if (! object.time || ! object.time.num_beats || ! object.time.beat_value)
    throw new Vex.RERR("ArgumentError",
              "Measure must be initialized with nonzero num_beats and beat_value");
  this.time = object.time;

  // Default values
  this.attributes = {};
  this.parts = new Array();
  if (object.parts instanceof Array) {
    this.parts.length = object.parts.length;
    for (var i = 0; i < object.parts.length; i++)
      this.parts[i] = new Vex.Flow.Measure.Part(object.parts[i]);
  }
  this.type = "measure";
}

Vex.Flow.Measure.prototype.setAttributes = function(attributes) {
  Vex.Merge(this.attributes, attributes);
}

Vex.Flow.Measure.prototype.getNumberOfParts = function(numParts) {
  return this.parts.length;
}
Vex.Flow.Measure.prototype.setNumberOfParts = function(numParts) {
  this.parts.length = numParts;
}

Vex.Flow.Measure.prototype.getPart = function(partNum) {
  return this.parts[partNum];
}
Vex.Flow.Measure.prototype.setPart = function(partNum, part) {
  if (this.parts.length <= partNum)
    throw new Vex.RERR("ArgumentError", "Call setNumberOfParts before adding part");
  this.parts[partNum] = new Vex.Flow.Measure.Part(part);
}

/**
 * Vex.Flow.Measure.Part - a single part (which may include multiple staves/voices)
 * @constructor
 */
Vex.Flow.Measure.Part = function(object) {
  if (typeof object != "object")
    throw new Vex.RERR("ArgumentError", "Invalid argument to constructor");
  if (! object.time || ! object.time.num_beats || ! object.time.beat_value)
    throw new Vex.RERR("ArgumentError",
                       "Constructor requires nonzero num_beats and beat_value");
  this.time = object.time;
  if (object.voices instanceof Array) {
    this.voices = new Array(object.voices.length);
    for (var i = 0; i < object.voices.length; i++)
      this.voices[i] = new Vex.Flow.Measure.Voice(object.voices[i]);
  }
  else this.voices = new Array();

  this.type = "part";
}

/**
 * Vex.Flow.Measure.Voice - a voice which contains notes, etc
 * @constructor
 */
Vex.Flow.Measure.Voice = function(object) {
  if (typeof object != "object")
    throw new Vex.RERR("ArgumentError", "Invalid argument to constructor");
  if (! object.time || ! object.time.num_beats || ! object.time.beat_value)
    throw new Vex.RERR("ArgumentError",
                       "Constructor requires nonzero num_beats and beat_value");
  this.time = object.time;
  // etc
  if (object.notes instanceof Array) {
    this.notes = new Array(object.notes.length);
    for (var i = 0; i < object.notes.length; i++)
      this.notes[i] = new Vex.Flow.Measure.Note(object.notes[i]);
  }
  else this.notes = new Array();

  this.type = "voice";
}

/**
 * Vex.Flow.Measure.Stave - represent one "stave" for one measure
 * (corresponds to a Vex.Flow.Stave)
 * @constructor
 */
Vex.Flow.Measure.Stave = function(object) {
  if (typeof object != "object")
    throw new Vex.RERR("ArgumentError", "Invalid argument to constructor");
  if (! object.time || ! object.time.num_beats || ! object.time.beat_value)
    throw new Vex.RERR("ArgumentError",
                       "Constructor requires nonzero num_beats and beat_value");
  this.time = object.time;
  this.modifiers = new Array();
  if (object.modifiers instanceof Array) {
    for (var i = 0; i < object.modifiers.length; i++)
      this.addModifier(object.modifiers[i]);
  }

  this.type = "stave";
}
/**
 * Adds a modifier (clef, etc.), which is just a plain object with a type
 * and other properties.
 */
Vex.Flow.Measure.Stave.prototype.addModifier = function(modifier) {
  // TODO: Verify that the modifier is correct
  this.modifiers.push(modifier);
}

/**
 * Vex.Flow.Measure.Note - a single note (includes chords, rests, etc.)
 * @constructor
 */
Vex.Flow.Measure.Note = function(object) {
  if (typeof object != "object")
    throw new Vex.RERR("ArgumentError", "Invalid argument to constructor");
  if (object.keys instanceof Array)
    // Copy keys array
    // TODO: check each element
    this.keys = object.keys.slice();
  else this.keys = new Array();

  this.type = "note";
}
