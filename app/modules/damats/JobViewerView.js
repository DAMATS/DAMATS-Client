//------------------------------------------------------------------------------
//
// Project: DAMATS Client
// Authors: Martin Paces <martin.paces@eox.at>
//
//------------------------------------------------------------------------------
// Copyright (C) 2015 EOX IT Services GmbH
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
        'hbs!tmpl/JobViewer',
        'modules/damats/ProcessUtil',
        'underscore'
    ];

    function init(
        Backbone,
        Communicator,
        globals,
        cutils,
        fstyles,
        JobViewerTmpl,
        ProcessUtil
    ) {
        var JobViewerView = Backbone.Marionette.ItemView.extend({
            tagName: 'div',
            className: 'panel panel-default job-viewer not-selectable',
            template: {type: 'handlebars', template: JobViewerTmpl},
            templateHelpers: function () {
                // TODO: get rid of the duplicated code
                var status_ = this.model.get('status');
                var editable = this.model.get('editable');
                var wps_status = this.model.get('wps_status') ;
                if (!wps_status) {wps_status = {};}

                var icon = {
                    "CREATED": editable ? "fa-pencil" : "fa-eye",
                    "ACCEPTED": "fa-hourglass text-warning",
                    "IN_PROGRESS": "fa-gears text-primary",
                    "FAILED": "fa-times text-danger",
                    "ABORTED": "fa-times text-danger",
                    "FINISHED": "fa-check text-success"
                };

                var status_info = {
                    "CREATED": "The job has not been submitted yet.",
                    "ACCEPTED": "The job has beed enqueued for execution.",
                    "IN_PROGRESS": "The job is running.",
                    "FAILED": "The job ended with an error.",
                    "ABORTED": "The job was terminated before completion.",
                    "FINISHED": "The job ended sucessfully."
                };

                var status_code = {
                    "CREATED": "CREATED",
                    "ACCEPTED": "SUBMITTED [0% completed]",
                    "IN_PROGRESS": "RUNNIG [" + wps_status.percent_completed + "% completed]",
                    "FAILED": "FAILED",
                    "ABORTED": "ABORTED",
                    "FINISHED": "FINISHED [100% completed]"
                };

                var status_message;
                if (wps_status.message) {
                    status_message = wps_status.message;
                } else {
                    status_message = status_info[status_];
                }

                if (status_ == 'FAILED') {
                    if (wps_status.locator) {
                        status_message = wps_status.locator + ': ' + status_message;
                    }
                    if (wps_status.code && (wps_status.code != 'NoApplicableCode')) {
                        status_message = wps_status.code + ': ' + status_message;
                    }
                }

                // resolve the process model
                var process = null;
                if (this.process) {
                    process = this.process.attributes;
                } else {
                    process = {
                        'identifier': this.model.get('process'),
                        'name': 'Unknown process.'
                    };
                }

                // resolve the time series model
                var time_series = null;
                if (this.time_series) {
                    time_series = this.time_series.attributes;
                } else {
                    time_series = {
                        'identifier': this.model.get('process'),
                        'name': 'Unknown SITS.'
                    };
                }

                var _outputs = _.map(
                    this.process.get('outputs') || [],
                    function (output) {
                        return _.extend({
                            is_displayed: output.identifer == this.displayed_result
                        }, output);
                    }
                );

                return {
                    displayed_result: this.displayed_result,
                    _outputs: _outputs,
                    _inputs: ProcessUtil.listInputValues(
                        this.process.get('inputs'),
                        this.inputs || this.model.get('inputs')
                    ),
                    process: process,
                    time_series: time_series,
                    is_submittable: editable && status_ == "CREATED",
                    is_submitted: status_ != "CREATED",
                    is_terminable: (
                        (status_ == "IN_PROGRESS") || (status_ == "ACCEPTED")
                    ),
                    is_terminated: (
                        (status_ == "FINISHED") || (status_ == "FAILED") ||
                        (status_ == "ABORTED")
                    ),
                    is_completed: status_ == "FINISHED",
                    created: formatISOTime(this.model.get('created')),
                    updated: formatISOTime(this.model.get('updated')),
                    icon: icon[status_],
                    status_info: status_info[status_],
                    status_code: status_code[status_],
                    status_message: status_message,
                    is_removable: (
                        (status_ != "ACCEPTED") && (status_ != "IN_PROGRESS") &&
                        this.model.get('owned')
                    )
                };
            },
            events: {
                'change .process-input': 'onInputChange',
                'click .btn-display-result': 'onResultDisplayToggle',
                'click #btn-open-manager': 'openManager',
                'click #btn-refetch': 'refetch',
                'click #btn-delete': 'removeJob',
                'click #btn-clone': 'cloneJob',
                'click #btn-save': 'saveJob',
                'click #btn-submit': 'executeJob',
                'click #box-sits': 'browseSITS',
                'click #btn-focus': 'focusToAoI',
                'click .object-metadata': 'editMetadata',
                'click .close': 'close'
            },
            initialize: function (options) {
                this.displayed_result = null;
                this.inputs = _.clone(this.model.get('inputs'));
                this.inputs_last = _.clone(this.model.get('inputs'));
                this.errors = [];
                this.changed = [];
                this.time_series = globals.damats.time_series.findWhere(
                    {'identifier': this.model.get('time_series')}
                );
                this.process = globals.damats.processes.findWhere(
                    {'identifier': this.model.get('process')}
                );
                var opacity = this.model.get('opacity');
                if ((!opacity) && (opacity != 0)) {
                    this.model.set('opacity', 1.0, {silent: true});
                }
            },
            focusToAoI: function () {
                Communicator.mediator.trigger(
                    'map:set:extent', this.time_series.get('selection_extent')
                );
                this.refreshSITSGeometry();
                return false; // suppress event propagation
            },
            refreshSITSGeometry: function () {
                this.removeSISTGeometry();
                this.displaySITSGeometry();
            },
            removeSISTGeometry: function () {
                Communicator.mediator.trigger('map:geometry:remove:all');
            },
            displaySITSGeometry: function () {
                // clear the geometry layer
                this.removeSISTGeometry();
                // display the selected AoI polygon (matched data)
                Communicator.mediator.trigger('map:geometry:add', {
                    geometry: cutils.coordsToGeometry(
                        this.time_series.get('selection_area')
                    ),
                    attributes: {
                        identifer: this.time_series.get('identifier'),
                        type: 'selected-area'
                    },
                    style: fstyles.aoi
                });
                // display the selection polygon (user input)
                Communicator.mediator.trigger('map:geometry:add', {
                    geometry: cutils.coordsToGeometry(
                        this.time_series.get('selection_area')
                    ),
                    attributes: {
                        identifer: this.time_series.get('identifier'),
                        type: 'selection-area'
                    },
                    style: fstyles.selection
                });
                // display the CIA
                Communicator.mediator.trigger('map:geometry:add', {
                    geometry: cutils.coordsToGeometry(
                        this.time_series.get('common_intersection_area')
                    ),
                    attributes: {
                        identifer: this.time_series.get('identifier'),
                        type: 'common-area'
                    },
                    style: fstyles.cia
                });
            },
            browseSITS: function () {
                Communicator.mediator.trigger('sits:browser:browse', this.time_series);
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
            onMapClicked: function (event_) {
                // map sample input hack
                if (this.model.get('status') == "CREATED") {
                    this.fillInputs({
                        "sample_latitude": event_.lat,
                        "sample_longitude": event_.lon
                    });
                }

                this.lastClicked = event_;
                if (this.displayed_result == "indices") {
                    // display markers
                    this.showSampleMarker();
                    Communicator.mediator.trigger(
                        'map:marker:set', event_,
                        {icon: globals.icons.pinWhite, clear: false}
                    );

                    // get pixel value and display mask
                    $.ajax({
                        method: "GET",
                        dataType: "text",
                        url: (
                            globals.damats.productUrl +
                            "?service=WPS&version=1.0.0&request=Execute" +
                            "&rawDataOutput=pixel&identifier=getPixelValue" +
                            "&dataInputs=coverage=" + this.coverage_id +
                            ";latitude=" + event_.lat +
                            ";longitude=" + event_.lon
                        ),
                        success: _.bind(function (data) {
                            console.log("Pixel value:" + data);
                            if (data) {
                                Communicator.mediator.trigger(
                                    'map:preview:set',
                                    globals.damats.productUrl,
                                    this.coverage_id + "_value_mask",
                                    {
                                        mask_value: "!" + data,
                                        mask_style: "black"
                                    },
                                    {opacity: this.model.get('opacity')}
                                );
                            } else {
                                Communicator.mediator.trigger(
                                    'map:preview:set',
                                    globals.damats.productUrl,
                                    this.coverage_id,
                                    null, {opacity: this.model.get('opacity')}
                                );
                            }
                        }, this)
                    });
                }
            },
            onResultDisplayToggle: function (event_) {
                var $el = $(event_.target);
                var output_id = $el.data('output-id');
                var coverage_id = $el.data('coverage-id');
                var classEnabled = 'btn-success';
                var classDisabled = 'btn-default';
                this.showSampleMarker();
                if (this.displayed_result == output_id) {
                    // hide this result
                    this.displayed_result = null;
                    $el.removeClass(classEnabled);
                    $el.addClass(classDisabled);
                    Communicator.mediator.trigger('map:preview:clear');
                } else {
                    if (this.displayed_result) {
                        // hide another displayed result
                        this.$el.find('.btn-display-result').removeClass(classEnabled);
                        this.$el.find('.btn-display-result').addClass(classDisabled);
                    }
                    // show this result
                    $el.removeClass(classDisabled);
                    $el.addClass(classEnabled);
                    this.displayed_result = output_id;
                    this.coverage_id = coverage_id;

                    Communicator.mediator.trigger(
                        'map:preview:set',
                        globals.damats.productUrl, coverage_id,
                        null, {opacity: this.model.get('opacity')}
                    );
                }
            },
            onInputChange: function (event_) {
                var $el = $(event_.target);
                var id = $el.attr('id');
                var $fg = this.$el.find("#" + id + ".form-group");
                var input_def = _.find(
                    this.process.get('inputs'), function (item) {
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
                    value = this.inputs_last[id];
                }
                if (value == this.inputs_last[id]) {
                    this.changed = _.without(this.changed, id);
                } else {
                    this.changed = _.union(this.changed, [id]);
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
                    this.missing = _.without(this.missing, id);
                } else {
                    $el.val(value);
                    delete this.errors[id];
                    if (value == null) {
                        $fg.addClass('has-error');
                        this.missing = _.union(this.errors, [id]);
                    } else {
                        $fg.removeClass('has-error');
                        this.missing = _.without(this.missing, id);
                    }
                }
                this.updateButtons();

                if ((id == "sample_latitude") || (id == "sample_longitude")) {
                    this.showSampleMarker();
                }
            },
            fillInputs: function (inputs) {
                if (this.model.get('status') != 'CREATED') {
                    return ;
                }
                // extract defaults
                var parsed = ProcessUtil.parseInputs(
                    this.process.get('inputs'), inputs || {}
                );

                // clear any error label
                this.$el.find(".input-error").remove();

                // fill the form
                $('#txt-name').val(this.model.get('name'));

                var changed = [];
                _.each(parsed.inputs, function (value, key) {
                    this.$el.find("#" + key + ".process-input").val(value);
                    this.$el.find("#" + key + ".form-group").removeClass('has-error');
                    if (value != this.inputs_last[key]) {
                        changed.push(key);
                    }
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

                this.inputs = parsed.inputs;
                this.errors = parsed.errors;
                this.missing = parsed.missing;
                this.changed = changed;

                this.updateButtons();

                this.showSampleMarker();
            },

            updateButtons: function () {
                // allow saving if some input changed and all inputs are correct
                if ((this.changed.length > 0) && (_.isEmpty(this.errors))) {
                    this.$('#btn-save').removeAttr('disabled');
                } else {
                    this.$('#btn-save').attr('disabled', 'disabled');
                }

                // allow submission if all inputs are set to a correct value
                if ((this.missing.length == 0) && (_.isEmpty(this.errors))) {
                    this.$('#btn-submit').removeAttr('disabled');
                } else {
                    this.$('#btn-submit').attr('disabled', 'disabled');
                }
            },

            onShow: function (view) {
                this.listenTo(this.model, 'destroy', this.openManager);
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(Communicator.mediator, 'data:fetch:all', this.refetch);
                this.listenTo(Communicator.mediator, 'map:clicked', this.onMapClicked);
                this.delegateEvents(this.events);
                this.$el.draggable({
                    containment: '#content' ,
                    scroll: false,
                    handle: '.panel-heading'
                });
                this.displaySITSGeometry();
                this.showSampleMarker();
            },
            onRender: function () {
                Communicator.mediator.trigger('map:preview:clear');
                this.fillInputs(this.inputs);
                this.$('#opacity-value').text((100 * this.model.get('opacity') || 0) + "%");
                // opacity slider
                this.$('#opacity-control').append($('<div>').slider({
                    range: "max",
                    max: 100,
                    min: 0,
                    value: 100 * this.model.get('opacity') || 0,
                    slide: _.bind(function(evt, ui) {
                        this.$('#opacity-value').text(ui.value + "%");
                        this.model.set('opacity', ui.value / 100.0, {silent: true});
                        Communicator.mediator.trigger(
                            'map:preview:updateOpacity', ui.value / 100.0
                        );
                    }, this)
                }));
            },
            editMetadata: function () {
                Communicator.mediator.trigger(
                    'object:metadata:edit', this.model
                );
            },
            saveJob: function () {
                var attr = this.model.attributes;
                if ((attr.status == 'CREATED') && attr.owned && (this.changed.length > 0)) {
                    this.$('#btn-save').attr('disabled', 'disabled');
                    this.model.save('inputs', this.inputs, {
                        success: _.bind(function () {
                            this.inputs_last = _.clone(this.inputs);
                            this.fillInputs(this.inputs);
                        }, this),
                        error: _.bind(function () {
                            this.fillInputs(this.inputs);
                        }, this)
                    });
                }
            },
            executeJob: function () {
                // NOTE: Job must be saved before execution.
                var attr = this.model.attributes;
                if ((attr.status == 'CREATED') && attr.owned && (this.changed.length == 0)) {
                    this.$('#btn-submit').attr('disabled', 'disabled');
                    $.ajax(globals.damats.processUrl, {
                        headers: {'X-DAMATS-Job-Id': attr.identifier},
                        type: 'POST',
                        data: ProcessUtil.buildExecuteRequestXML(attr),
                        async: true,
                        cache: false,
                        dataType: 'xml',
                        global: true,
                        error: _.bind(function () {
                            this.fillInputs(this.inputs);
                        }, this),
                        success: _.bind(function (data) {
                            this.refetch();
                        }, this)
                    });
                }
            },
            cloneJob: function () {
                //Communicator.mediator.trigger('job:viewer:clone', this.model);
                Communicator.mediator.trigger('dialog:open:JobCreation', {
                    time_series: this.time_series,
                    process: this.process,
                    inputs: this.model.get('inputs')
                });
            },
            removeJob: function () {
                Communicator.mediator.trigger('job:removal:confirm', this.model);
            },
            openManager: function () {
                Communicator.mediator.trigger('dialog:open:JobsManager', true);
                this.close();
            },
            refetch: function () {
                Communicator.mediator.trigger('job:viewer:fetch', true);
            },
            onClose: function() {
                Communicator.mediator.trigger('map:preview:clear');
                Communicator.mediator.trigger('map:marker:clearAll');
                this.removeSISTGeometry();
            }
        });

        return {JobViewerView: JobViewerView};
    };

    root.define(deps, init);
}).call(this);
