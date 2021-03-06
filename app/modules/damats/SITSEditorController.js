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
        'modules/damats/SITSEditorView'
    ];

    function init(
        Backbone,
        Communicator,
        globals,
        App,
        DataModels,
        SITSEditorView
    ) {

        var SITSEditorController = Backbone.Marionette.Controller.extend({
            model: null,
            collection: null,
            view: null,
            initialize: function (options) {
                this.listenTo(Communicator.mediator, 'sits:editor:edit', this.edit);
                this.listenTo(Communicator.mediator, 'sits:editor:clone', this.clone);
                this.listenTo(Communicator.mediator, 'sits:editor:fetch', this.fetch);
                this.listenTo(Communicator.mediator, 'dialog:open:SITSEditor', this.onOpen);
                this.listenTo(Communicator.mediator, 'dialog:close:SITSEditor', this.onClose);
                this.listenTo(Communicator.mediator, 'dialog:toggle:SITSEditor', this.onToggle);
            },
            edit: function (model) {
                this.onClose();
                if (!this.model || !this.collection || (
                    this.model.get('identifier') != model.get('identifier')
                )) {
                    this.collection = new DataModels.CoverageCollection();
                    this.collection.url = model.url();
                }
                this.sourceModel = model; // keep reference to the orig. model
                this.fetch(); // always refresh the collection
                this.model = model.clone(); // but work with a copy of the model
                this.view = new SITSEditorView.SITSEditorView({
                    sourceModel: this.sourceModel,
                    model: this.model,
                    collection: this.collection
                });
                this.onOpen(true);
            },
            fetch: function () {
                this.sourceModel.fetch();
                this.collection.fetch({data: $.param({list: true, all: true})});
            },
            clone: function (model) {
                var new_attributes = _.pick(model.attributes, [
                    'name', 'description', 'source', 'selection'
                ]);
                new_attributes.editable = true;
                new_attributes.template = model.get('identifier');
                globals.damats.time_series.create(new_attributes, {
                    wait: true,
                    success: function (model) {
                        model.set('is_saved', true);
                        Communicator.mediator.trigger(
                            'sits:editor:edit', model
                        );
                    }
                });
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

        return new SITSEditorController();
    };

    root.require(deps, init);
}).call(this);
