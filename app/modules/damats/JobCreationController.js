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
        'app',
        'modules/damats/JobCreationModel',
        'modules/damats/JobCreationView'
    ];

    function init(
        Backbone,
        Communicator,
        globals,
        App,
        JobCreationModel,
        JobCreationView
    ) {
        function getDefaultJobName() {
            var date = new Date();
            var name = 'Job ';
            name += String('000' + date.getFullYear()).slice(-4) ;
            name += '-' + String('0' + (1 + date.getMonth())).slice(-2);
            name += '-' + String('0' + date.getDate()).slice(-2);
            name += ' ' + String('0' + date.getHours()).slice(-2);
            name += ':' + String('0' + date.getMinutes()).slice(-2);
            name += ':' + String('0' + date.getSeconds()).slice(-2);
            return name;
        };

        var JobCreationController = Backbone.Marionette.Controller.extend({
            model: new JobCreationModel.JobCreationModel(),
            collection: globals.damats.sources,
            view: null,

            initialize: function (options) {
                this.listenTo(Communicator.mediator, 'job:creation:create', this.onCreate);
                this.listenTo(Communicator.mediator, 'job:creation:name:set', this.onNameChange);
                this.listenTo(Communicator.mediator, 'dialog:open:JobCreation', this.onOpen);
                this.listenTo(Communicator.mediator, 'dialog:close:JobCreation', this.onClose);
                this.listenTo(Communicator.mediator, 'dialog:toggle:JobCreation', this.onToggle);

                this.view = new JobCreationView.JobCreationView({
                    model: this.model,
                    collection: this.collection
                });
            },

            onNameChange: function (name) {
                this.model.set('name', name);
            },

            onCreate: function () {
            /*
                var model = this.model;
                globals.damats.jobs.create({ // new object
                    editable: true,
                    source: this.model.get('source'),
                    name: this.model.get('name'),
                    description: null,
                    selection: {
                        'aoi': this.model.get('AoI'),
                        'toi': this.model.get('ToI')
                    }
                }, { // create options
                    wait: true,
                    success: function () {
                        model.set('is_saved', true);
                        Communicator.mediator.trigger(
                            'dialog:open:Job', true
                        );
                    }
                });
            */
            },

            isClosed: function () {
                return _.isUndefined(this.view.isClosed) || this.view.isClosed;
            },

            onOpen: function (event_) {
                if (this.model.get('is_saved')) {
                    // set a new Job
                    this.model.set('is_saved', false);
                    this.model.set('name', getDefaultJobName());
                }
                if (this.isClosed()) {
                    App.viewContent.show(this.view);
                }
            },

            onClose: function (event_) {
                if (!this.isClosed()) {
                    this.view.close();
                }
            },

            onToggle: function (event_) {
                if (this.isClosed()) {
                    this.onOpen(event_);
                } else {
                    this.onClose(event_);
                }
            }
        });

        return new JobCreationController();
    };

    root.require(deps, init);
}).call(this);
