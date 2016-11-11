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
                this.listenTo(Communicator.mediator, 'sits:selected', this.setSITS);
                this.listenTo(Communicator.mediator, 'sits:browser:browse', this.setSITS);
                this.listenTo(Communicator.mediator, 'sits:editor:edit', this.setSITS);
                this.listenTo(Communicator.mediator, 'sits:removed', this.unsetSITS);
                this.listenTo(Communicator.mediator, 'process:selected', this.setProcess);
                this.listenTo(Communicator.mediator, 'job:submit', this.submitJob);
                this.listenTo(Communicator.mediator, 'job:name:set', this.setJobName);
                this.listenTo(Communicator.mediator, 'dialog:open:JobCreation', this.onOpen);
                this.listenTo(Communicator.mediator, 'dialog:close:JobCreation', this.onClose);
                this.listenTo(Communicator.mediator, 'dialog:toggle:JobCreation', this.onToggle);

                this.view = new JobCreationView.JobCreationView({
                    model: this.model,
                });
            },

            setName: function (name) {
                this.model.set('name', name);
                console.log("JobCreationController::setName");
                console.log(this.model.attributes);
            },
            setProcess: function (process) {
                this.model.set('process', process);
                console.log(this.model.attributes);
            },
            setSITS: function (sits) {
                this.model.set('sits', sits);
                console.log(this.model.attributes);
            },
            unsetSITS: function (sits) {
                var sitsModel = this.model.get('sits');
                if (sitsModel && (sits.get('identifier') == sitsModel.get('identifier'))) {
                    this.model.set('sits', null);
                }
                console.log(this.model.attributes);
            },
            submitJob: function () {
                console.log("JobCreationController::submitJob");
            },

            onCreate: function () {
                globals.damats.jobs.create({ // new object
                    process: this.model.get('process').get('identifier'),
                    time_series: this.model.get('sits').get('identifier'),
                    name: this.model.get('name'),
                    description: null,
                    inputs: this.model.get('inputs')
                }, { // create options
                    wait: true,
                    success: _.bind(function (new_model) {
                        this.model.set('is_saved', true);
                        Communicator.mediator.trigger(
                            'job:viewer:view', new_model
                            //'dialog:open:JobsManager', true
                        );
                    }, this)
                });
            },

            isClosed: function () {
                return _.isUndefined(this.view.isClosed) || this.view.isClosed;
            },

            onOpen: function (params) {
                console.log("JobCreationController::onOpen");
                console.log(params);
                // check if both SITS and process are selected
                if (params && params.process) this.setProcess(params.process)
                if (params && params.sits) this.setSITS(params.sits)

                // TODO user notification
                if (!this.model.get('sits')) {
                    Communicator.mediator.trigger('dialog:open:SITSManager');
                    return
                } else if (!this.model.get('process')) {
                    Communicator.mediator.trigger('dialog:open:ProcessList');
                    return
                }
                console.log("JobCreationController::onOpen OK");
                // reset job name if necessary
                if (this.model.get('is_saved')) {
                    this.model.set('is_saved', false);
                    this.model.set('name', getDefaultJobName());
                }
                console.log(this.view)
                if (this.isClosed()) {
                    console.log(this.view)
                    App.viewContent.show(this.view);
                }
            },

            onClose: function () {
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
