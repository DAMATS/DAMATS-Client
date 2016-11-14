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
        'hbs!tmpl/JobViewer',
        'modules/damats/ProcessUtil',
        'underscore'
    ];

    function init(
        Backbone,
        Communicator,
        globals,
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
                    "CREATED": "The job has not been started yet.",
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

                return {
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
                        editable
                    )
                };
            },
            events: {
                'change .process-input': 'onInputChange',
                'click #btn-open-manager': 'openManager',
                'click #btn-refetch': 'refetch',
                'click #btn-delete': 'removeJob',
                'click #btn-clone': 'cloneJob',
                'click #btn-save': 'saveJob',
                'click #btn-submit': 'executeJob',
                'click .object-metadata': 'editMetadata',
                'click .close': 'close'
            },
            initialize: function (options) {
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
                        console.log(error);
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
                    this.errors = _.union(this.errors, [id]);
                } else {
                    $fg.removeClass('has-error');
                    this.errors = _.without(this.errors, id);
                    $el.val(value);
                }
                if (this.errors.length == 0) {
                    if (this.changed.length == 0) {
                        this.$('#btn-save').attr('disabled', 'disabled');
                        this.$('#btn-submit').removeAttr('disabled');
                    } else {
                        this.$('#btn-save').removeAttr('disabled');
                        this.$('#btn-submit').attr('disabled', 'disabled');
                    }
                } else {
                    this.$('#btn-submit').attr('disabled', 'disabled');
                    this.$('#btn-save').attr('disabled', 'disabled');
                }
            },
            fillInputs: function (inputs) {
                if (this.model.get('status') != 'CREATED') {
                    return ;
                }
                console.log(this.model.attributes);
                // extract defaults
                this.inputs = ProcessUtil.parseInputs(
                    this.process.get('inputs'), inputs || this.inputs_last 
                ).inputs;
                this.$el.find(".input-error").remove();
                this.errors = [];
                // fill the form
                $('#txt-name').val(this.model.get('name'));
                var changed = [];
                for (var key in this.inputs) {
                    $('#' + key + '.process-input').val(this.inputs[key]);
                    if (this.inputs[key] != this.inputs_last[key]) {
                        changed.push(key);
                    }
                }
                this.changed = changed;
                if (this.changed.length == 0) {
                    this.$('#btn-save').attr('disabled', 'disabled');
                    this.$('#btn-submit').removeAttr('disabled');
                } else {
                    this.$('#btn-save').removeAttr('disabled');
                    this.$('#btn-submit').attr('disabled', 'disabled');
                }
            },
            onShow: function (view) {
                this.listenTo(this.model, 'destroy', this.openManager);
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(Communicator.mediator, 'data:fetch:all', this.refetch);
                this.delegateEvents(this.events);
                this.$el.draggable({
                    containment: '#content' ,
                    scroll: false,
                    handle: '.panel-heading'
                });
                this.fillInputs(this.inputs); // do not remove
            },
            onRender: function () {
                this.fillInputs(this.inputs);
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
                            console.log(data);
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
            },
            refetch: function () {
                Communicator.mediator.trigger('job:viewer:fetch', true);
            }
        });

        return {JobViewerView: JobViewerView};
    };

    root.define(deps, init);
}).call(this);
