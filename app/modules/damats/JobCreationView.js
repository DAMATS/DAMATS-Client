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

(function () {
    'use strict';
    var root = this;
    var deps = [
        'backbone',
        'communicator',
        'globals',
        'modules/damats/CommonUtilities',
        'modules/damats/FeatureStyles',
        'hbs!tmpl/JobCreation',
        'modules/damats/ProcessUtil',
        'underscore',
        'bootstrap-datepicker',
        'bootstrap-select'
    ];

    function init(
        Backbone,
        Communicator,
        globals,
        cutils,
        fstyles,
        JobCreationTmpl,
        ProcessUtil
    ) {
        var JobCreationView = Backbone.Marionette.ItemView.extend({
            className: 'panel panel-default job-creation not-selectable',
            template: {type: 'handlebars', template: JobCreationTmpl},
            templateHelpers: function () {
                var attr = this.model.attributes;
                return {
                    '_inputs': ProcessUtil.listInputValues(
                        attr.process.attributes.inputs, this.inputs || {}
                    ),
                    'time_series_attr': attr.time_series ? attr.time_series.attributes : {},
                    'process_attr': attr.process ? attr.process.attributes : {}
                };
            },
            events: {
                'click #btn-job-create': 'onCreateClick',
                'change .process-input': 'onInputChange',
                'change #txt-name': 'onNameFormChange',
                'click #box-sits': 'onSelectTimeSeries',
                'click #btn-focus': 'focusToAoI',
                'click #box-process': 'onSelectProcess',
                'click .close': 'close'
            },
            refreshSITSGeometry: function () {
                this.removeSISTGeometry();
                this.displaySITSGeometry();
            },
            removeSISTGeometry: function () {
                Communicator.mediator.trigger('map:geometry:remove:all');
            },
            displaySITSGeometry: function (time_series) {
                // clear the geometry layer
                this.removeSISTGeometry();
                // display the selected AoI polygon (matched data)
                Communicator.mediator.trigger('map:geometry:add', {
                    geometry: cutils.coordsToGeometry(
                        time_series.get('selection_area')
                    ),
                    attributes: {
                        identifer: time_series.get('identifier'),
                        type: 'selected-area'
                    },
                    style: fstyles.aoi
                });
                // display the selection polygon (user input)
                Communicator.mediator.trigger('map:geometry:add', {
                    geometry: cutils.coordsToGeometry(
                        time_series.get('selection_area')
                    ),
                    attributes: {
                        identifer: time_series.get('identifier'),
                        type: 'selection-area'
                    },
                    style: fstyles.selection
                });
            },
            browseSITS: function () {
                Communicator.mediator.trigger('sits:browser:browse', this.time_series);
            },
            focusToAoI: function () {
                Communicator.mediator.trigger(
                    'map:set:extent',
                    this.model.get('time_series').get('selection_extent')
                );
                return false; // suppress event propagation
            },
            onMapClicked: function (event_) {
                this.inputs.sample_latitude = event_.lat;
                this.inputs.sample_longitude = event_.lon;
                this.resetInputs(this.inputs);
                console.log(this.inputs)
                this.showSampleMarker();
            },
            showSampleMarker: function () {
                if (
                    (this.inputs.sample_latitude != null) &&
                    (this.inputs.sample_longitude != null)
                ) {
                    Communicator.mediator.trigger('map:marker:set', {
                        lat: this.inputs.sample_latitude,
                        lon: this.inputs.sample_longitude
                    }, {
                        icon: globals.icons.pinRed
                    });
                } else {
                    Communicator.mediator.trigger('map:marker:clearAll');
                }
            },
            onInputChange: function (event_) {
                var $el = $(event_.target);
                var id = $el.attr('id');
                var $fg = this.$el.find("#" + id + ".form-group");
                var input_def = _.find(
                    this.model.get('process').get('inputs'), function (item) {
                        return item.identifier == id;
                    }
                );
                var value = $el.val();
                var error = null;
                if (value) {
                    try {
                        value = ProcessUtil.parseInput(input_def, $el.val());
                    } catch (exception) {
                        value = null;
                        error = exception;
                    }
                } else {
                    value = input_def.default_value;
                }
                this.inputs[id] = value;
                $fg.find(".input-error").remove();
                if (error) {
                    $fg.addClass('has-error');
                    $el.after($('<div/>', {
                        class: 'help-block input-error',
                        text: String(error)
                    }));
                    this.errors[id] = error;
                } else {
                    $el.val(value);
                    delete this.errors[id];
                    if (value == null) {
                        $fg.addClass('has-error');
                    } else {
                        $fg.removeClass('has-error');
                    }
                }
                if (_.isEmpty(this.errors)) {
                    this.$('#btn-job-create').removeAttr('disabled');
                } else {
                    this.$('#btn-job-create').attr('disabled', 'disabled');
                }

                if ((id == "sample_latitude") || (id == "sample_longitude")) {
                    this.showSampleMarker();
                }
            },
            resetInputs: function (inputs) {
                // extract defaults
                var parsed = ProcessUtil.parseInputs(
                    this.model.get('process').get('inputs'), inputs || {}
                );
                // clear any error label
                this.$el.find(".input-error").remove();

                // fill the form
                $('#txt-name').val(this.model.get('name'));

                _.each(parsed.inputs, function (value, key) {
                    this.$el.find("#" + key + ".process-input").val(value);
                    this.$el.find("#" + key + ".form-group").removeClass('has-error');
                }, this);

                // display errors
                _.each(parsed.errors, function (message, key) {
                    this.$el.find("#" + key + ".process-input").val(null).after(
                        $('<div/>', {
                            class: 'help-block input-error',
                            text: String(message)
                        })
                    );
                    this.$el.find("#" + key + ".form-group").addClass('has-error');
                }, this);

                // highlight missing values
                _.each(parsed.missing, function (key) {
                    this.$el.find("#" + key + ".process-input").val(null);
                    this.$el.find("#" + key + ".form-group").addClass('has-error');
                }, this);

                // set error flags
                if (!_.isEmpty(parsed.errors)) {
                    this.$('#btn-job-create').attr('disabled', 'disabled');
                }

                this.inputs = parsed.inputs;
                this.errors = parsed.errors;
            },
            onShow: function (view) {
                this.listenTo(this.model, 'change:name', this.onNameChange);
                this.listenTo(Communicator.mediator, 'map:clicked', this.onMapClicked);
                this.delegateEvents(this.events);
                this.$el.draggable({
                    containment: '#content' ,
                    scroll: false,
                    handle: '.panel-heading'
                });
                this.resetInputs(this.model.get('inputs'));
                this.displaySITSGeometry(this.model.get('time_series'));
                this.showSampleMarker();
            },
            onClose: function() {
                //Communicator.mediator.trigger('map:preview:clear');
                Communicator.mediator.trigger('map:marker:clearAll');
                this.removeSISTGeometry();
            },
            onSelectTimeSeries: function () {
                Communicator.mediator.trigger('dialog:open:SITSManager');
                this.close();
            },
            onSelectProcess: function () {
                Communicator.mediator.trigger('dialog:open:ProcessList');
                this.close();
            },
            onNameChange: function () {
                $('#txt-name').val(this.model.get('name'));
            },
            onNameFormChange: function () {
                this.model.set('name', $('#txt-name').val());
            },
            onCreateClick: function () {
                var parsed = ProcessUtil.parseInputs(
                    this.model.get('process').get('inputs'), this.inputs
                );
                if (_.isEmpty(parsed.errors)) {
                    this.model.set('inputs', this.inputs);
                    Communicator.mediator.trigger('job:creation:create', true);
                } else {
                    throw "An attempt to submit invalid input values.";
                }
            }
        });

        return {JobCreationView: JobCreationView};
    };

    root.define(deps, init);
}).call(this);
