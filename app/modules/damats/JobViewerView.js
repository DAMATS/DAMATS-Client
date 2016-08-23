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
        'underscore'
    ];

    function init(
        Backbone,
        Communicator,
        globals,
        JobViewerTmpl
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
                var process_model = globals.damats.processes.findWhere(
                    {'identifier': this.model.get('process')}
                );
                var process = null;
                if (process_model) {
                    process = process_model.attributes
                } else {
                    process = {
                        'identifier': this.model.get('process'),
                        'name': 'Invalid process.'
                    };
                }

                // resolve the time series model
                var time_series_model = globals.damats.time_series.findWhere(
                    {'identifier': this.model.get('time_series')}
                );
                var time_series = null;
                if (time_series_model) {
                    time_series = time_series_model.attributes
                } else {
                    time_series = {
                        'identifier': this.model.get('process'),
                        'name': 'Invalid SITS.'
                    };
                }

                return {
                    process: process,
                    time_series: time_series,
                    is_submittable: status_ == "CREATED",
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
                'click #btn-clone': 'cloneJob',
                'click #btn-open-manager': 'openManager',
                'click #btn-refetch': 'refetch',
                'click #btn-delete': 'removeJob',
                'click .close': 'close'
            },
            initialize: function (options) {
            },
            onShow: function (view) {
                this.listenTo(this.model, 'destroy', this.openManager);
                this.listenTo(this.model, 'change', this.render);
                this.delegateEvents(this.events);
                this.$el.draggable({
                    containment: '#content' ,
                    scroll: false,
                    handle: '.panel-heading'
                });
            },
            //onClose: function () {},
            //onRender: function () {},
            cloneJob: function () {},
            removeJob: function () {
                Communicator.mediator.trigger('job:removal:confirm', this.model);
            },
            openManager: function () {
                Communicator.mediator.trigger('dialog:open:JobsManager', true);
            },
            refetch: function () {
                Communicator.mediator.trigger('job:viewer:fetch', true);
            },
        });

        return {JobViewerView: JobViewerView};
    };

    root.define(deps, init);
}).call(this);
