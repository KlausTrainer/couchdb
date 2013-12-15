// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

// Text line stream

var stream = require('stream');
var util = require('util');

function LineStream2() {
  var options = {
    encoding: 'utf8',
    decodeStrings: false
  };

  if (!(this instanceof LineStream2)) {
    return new LineStream2(options);
  }

  stream.Transform.call(this, options);
}

util.inherits(LineStream2, stream.Transform);

LineStream2.prototype._transform = function(message, encoding, done) {
  var self = this;

  message = message.toString(encoding);
  var lines = message.split(/\n/);

  // If the data ends in "\n" this will be ""; otherwise the final partial line.
  var remainder = lines.pop();
  if (remainder) {
    this.unshift(remainder);
  }

  lines.forEach(function(line) {
    self.push(line);
  });

  done();
};

module.exports = LineStream2;
