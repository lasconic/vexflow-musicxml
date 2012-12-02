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

  this.attributes = {};
  if (typeof object.attributes == "object")
    Vex.Merge(this.attributes, object.attributes);
  this.parts = new Array(1); // default to 1 part
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
  if (! this.parts[partNum]) {
    // Create empty part
    this.parts[partNum] = new Vex.Flow.Measure.Part({time: this.time});
  }
  return this.parts[partNum];
}
Vex.Flow.Measure.prototype.setPart = function(partNum, part) {
  if (this.parts.length <= partNum)
    throw new Vex.RERR("ArgumentError", "Set number of parts before adding part");
  this.parts[partNum] = new Vex.Flow.Measure.Part(part);
}

/**
 * Add a note to the end of the voice.
 * This is a convenience method that only works when there is one part and
 * one voice. If there is no room for the note, a Vex.RuntimeError is thrown.
 * @param {Object} Note object
 */
Vex.Flow.Measure.prototype.addNote = function(note) {
  if (this.getNumberOfParts() != 1)
    throw new Vex.RERR("ArgumentError", "Measure.addNote requires single part");
  this.getPart(0).addNote(note);
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
  else this.voices = new Array(1); // Default to single voice

  this.type = "part";
}

Vex.Flow.Measure.Part.prototype.getNumberOfVoices = function(numVoices) {
  return this.voices.length;
}
Vex.Flow.Measure.Part.prototype.setNumberOfVoices = function(numVoices) {
  this.voices.length = numVoices;
}

Vex.Flow.Measure.Part.prototype.getVoice = function(voiceNum) {
  if (! this.voices[voiceNum]) {
    // Create empty voice
    this.voices[voiceNum] = new Vex.Flow.Measure.Voice({time: this.time});
  }
  return this.voices[voiceNum];
}
Vex.Flow.Measure.Part.prototype.setVoice = function(voiceNum, voice) {
  if (this.voices.length <= voiceNum)
    throw new Vex.RERR("ArgumentError", "Set number of voices before adding voice");
  this.voices[voiceNum] = new Vex.Flow.Measure.Voice(voice);
}

/**
 * Add a note to the end of the voice.
 * This is a convenience method that only works when the part only has
 * one voice. If there is no room for the note, a Vex.RuntimeError is thrown.
 * @param {Object} Note object
 */
Vex.Flow.Measure.Part.prototype.addNote = function(note) {
  if (this.getNumberOfVoices() != 1)
    throw new Vex.RERR("ArgumentError", "Measure.addNote requires single part");
  this.getVoice(0).addNote(note);
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
 * Add a note to the end of the voice.
 * If there is no room for the note, a Vex.RuntimeError is thrown.
 * @param {Object} Note object
 */
Vex.Flow.Measure.Voice.prototype.addNote = function(note) {
  // TODO: Check total ticks in voice
  this.notes.push(new Vex.Flow.Measure.Note(note));
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
