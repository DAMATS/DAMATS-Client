//------------------------------------------------------------------------------
//
// Project: DAMATS Client
// Authors: Martin Paces <martin.paces@eox.at>
//          Daniel Santillan <daniel.santillan@eox.at>
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
        'app',
        'modules/damats/SITSCreationModel',
        'modules/damats/SITSCreationView'
    ];

    function init(
        Backbone,
        Communicator,
        globals,
        App,
        SITSCreationModel,
        SITSCreationView
    ) {
        function getDefaultSITSName() {
            var date = new Date();
            var name = 'SITS ';
            name += String('000' + date.getFullYear()).slice(-4) ;
            name += '-' + String('0' + (1 + date.getMonth())).slice(-2);
            name += '-' + String('0' + date.getDate()).slice(-2);
            name += ' ' + String('0' + date.getHours()).slice(-2);
            name += ':' + String('0' + date.getMinutes()).slice(-2);
            name += ':' + String('0' + date.getSeconds()).slice(-2);
            return name;
        };

        var SITSCreationController = Backbone.Marionette.Controller.extend({
            model: new SITSCreationModel.SITSCreationModel(),
            collection: globals.damats.sources,
            view: null,

            initialize: function (options) {
                //this.model.set('products', {});
                //this.listenTo(Communicator.mediator, 'map:layer:change', this.onChangeLayer);
                this.listenTo(Communicator.mediator, 'sits:creation:create', this.onCreate);
                this.listenTo(Communicator.mediator, 'sits:creation:name:set', this.onNameChange);
                this.listenTo(Communicator.mediator, 'time:change', this.onTOIChange);
                this.listenTo(Communicator.mediator, 'selection:changed', this.onAOIChange);
                this.listenTo(Communicator.mediator, 'selection:bbox:changed', this.onAOIChange);
                //this.listenTo(Communicator.mediator, 'dialog:open:download', this.onDownloadToolOpen);
                this.listenTo(Communicator.mediator, 'dialog:open:SITSCreation', this.onOpen);
                this.listenTo(Communicator.mediator, 'dialog:close:SITSCreation', this.onClose);
                this.listenTo(Communicator.mediator, 'dialog:toggle:SITSCreation', this.onToggle);

                this.view = new SITSCreationView.SITSCreationView({
                    model: this.model,
                    collection: this.collection
                });
            },

            onNameChange: function (name) {
                this.model.set('name', name);
            },

            onTOIChange: function (time) {
                this.model.set('ToI', time);
            },

            onAOIChange: function (bbox) {
                if (bbox != null) {
                    if (bbox.CLASS_NAME == 'OpenLayers.Geometry.Polygon') {
                        this.model.set('AoI', {
                            left: bbox.bounds.left,
                            right: bbox.bounds.right,
                            bottom: bbox.bounds.bottom,
                            top: bbox.bounds.top
                        });
                    } else {
                        this.model.set('AoI', {
                            left: bbox.left,
                            right: bbox.right,
                            bottom: bbox.bottom,
                            top: bbox.top
                        });
                    }
                } else {
                    this.model.set('AoI', null);
                }
            },

            completnessCheck: function () {
                // Check that all required inputs are provided.
                if (
                    this.model.get('ToI') != null &&
                    this.model.get('AoI') != null &&
                    this.model.get('source') != null
                ) {
                    Communicator.mediator.trigger(
                        'selection:enabled', {id: 'download', enabled: true}
                    );
                } else {
                    Communicator.mediator.trigger(
                        'selection:enabled', {id: 'download', enabled: false}
                    );
                }
            },

            isClosed: function () {
                return _.isUndefined(this.view.isClosed) || this.view.isClosed;
            },

            onCreate: function () {
                var model = this.model;
                globals.damats.time_series.create({ // new object
                    locked: false,
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
                            'dialog:open:SITSManager', true
                        );
                    }
                });
            },

            onOpen: function (event_) {
                if (this.model.get('is_saved')) {
                    // set a new SIST
                    this.model.set('is_saved', false);
                    this.model.set('name', getDefaultSITSName());
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

        return new SITSCreationController();
    };

    root.require(deps, init);
}).call(this);
