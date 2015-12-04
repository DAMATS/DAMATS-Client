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
        'modules/damats/DataModelsAndCollections',
        'modules/damats/SITSBrowserView'
    ];

    function init(
        Backbone,
        Communicator,
        globals,
        App,
        DataModels,
        SITSBrowserView
    ) {
        var SITSBrowserController = Backbone.Marionette.Controller.extend({
            model: null,
            collection: null,
            view: null,

            initialize: function (options) {
                this.listenTo(Communicator.mediator, 'sits:browser:browse', this.onBrowse);
                this.listenTo(Communicator.mediator, 'dialog:open:SITSBrowser', this.onOpen);
                this.listenTo(Communicator.mediator, 'dialog:close:SITSBrowser', this.onClose);
                this.listenTo(Communicator.mediator, 'dialog:toggle:SITSBrowser', this.onToggle);
            },

            onBrowse: function (sits_model) {
                if (
                    !this.model || !this.collection || (
                        this.model.get('identifier') !=
                        sits_model.get('identifier')
                    )
                ) {
                    this.collection = new DataModels.CoverageCollection();
                    this.collection.url = sits_model.url();
                    this.collection.fetch();
                }
                this.model = sits_model;

                this.view = new SITSBrowserView.SITSBrowserView({
                    model: this.model,
                    collection: this.collection
                });

                this.onOpen(true);
            },

            isClosed: function () {
                return _.isUndefined(this.view.isClosed) || this.view.isClosed;
            },

            onOpen: function (event_) {
                if (this.view && this.isClosed()) {
                    App.viewContent.show(this.view);
                }
            },

            onClose: function (event_) {
                if (this.view && !this.isClosed()) {
                    this.view.close();
                }
            },

            onToggle: function (event_) {
                if (this.view && this.isClosed()) {
                    this.onOpen(event_);
                } else {
                    this.onClose(event_);
                }
            }
        });

        return new SITSBrowserController();
    };

    root.require(deps, init);
}).call(this);
