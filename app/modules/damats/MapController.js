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
        'app'
    ];

    function init(
        Backbone,
        Communicator,
        globals,
        App
    ) {
        var MapController = Backbone.Marionette.Controller.extend({
            initialize: function (options) {
                this.listenTo(globals.damats.sources, 'add', this.onAddLayer);
                this.listenTo(globals.damats.sources, 'remove', this.onRemoveLayer);
                this.listenTo(globals.damats.time_series, 'add', this.onAddLayer);
                this.listenTo(globals.damats.time_series, 'remove', this.onRemoveLayer);
                this.listenTo(Communicator.mediator, 'map:layer:show:exclusive', this.showLayerExlusive);
                this.listenTo(Communicator.mediator, 'map:layer:show', this.showLayer);
                this.listenTo(Communicator.mediator, 'map:layer:hide', this.hideLayer);
                // TODO Hide them all!
            },
            onAddLayer: function (model) {
                var product = globals.damats.getProduct(
                    model.get('identifier'), model.get('description'), true
                );
                globals.products.add(product);
                Communicator.mediator.trigger('map:layer:add', product);
            },
            onRemoveLayer: function (model) {
                var product = globals.products.findWhere({
                    'name': model.get('identifier')
                });
                if (product) {
                    Communicator.mediator.trigger('map:layer:remove', product);
                    globals.products.remove(product);
                }
            },
            showLayerExlusive: function (model) {
                var that = this;
                globals.products.each(function (model) {
                    if (model.get('visible')) {
                        that.changeLayer({
                            name: model.get('name'),
                            isBaseLayer: false,
                            visible: false
                        });
                    }
                });
                this.showLayer(model);
            },
            showLayer: function (model) {
                this.changeLayer({
                    name: model.get('identifier'),
                    isBaseLayer: false,
                    visible: true
                });
            },
            hideLayer: function (model) {
                this.changeLayer({
                    name: model.get('identifier'),
                    isBaseLayer: false,
                    visible: true
                });
            },
            changeLayer: function (options) {
                var product = globals.products.find(function (model) {
                    return model.get('name') == options.name;
                });
                if (product) {
                    product.set('visible', options.visible);
                    Communicator.mediator.trigger('map:layer:change', options);
                }
            }
        });
        return new MapController();
    }

    root.require(deps, init);
}).call(this);
