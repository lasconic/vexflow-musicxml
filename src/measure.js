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
  // Default values
  this.attributes = {};
  this.parts = [];

  Vex.Merge(this, object);
  for (var i = 0; i < this.parts.length; i++)
    this.parts[i] = new Vex.Flow.Measure.Part(this.parts[i]);
  this.type = "measure";
}

Vex.Flow.Measure.prototype.setAttributes = function(attributes) {
  Vex.Merge(this.attributes, attributes);
}

Vex.Flow.Measure.prototype.setNumberOfParts = function(numParts) {
  this.parts.length = numParts;
}

if (! Vex.Flow.Backend) Vex.Flow.Backend = {};

/**
 * Vex.Flow.Backend.IR - return measures from intermediate JSON representation
 * @constructor
 */
Vex.Flow.Backend.IR = function() {
  this.documentObject = null;
}

/**
 * "Parse" an existing IR document object (not necessarily an instance of
 *     Vex.Flow.Document).
 * If the object is invalid, a Vex.RuntimeError is thrown.
 * Upon success, no exception is thrown and #isValid returns true.
 *
 * @param object The original document object
 */
Vex.Flow.Backend.IR.prototype.parse = function(object) {
  if (! Vex.Flow.Backend.IR.appearsValid(object))
    throw new Vex.RERR("InvalidArgument", "IR object must be a valid document");
  
  this.documentObject = object;
}

/**
 * Class method.
 * Returns true if the argument appears to a valid document object.
 * Used when automatically detecting VexFlow IR.
 *
 * @return {Boolean} True if object looks like a valid document.
 */
Vex.Flow.Backend.IR.appearsValid = function(object) {
  return typeof object == "object" && object.type == "document";
}

/**
 * Returns true if the passed-in code parsed without errors.
 *
 * @return {Boolean} True if code is error-free.
 */
Vex.Flow.Backend.IR.prototype.isValid = function() { return this.valid; }

// TODO: getNumberOfMeasures, getMeasure methods

Vex.Flow.Measure.Part = function(object) {
}
