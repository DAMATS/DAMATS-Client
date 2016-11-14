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

        function buildExecuteRequestKVP(prm) {
            var key, value, inputs = prm.inputs || {};
            var url = (
                '?service=WPS&version=1.0.0&request=execute' +
                '&identifier=' + prm.process +
                '&DataInputs=sits=' + prm.time_series
            );
            for (key in inputs) {
                value = String(inputs[key]);
                if (value) {
                    url += ";" + key + "=" + value;
                }
            }
            url += '&StoreExecuteResponse=true&status=true&lineage=true';
            return url;
        }

        function buildExecuteRequestXML(prm) {
            var key, value, inputs = prm.inputs || {};

            var xml = (
                '<wps:Execute version="1.0.0" service="WPS" ' +
                'xmlns:wps="http://www.opengis.net/wps/1.0.0" ' +
                'xmlns:ows="http://www.opengis.net/ows/1.1">' +
                '<ows:Identifier>' + prm.process + '</ows:Identifier>' +
                '<wps:DataInputs>' +
                '<wps:Input><ows:Identifier>sits</ows:Identifier>' +
                '<wps:Data><wps:LiteralData>' + prm.time_series +
                '</wps:LiteralData></wps:Data></wps:Input>'
            );

            for (key in inputs) {
                value = String(inputs[key]);
                if (value) {
                    xml += (
                        '<wps:Input><ows:Identifier>' + key +
                        '</ows:Identifier><wps:Data><wps:LiteralData>' +
                        value + '</wps:LiteralData></wps:Data></wps:Input>'
                    );
                }
            }

            xml += (
                '</wps:DataInputs><wps:ResponseForm>' +
                '<wps:ResponseDocument lineage="true" ' +
                'storeExecuteResponse="true" status="true" />' +
                '</wps:ResponseForm></wps:Execute>'
            );
            return xml;
        }

        function castType(type, value) {
            if (type == "string") {
                value = String(value);
            } else if (type == "integer") {
                value = parseInt(parseFloat(value));
                if (isNaN(value)) {
                    throw "Invalid integer value.";
                }
            } else if ((type == "double") || (type == "float")) {
                value = parseFloat(value);
                if (isNaN(value)) {
                    throw "Invalid float value.";
                }
            } else {
                throw "Invalid type '" + type + "'!";
            }
            return value;
        }

        function checkRange(range, value) {
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

        function formatRange(range) {
            var closure = range.closure || "closed";
            var bounds = {lower: "", upper: ""};
            if (range.max || range.max === 0) {
                if ((closure == "closed") || (closure == "open-closed")) {
                    bounds.upper = " <= " + range.max;
                } else if ((closure == "open") || (closure == "closed-open")) {
                    bounds.upper = " < " + range.max;
                } else {
                    throw "Invalid range closure '" + closure + "'!";
                }
            }
            if (range.min || range.min === 0) {
                if ((closure == "closed") || (closure == "closed-open")) {
                    if (bounds.upper) {
                        bounds.lower = range.min + " <= ";
                    } else {
                        bounds.upper = " >= " + range.min;
                    }
                } else if ((closure == "open") || (closure == "open-closed")) {
                    if (bounds.upper) {
                        bounds.lower = range.min + " < ";
                    } else {
                        bounds.upper = " > " + range.min;
                    }
                } else {
                    throw "Invalid range closure '" + closure + "'!";
                }
            }
            return bounds;
        }

        function checkEnum(enum_, value) {
            return _.indexOf(enum_, value) >= 0;
        }

        function parseInput(input_def, value) {
            // fill the default
            if (!value && (value !== 0)) {
                if (input_def.is_optional) {
                    value = input_def.default_value;
                } else {
                    throw "Missing mandatory value.";
                }
            } else {
                value = castType(input_def.type, value);
            }
            // check the value restrictions
            if (input_def.range && !checkRange(input_def.range, value)) {
                var bounds = formatRange(input_def.range);
                throw (
                    "Out of range: " + bounds.lower + "x" + bounds.upper
                );
            }
            if (input_def['enum'] && !checkEnum(input_def['enum'], value)) {
                throw "Invalid value.";
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

        function listInputValues(input_defs, inputs) {
            return _.map(input_defs, function (input_def) {
                var value = inputs[input_def.identifier];
                try {
                    value = parseInput(input_def, value);
                } catch (exception) {
                    console.error(input_def.identifier + ":" + exception);
                }
                return _.extend({value: value}, input_def);
            });
        }

        return {
            buildExecuteRequestKVP: buildExecuteRequestKVP,
            buildExecuteRequestXML: buildExecuteRequestXML,
            listInputValues: listInputValues,
            parseInput: parseInput,
            parseInputs: parseInputs
        };
    };
    root.define(deps, init);
}).call(this);
