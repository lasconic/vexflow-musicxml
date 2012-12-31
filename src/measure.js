/**
 * Measure - intermediate representation of measures of a Vex.Flow.Document
 * @author Daniel Ringwalt (ringw)
 */

/** @constructor */
Vex.Flow.Measure = function(object) {
  if (typeof object != "object")
    throw new Vex.RERR("ArgumentError","Invalid argument to Vex.Flow.Measure");
  if (! object.time || ! object.time.num_beats || ! object.time.beat_value)
    throw new Vex.RERR("ArgumentError",
          "Measure must be initialized with nonzero num_beats and beat_value");
  this.time = Vex.Merge({}, object.time);

  this.attributes = {};
  if (typeof object.attributes == "object")
    Vex.Merge(this.attributes, object.attributes);
  this.parts = new Array(1); // default to 1 part
  if (typeof object.getParts == "function")
    this.parts = object.getParts(); // Copy parts from first-class object
  else if (object.parts instanceof Array) {
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
    throw new Vex.RERR("ArgumentError",
                       "Set number of parts before adding part");
  this.parts[partNum] = new Vex.Flow.Measure.Part(part);
}
Vex.Flow.Measure.prototype.getParts = function() {
  for (var i = 0; i < this.parts.length; i++) this.getPart(i);
  return this.parts.slice(0); // copy array
}

Vex.Flow.Measure.prototype.getNumberOfStaves = function() {
  // Sum number of staves from each part
  var totalStaves = 0;
  for (var i = 0; i < this.getNumberOfParts(); i++)
    totalStaves += this.getPart(i).getNumberOfStaves();
  return totalStaves;
}
Vex.Flow.Measure.prototype.getStave = function(staveNum) {
  var firstStaveForPart = 0;
  for (var i = 0; i < this.getNumberOfParts(); i++) {
    var part = this.getPart(i);
    if (firstStaveForPart + part.getNumberOfStaves() > staveNum)
      return part.getStave(staveNum - firstStaveForPart);
  }
  return undefined;
}
Vex.Flow.Measure.prototype.getStaves = function() {
  var staves = new Array(this.getNumberOfStaves());
  for (var i = 0; i < staves.length; i++) staves.push(this.getStave(i));
  return staves;
}

/**
 * Add a note to the end of the voice.
 * This is a convenience method that only works when there is one part and
 * one voice. If there is no room for the note, a Vex.RuntimeError is thrown.
 * @param {Object} Note object
 */
Vex.Flow.Measure.prototype.addNote = function(note) {
  if (this.getNumberOfParts() != 1)
    throw new Vex.RERR("ArgumentError","Measure.addNote requires single part");
  this.getPart(0).addNote(note);
}

/**
 * Vex.Flow.Measure.Part - a single part (may include multiple staves/voices)
 * @constructor
 */
Vex.Flow.Measure.Part = function(object) {
  if (typeof object != "object")
    throw new Vex.RERR("ArgumentError", "Invalid argument to constructor");
  if (! object.time || ! object.time.num_beats || ! object.time.beat_value)
    throw new Vex.RERR("ArgumentError",
              "Constructor requires nonzero num_beats and beat_value");
  this.time = Vex.Merge({}, object.time);

  // Convenience options which can be set on a part instead of a stave/voice
  this.options = {time: this.time};
  if (typeof object.clef == "string") this.options.clef = object.clef;
  if (typeof object.key == "string") this.options.key = object.key;
  if (typeof object.time_signature == "string")
    this.options.time_signature = object.time_signature;

  if (typeof object.getVoices == "function") this.voices = object.getVoices();
  else if (object.voices instanceof Array) {
    var voiceOptions = this.options;
    this.voices = object.voices.map(function(voice) {
      // Copy voiceOptions and overwrite with options from argument
      return new Vex.Flow.Measure.Voice(
        Vex.Merge(Vex.Merge({}, voiceOptions), voice));
    });
  }
  else this.voices = new Array(1); // Default to single voice

  if (typeof object.staves == "function") this.staves = object.getStaves();
  else if (object.staves instanceof Array) {
    var staveOptions = this.options;
    this.staves = object.staves.map(function(stave) {
      var staveObj;
      if (typeof stave == "string") // interpret stave as clef value
        staveObj = Vex.Merge({clef: stave}, staveOptions);
      // Copy staveOptions and overwrite with options from argument
      else staveObj = Vex.Merge(Vex.Merge({}, staveOptions), stave);
      return new Vex.Flow.Measure.Stave(staveObj);
    });
  }
  else {
    if (typeof object.staves == "number")
      this.staves = new Array(object.staves);
    else this.staves = new Array(1);
  }

  this.type = "part";
}

Vex.Flow.Measure.Part.prototype.getNumberOfVoices = function(numVoices) {
  return this.voices.length;
}
Vex.Flow.Measure.Part.prototype.setNumberOfVoices = function(numVoices) {
  this.voices.length = numVoices;
}
Vex.Flow.Measure.Part.prototype.getVoice = function(voiceNum) {
  if (! this.voices[voiceNum])
    // Create empty voice
    this.voices[voiceNum] = new Vex.Flow.Measure.Voice(
                              Vex.Merge({time: this.time}, this.options));
  return this.voices[voiceNum];
}
Vex.Flow.Measure.Part.prototype.setVoice = function(voiceNum, voice) {
  if (this.voices.length <= voiceNum)
    throw new Vex.RERR("ArgumentError",
                       "Set number of voices before adding voice");
  this.voices[voiceNum] = new Vex.Flow.Measure.Voice(voice);
}
Vex.Flow.Measure.Part.prototype.getVoices = function() {
  for (var i = 0; i < this.getNumberOfVoices(); i++) this.getVoice(i);
  return this.voices.slice(0);
}

Vex.Flow.Measure.Part.prototype.getNumberOfStaves = function(numStaves) {
  return this.staves.length;
}
Vex.Flow.Measure.Part.prototype.setNumberOfStaves = function(numStaves) {
  this.staves.length = numStaves;
}
Vex.Flow.Measure.Part.prototype.getStave = function(staveNum) {
  if (! this.staves[staveNum]) {
    // Create empty stave
    this.staves[staveNum] = new Vex.Flow.Measure.Stave(
                              Vex.Merge({time: this.time}, this.options));
  }
  return this.staves[staveNum];
}
Vex.Flow.Measure.Part.prototype.setStave = function(staveNum, stave) {
  if (this.staves.length <= staveNum)
    throw new Vex.RERR("ArgumentError",
                       "Set number of staves before adding stave");
  this.staves[staveNum] = new Vex.Flow.Measure.Stave(stave);
}
Vex.Flow.Measure.Part.prototype.getStaves = function() {
  for (var i = 0; i < this.getNumberOfStaves(); i++) this.getStave(i);
  return this.staves.slice(0);
}

/* True if there should be a brace at the start of every line for this part. */
Vex.Flow.Measure.Part.prototype.showsBrace = function() {
  return (this.staves.length > 1);
}

/**
 * Add a note to the end of the voice.
 * This is a convenience method that only works when the part only has
 * one voice. If there is no room for the note, a Vex.RuntimeError is thrown.
 * @param {Object} Note object
 */
Vex.Flow.Measure.Part.prototype.addNote = function(note) {
  if (this.getNumberOfVoices() != 1)
    throw new Vex.RERR("ArgumentError","Measure.addNote requires single part");
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
  this.time = Vex.Merge({}, object.time);
  this.key = (typeof object.key == "string") ? object.key : null;
  this.notes = new Array();
  if (object.notes instanceof Array)
    object.notes.forEach(function(note) {
      this.addNote(new Vex.Flow.Measure.Note(note)); }, this);
  else this.notes = new Array();

  // Voice must currently be on a single stave
  if (typeof object.stave == "number") this.stave = object.stave;
  else this.stave = 0;

  this._vexflowVoice = null;
  this._vexflowObjects = null;

  this.type = "voice";
}

Vex.Flow.Measure.Voice.keyAccidentals = function(key) {
  var acc = {C:null, D:null, E:null, F:null, G:null, A:null, B:null};
  var acc_order = {"b": ["B","E","A","D","G","C","F"],
                   "#": ["F","C","G","D","A","E","B"]};
  var key_acc = Vex.Flow.keySignature.keySpecs[key];
  var key_acctype = key_acc.acc, num_acc = key_acc.num;
  for (var i = 0; i < num_acc; i++)
    acc[acc_order[key_acctype][i]] = key_acctype;
  return acc;
}

/**
 * Add a note to the end of the voice.
 * If there is no room for the note, a Vex.RuntimeError is thrown.
 * @param {Object} Note object
 */
Vex.Flow.Measure.Voice.prototype.addNote = function(note) {
  // TODO: Check total ticks in voice
  var noteObj = new Vex.Flow.Measure.Note(note); // copy note
  if (this.key) {
    // Track accidentals used previously in measure
    if (! this._accidentals)
      this._accidentals = Vex.Flow.Measure.Voice.keyAccidentals(this.key);
    var accidentals = this._accidentals;
    var i = 0;
    noteObj.accidentals = noteObj.accidentals.map(function(acc) {
      if (acc == "n") {
        // Force natural
        accidentals[key] = null;
      }
      else {
        var key = note.keys[i][0].toUpperCase(); // letter name of key
        if (accidentals[key] == acc) acc = null;
        else {
          accidentals[key] = acc;
          if (acc == null) acc = "n";
        }
      }
      i++;
      return acc;
    });
  }
  this.notes.push(new Vex.Flow.Measure.Note(noteObj));
}

/**
 * Create a Vex.Flow.Voice with a StaveNote for each note.
 * Each note is added to the proper Vex.Flow.Measure.Stave in staves
 * (spanning multiple staves in a single voice not currently supported.)
 * @param {Array} Staves to add the notes to
 */
Vex.Flow.Measure.Voice.prototype.getVexflowVoice = function(staves) {
  if (! this._vexflowVoice) {
    var voice = new Vex.Flow.Voice({num_beats: this.time.num_beats,
                                    beat_value: this.time.beat_value,
                                    resolution: Vex.Flow.RESOLUTION});
    this._vexflowObjects = new Array();
    var beamedNotes = undefined;
    var clef = staves[this.stave].clef;
    for (var i = 0; i < this.notes.length; i++) {
      var note = this.notes[i];
      var vfNote = this.notes[i].getVexflowNote({clef: clef});
      voice.addTickable(vfNote);
      if (note.beam == "begin") beamedNotes = [vfNote];
      else if (beamedNotes) {
        beamedNotes.push(vfNote);
        if (note.beam == "end") {
          this._vexflowObjects.push(new Vex.Flow.Beam(beamedNotes));
          beamedNotes = undefined;
        }
      }
    }
    this._vexflowVoice = voice;
  }
  return this._vexflowVoice;
}

/**
 * Returns an array of objects such as beams which are created from the
 * VexFlow voice returned from getVexflowVoice. If the VexFlow voice has not
 * been created, the arguments are required and are passed to getVexflowVoice.
 */
Vex.Flow.Measure.Voice.prototype.getVexflowObjects = function(staves) {
  if (! this._vexflowVoice) this.getVexflowVoice(staves);
  return this._vexflowObjects;
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
  this.time = Vex.Merge({}, object.time);
  if (typeof object.clef != "string")
    throw new Vex.RERR("InvalidIRError",
              "Stave object requires clef property");
  this.clef = object.clef;
  this.key = (typeof object.key == "string") ? object.key : null;
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
  // Type is required for modifiers
  if (typeof modifier != "object" || typeof modifier.type != "string")
    throw new Vex.RERR("InvalidIRError",
                       "Stave modifier requires type string property");
  var newModifier = {type: modifier.type}; // copy modifier
  switch (modifier.type) {
    case "clef":
      if (typeof modifier.clef != "string")
        throw new Vex.RERR("InvalidIRError",
                           "Clef modifier requires clef string");
      newModifier.clef = modifier.clef;
      break;
    case "key":
      if (typeof modifier.key != "string")
        throw new Vex.RERR("InvalidIRError",
                           "Key modifier requires key string");
      newModifier.key = modifier.key;
      break;
    case "time":
      if (! modifier.num_beats || ! modifier.beat_value)
        throw new Vex.RERR("InvalidIRError",
                    "Time modifier requires nonzero num_beats and beat_value");
      newModifier.num_beats = modifier.num_beats;
      newModifier.beat_value = modifier.beat_value;
      break;
    default:
      throw new Vex.RERR("InvalidIRError", "Modifier not recognized");
  }
  this.modifiers.push(newModifier);
}

/**
 * Find the modifier with the given type, or return null.
 */
Vex.Flow.Measure.Stave.prototype.getModifier = function(type) {
  var mod = null;
  this.modifiers.forEach(function(m) { if (m.type == type) mod = m; });
  return mod;
}

/**
 * Delete modifier(s) which have the given type.
 *
 * @param {String} Type of modifier
 */
Vex.Flow.Measure.Stave.prototype.deleteModifier = function(modifier) {
  if (typeof modifier != "string")
    throw new Vex.RERR("ArgumentError",
                       "deleteModifier requires string argument");
  // Create new modifier array with non-matching modifiers
  var newModifiers = new Array();
  for (var i = 0; i < this.modifiers.length; i++)
    if (this.modifiers[i].type != modifier)
      newModifiers.push(this.modifiers[i]);
  this.modifiers = newModifiers;
}

/**
 * Vex.Flow.Measure.Note - a single note (includes chords, rests, etc.)
 * @constructor
 */
Vex.Flow.Measure.Note = function(object) {
  if (typeof object != "object")
    throw new Vex.RERR("ArgumentError", "Invalid argument to constructor");
  if (object.keys instanceof Array)
    // Copy keys array, converting each key value to the standard
    this.keys = object.keys.map(Vex.Flow.Measure.Note.Key);
  else this.keys = new Array();
  if (object.accidentals instanceof Array) {
    if (object.accidentals.length != this.keys.length)
      throw new Vex.RERR("InvalidIRError",
                         "accidentals and keys must have same length");
    this.accidentals = object.accidentals.slice(0);
  }
  else if (this.keys.length)
    this.accidentals =object.keys.map(Vex.Flow.Measure.Note.Key.GetAccidental);
  else this.accidentals = new Array();
  this.duration = object.duration;
  this.stem_direction = object.stem_direction;
  this.beam = object.beam;

  this._vexflowNote = null;

  this.type = "note";
}

/* Standardize a key string, returning the result */
Vex.Flow.Measure.Note.Key = function(key) {
  // Remove natural, get properties
  var keyProperties = Vex.Flow.keyProperties(key.replace(/n/i, ""), "treble");
  return keyProperties.key + "/" + keyProperties.octave.toString();
}
/* Default accidental value from key */
Vex.Flow.Measure.Note.Key.GetAccidental = function(key) {
  // Keep natural, return accidental from properties
  return Vex.Flow.keyProperties(key, "treble").accidental;
}

Vex.Flow.Measure.Note.prototype.getVexflowNote = function(options) {
  if (! this._vexflowNote) {
    var note_struct = Vex.Merge({}, options);
    note_struct.keys = this.keys;
    note_struct.duration = this.duration;
    if (this.stem_direction) note_struct.stem_direction = this.stem_direction;
    var vfNote = new Vex.Flow.StaveNote(note_struct);
    var i = 0;
    this.accidentals.forEach(function(acc) {
      if (acc != null) vfNote.addAccidental(i, new Vex.Flow.Accidental(acc));
      i++;
    });
    this._vexflowNote = vfNote;
  }
  return this._vexflowNote;
}
