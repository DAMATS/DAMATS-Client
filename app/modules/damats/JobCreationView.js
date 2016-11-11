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
        'hbs!tmpl/JobCreation',
        'modules/damats/ProcessUtil',
        'underscore',
        'bootstrap-datepicker',
        'bootstrap-select'
    ];

    function init(
        Backbone,
        Communicator,
        JobCreationTmpl,
        ProcessUtil
    ) {
        var JobCreationView = Backbone.Marionette.ItemView.extend({
            className: 'panel panel-default job-creation not-selectable',
            template: {type: 'handlebars', template: JobCreationTmpl},
            templateHelpers: function () {
                var attr = this.model.attributes;
                return {
                    'sits_attr': attr.sits ? attr.sits.attributes : {},
                    'process_attr': attr.process ? attr.process.attributes : {}
                };
            },
            events: {
                //'click #btn-draw-bbox': 'onBBoxClick',
                //'click #btn-clear-bbox': 'onClearClick',
                //'click #btn-sits-create': 'onCreateClick',
                //'change #txt-minx': 'onBBoxFormChange',
                //'change #txt-maxx': 'onBBoxFormChange',
                //'change #txt-miny': 'onBBoxFormChange',
                //'change #txt-maxy': 'onBBoxFormChange',
                //'hide': 'onCloseTimeWidget',
                'click #btn-job-create': 'onCreateClick',
                'change #txt-name': 'onNameFormChange',
                'click #box-sits': 'onSelectSITS',
                'click #box-process': 'onSelectProcess',
                'click .close': 'close'
            },
            onShow: function (view) {
                this.listenTo(this.model, 'change:name', this.onNameChange);
                this.delegateEvents(this.events);
                this.$el.draggable({
                    containment: '#content' ,
                    scroll: false,
                    handle: '.panel-heading'
                });
                var name = this.model.get('name');
                if (name) {
                    $('#txt-name').val(name);
                }
            },
            onSelectSITS: function () {
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
                    this.model.get('process').get('inputs'), {}
                );
                if (!parsed.errors || !parsed.errors.length)
                {
                    this.model.set('inputs', parsed.inputs);
                } else {
                    console.error("Input parsing error!")
                    console.error(parsed.errors);
                    return
                    //throw "Input parsing error!";
                }
                Communicator.mediator.trigger('job:creation:create', true);
            }
        });

        return {JobCreationView: JobCreationView};
    };

    root.define(deps, init);
}).call(this);
