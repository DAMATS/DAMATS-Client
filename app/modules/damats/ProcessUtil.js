//------------------------------------------------------------------------------
//
// Project: DAMATS Client
// Authors: Martin Paces <martin.paces@eox.at>
//
//------------------------------------------------------------------------------
// Copyright (C) 2016 EOX IT Services GmbH
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies of this Software or works derived from this Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//------------------------------------------------------------------------------

// Process utilities - inputs handling and process invocation.

(function () {
    'use strict';
    var root = this;
    var deps = ['underscore'];
    var init = function () {

        function cast_type(type, value) {
            if (type == "string") {
                return String(value);
            } else if (type == "integer") {
                return parseInt(parseFloat(value));
            } else if ((type == "double") || (type == "float")) {
                return parseFloat(value);
            } else {
                throw "Invalid type '" + type + "'!";
            }
        }

        function check_range(range, value) {
            var closure = range.closure || "closed";
            var valid = true;
            if (range.min || range.min === 0) {
                if ((closure == "closed") || (closure == "closed-open")) {
                    valid = valid && (value >= range.min);
                } else if ((closure == "open") || (closure == "open-closed")) {
                    valid = valid && (value > range.min);
                } else {
                    throw "Invalid range closure '" + closure + "'!";
                }
            }
            if (range.max || range.max === 0) {
                if ((closure == "closed") || (closure == "open-closed")) {
                    valid = valid && (value <= range.max);
                } else if ((closure == "open") || (closure == "closed-open")) {
                    valid = valid && (value < range.max);
                } else {
                    throw "Invalid range closure '" + closure + "'!";
                }
            }
            return valid;
        }

        function check_enum(enum_, value) {
            return _.indexOf(enum_, value) >= 0;
        }

        function parseInput(input_def, value) {
            // fill the default
            if (!value && (value !== 0)) {
                if (input_def.is_optional) {
                    value = input_def.default_value;
                } else {
                    throw input_def.identifier + ":missing";
                }
            } else {
                value = cast_type(input_def.type, value);
                if (isNaN(value)) {
                    throw input_def.identifier + ":invalid:datatype";
                }
            }
            // check the value restrictions
            if (input_def.range && !check_range(input_def.range, value)) {
                console.error([value, input_def.range]);
                throw input_def.identifier + ":invalid:range";
            }
            if (input_def['enum'] && !check_enum(input_def['enum'], value)) {
                console.error([value, input_def['enum']]);
                throw input_def.identifier + ":invalid:enum";
            }
            // return parsed values
            return value;
        }

        function parseInputs(input_defs, inputs) {
            var errors = []; // list of detected errors
            var parsed = {}; // parsed inputs
            inputs = inputs || {};

            // iterate the input definition and fill the validates inputs
            _.each(input_defs, function (input_def) {
                try {
                    parsed[input_def.identifier] = parseInput(
                        input_def, inputs[input_def.identifier]
                    );
                } catch (exception) {
                    errors.push(exception);
                }
            });
            return {inputs: parsed, errors: errors};
        }

        return {
            parseInput: parseInput,
            parseInputs: parseInputs
        };
    };
    root.define(deps, init);
}).call(this);
