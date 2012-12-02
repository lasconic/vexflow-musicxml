/**
 * Document - generic document class
 * @author Daniel Ringwalt (ringw)
 */

/** @constructor */
Vex.Flow.Document = function(data, options) {
  if (arguments.length > 0) this.init(data, options);
}

Vex.Flow.Document.backends = [Vex.Flow.Backend.IR, Vex.Flow.Backend.MusicXML];
if (Vex.Flow.Backend.VexTab)
  Vex.Flow.Documents.backends.push(Vex.Flow.Backend.VexTab);

Vex.Flow.Document.prototype.init = function(data, options) {
  this.options = {};
  Vex.Merge(this.options, options);
  this.measures = new Array();
  if (! data) {
    this.backend = null;
    return;
  }
  for (var i = 0; i < Vex.Flow.Document.backends.length; i++) {
    var Backend = Vex.Flow.Document.backends[i];
    if (Backend.appearsValid(data)) {
      this.backend = new Backend();
      this.backend.parse(data);
      if (! this.backend.isValid())
        throw new Vex.RERR("ParseError", "Could not parse document data");
    }
  }
  if (! this.backend)
    throw new Vex.RERR("ParseError", "Data in document appears to be unsupported");
}

/**
 * Number of measures in the document
 * @return {Number} Total number of measures
 */
Vex.Flow.Document.prototype.getNumberOfMeasures = function() {
  return this.backend.getNumberOfMeasures();
}

/**
 * Retrieve the ith measure (zero-indexed).
 * @param {Number} The zero-indexed measure to access.
 * @return {Vex.Flow.Measure} Measure object corresponding to the measure number.
 */
Vex.Flow.Document.prototype.getMeasure = function(i) {
  if (i in this.measures) return this.measures[i];
  var measure = this.backend.getMeasure(i);
  this.measures[i] = measure;
  return measure;
}

// TODO: add methods for formatting information, etc.
