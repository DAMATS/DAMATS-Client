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
        'hbs!tmpl/JobsManager',
        'hbs!tmpl/JobsManagerItem',
        'underscore'
    ];

    function init(
        Backbone,
        Communicator,
        globals,
        JobsManagerTmpl,
        JobsManagerItemTmpl
    ) {
        var JobsManagerItemView = Backbone.Marionette.ItemView.extend({
            tagName: 'div',
            className: 'input-group job-item',
            attributes: {
                'data-toggle': 'popover',
                'data-trigger': 'hover'
            },
            template: {type: 'handlebars', template: JobsManagerItemTmpl},
            templateHelpers: function () {
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

                return {
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
                'click .btn-view': 'onView',
                'click .btn-remove-locked': 'onRemoveLocked',
                'click .btn-remove': 'onRemove',
                'click .form-control': 'onView'
            },

            onShow: function (view) {
                this.listenTo(this.model, 'change', this.render);
            },

            onRender: function () {
                this.$el.popover('hide');
                this.$el.popover({
                    html: true,
                    container: 'body',
                    title: _.bind(function() {
                        return this.model.get('status_code');
                    }, this),
                    content: _.bind(function() {
                        var attr = _.extend(this.model.attributes, this.templateHelpers());
                        var time_series = globals.damats.time_series.findWhere(
                            {'identifier': attr.time_series}
                        );
                        var process = globals.damats.processes.findWhere(
                            {'identifier': attr.process}
                        );
                        return (
                            '<div class="job-info-popup">' + attr.status_message +
                            '<br>&nbsp;<table class="table"><tbody>' +
                            '<tr><td>SITS:</td><td>' + (time_series.get('name') || attr.time_series) + '</td></tr>' +
                            '<tr><td>process:</td><td>' + (process.get('name') || attr.process) + '</td></tr>' +
                            '<tr><td>created:</td><td>' + attr.created + '</td></tr>' +
                            '<tr><td>updated:</td><td>' + attr.updated + '</td></tr>' +
                            (attr.description ? '<tr><td colspan="2">' + attr.description + '</td></tr>' : '') +
                            '</tbody><table>' +
                            '</div>'
                        );
                    }, this)
                });
            },


            onReset: function () {
                this.onBrowse();
            },

            onView: function () {
                this.$el.popover('hide');
                Communicator.mediator.trigger('job:viewer:view', this.model);
            },

            onRemove: function () {
                this.$el.popover('hide');
                Communicator.mediator.trigger('job:removal:confirm', this.model);
            },

            onRemoveLocked: function () {
                console.log(this.model.get('identifier') + '.onRemoveLocked()');
            },

            onBeforeDestroy: function () {
                this.$el.popover('destroy');
            }
        });

        var JobsManagerView = Backbone.Marionette.CompositeView.extend({
            itemView: JobsManagerItemView,
            appendHtml: function (collectionView, itemView, index) {
                collectionView.$('#jobs-list').append(itemView.el);
            },
            templateHelpers: function () {
                return {
                    is_fetching: this.collection.is_fetching,
                    fetch_failed: this.collection.fetch_failed,
                    length: this.collection.length,
                    is_empty: this.collection.length < 1
                };
            },
            tagName: 'div',
            className: 'panel panel-default jobs-manager not-selectable',
            template: {type: 'handlebars', template: JobsManagerTmpl},
            events: {
                'click #btn-job-create': 'onCreateClick',
                'click .close': 'close'
            },

            onShow: function (view) {
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.collection, 'update', this.render);
                this.listenTo(this.collection, 'remove', this.render);
                this.listenTo(this.collection, 'add', this.render);
                this.listenTo(this.collection, 'reset', this.render);
                this.delegateEvents(this.events);
                this.$el.draggable({
                    containment: '#content' ,
                    scroll: false,
                    handle: '.panel-heading'
                });
            },

            onCreateClick: function () {
                Communicator.mediator.trigger('dialog:open:JobCreation', true);
            }
        });

        return {JobsManagerView: JobsManagerView};
    };

    root.define(deps, init);
}).call(this);
