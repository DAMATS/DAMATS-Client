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
        'app',
        'modules/damats/SITSManagerView'
    ];

    function init(
        Backbone,
        Communicator,
        globals,
        App,
        SITSManagerView
    ) {
        var SITSManagerController = Backbone.Marionette.Controller.extend({
            model: new Backbone.Model(),
            collection: globals.damats.time_series,
            view: null,

            initialize: function (options) {
                this.listenTo(Communicator.mediator, 'dialog:open:SITSManager', this.onOpen);
                this.listenTo(Communicator.mediator, 'dialog:close:all', this.onClose);
                this.listenTo(Communicator.mediator, 'dialog:close:SITSManager', this.onClose);
                this.listenTo(Communicator.mediator, 'dialog:toggle:SITSManager', this.onToggle);
                //this.listenTo(Communicator.mediator, 'time_series:removal:proceed', this.onItemRemove);

                this.view = new SITSManagerView.SITSManagerView({
                    model: this.model,
                    collection: this.collection
                });
            },

            isClosed: function () {
                return _.isUndefined(this.view.isClosed) || this.view.isClosed;
            },

            onOpen: function (event_) {
                if (this.isClosed()) {
                    App.viewJob.reset();
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

        return new SITSManagerController();
    };

    root.require(deps, init);
}).call(this);
