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
                'click #box-process': 'onSelectProcess',
                'click .close': 'close'
            },
            onInputChange: function (event_) {
                console.log("on input change");
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
                        console.log(error);
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
                    this.errors = _.union(this.errors, [id]);
                } else {
                    $fg.removeClass('has-error');
                    this.errors = _.without(this.errors, id);
                    $el.val(value);
                }
                if (this.errors.length == 0) {
                    this.$('#btn-job-create').removeAttr('disabled');
                } else {
                    this.$('#btn-job-create').attr('disabled', 'disabled');
                }
            },
            resetInputs: function (inputs) {
                // extract defaults
                this.inputs = ProcessUtil.parseInputs(
                    this.model.get('process').get('inputs'), inputs || {}
                ).inputs;
                this.$el.find(".input-error").remove();
                this.errors = [];
                // fill the form
                $('#txt-name').val(this.model.get('name'));
                for (var key in this.inputs) {
                    $('#' + key + '.process-input').val(this.inputs[key]);
                }
            },
            onShow: function (view) {
                this.listenTo(this.model, 'change:name', this.onNameChange);
                this.delegateEvents(this.events);
                this.$el.draggable({
                    containment: '#content' ,
                    scroll: false,
                    handle: '.panel-heading'
                });
                this.resetInputs(this.model.get('inputs'));
            },
            onSelectTimeSeries: function () {
                Communicator.mediator.trigger('dialog:open:SITSManager');
            },
            onSelectProcess: function () {
                Communicator.mediator.trigger('dialog:open:ProcessList');
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
                if (!parsed.errors || !parsed.errors.length)
                {
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
