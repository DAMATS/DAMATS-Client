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
        'hbs!tmpl/SITSBrowser',
        'hbs!tmpl/SITSBrowserCoverageItem',
        'underscore'
    ];

    function init(
        Backbone,
        Communicator,
        globals,
        SITSBrowserTmpl,
        SITSBrowserCoverageItemTmpl
    ) {

        var SITSBrowserItemView = Backbone.Marionette.ItemView.extend({
            tagName: 'li',
            className: 'list-group-item coverage-item',
            attributes: function () {
                return {id: this.model.get('id')};
            },
            template: {
                type: 'handlebars',
                template: SITSBrowserCoverageItemTmpl
            },
            templateHelpers: function () {
                return {
                    is_selected: this.isSelected
                };
            },
            events: {
                'click': 'onClick'
            },
            initialize: function (options) {
                this.parentModel = options.parentModel;
                this.listenTo(this.parentModel, 'change:selected', this.onSelectionChange);
            },
            onRender: function () {
                this.onSelectionChange();
            },
            onClick: function () {
                this.parentModel.set('selected', this.model.get('id'));
            },
            setLayer: function () {
                /*
                Communicator.mediator.trigger(
                    'map:preview:set', globals.damats.productUrl,
                    this.model.get('id') + ',' +
                    this.model.get('id') + '_outlines'
                );
                */
                Communicator.mediator.trigger('time:change', {
                    start: new Date(this.model.get('t0')),
                    end: new Date(this.model.get('t1'))
                });
                Communicator.mediator.trigger(
                    'date:tick:set', new Date(this.model.get('t0'))
                );
            },
            onSelectionChange: function () {
                var previous = this.parentModel.previous('selected');
                var current = this.parentModel.get('selected');
                var id = this.model.get('id');
                var className = 'list-group-item-info';
                if ((id == current) && (id != previous)) {
                    this.$el.addClass(className);
                    this.setLayer();
                } else if ((id != current) && (id == previous)) {
                    this.$el.removeClass(className);
                }
            },
            isSelected: function () {
                var selected = this.parentModel.get('selected');
                return this.model.get('id') == selected;
            }
        });

        var SITSBrowserView = Backbone.Marionette.CompositeView.extend({
            itemView: SITSBrowserItemView,
            itemViewOptions : function () {
                return {
                    parentModel: this.model
                };
            },
            appendHtml: function (collectionView, itemView, index) {
                collectionView.$('#coverage-list').append(itemView.el);
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
            className: 'panel panel-default sits-browser not-selectable',
            template: {type: 'handlebars', template: SITSBrowserTmpl},
            events: {
                'click #btn-focus': 'focusToSelection',
                'click #btn-open-manager': 'openManager',
                'click #btn-open-editor': 'openEditor',
                'click #btn-refetch': 'refetch',
                'click #btn-process': 'processSITS',
                'click #btn-delete': 'removeSITS',
                'click #btn-first': 'selectFirst',
                'click #btn-last': 'selectLast',
                'click #btn-prev': 'selectPrevious',
                'click #btn-next': 'selectNext',
                'click #btn-current': 'scrollToCurrent',
                'click .object-metadata': 'editMetadata',
                'click .close': 'close'
            },
            initialize: function (options) {
                this.sourceModel = options.sourceModel;
            },
            onShow: function (view) {
                this.listenTo(this.sourceModel, 'destroy', this.openManager);
                this.listenTo(this.sourceModel, 'change', this.onSourceModelChange);
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.collection, 'sync', this.render);
                this.listenTo(this.collection, 'update', this.render);
                this.listenTo(this.collection, 'reset', this.render);
                this.listenTo(this.collection, 'add', this.render);
                this.listenTo(this.collection, 'remove', this.render);
                this.listenTo(this.collection, 'fetch:start', this.render);
                this.listenTo(this.collection, 'fetch:stop', this.render);
                this.listenTo(Communicator.mediator, 'product:selected', this.selectById);
                this.listenTo(Communicator.mediator, 'data:fetch:all', this.refetch);
                this.delegateEvents(this.events);
                this.$el.draggable({
                    containment: '#content' ,
                    scroll: false,
                    handle: '.panel-heading'
                });
                Communicator.mediator.trigger('date:selection:disable')
                Communicator.mediator.trigger(
                    'map:layer:show:exclusive', this.model.get('identifier')
                );
                this.displaySITSGeometry();
                this.focusToSelection();
                Communicator.mediator.trigger('time:change', {
                    start: new Date(this.model.get('selection').toi.start),
                    end: new Date(this.model.get('selection').toi.end)
                });
            },
            onClose: function () {
                Communicator.mediator.trigger('map:layer:hide:all');
                Communicator.mediator.trigger('date:tick:remove');
                this.removeSISTGeometry()
            },
            onRender: function () {
                this.scrollToCurrent();
            },
            onSourceModelChange() {
                this.model.set(this.sourceModel.changedAttributes());
                this.refreshSITSGeometry();
            },
            editMetadata: function () {
                Communicator.mediator.trigger(
                    'object:metadata:edit', this.sourceModel
                );
            },
            refreshSITSGeometry: function () {
                this.removeSISTGeometry();
                this.displaySITSGeometry();
            },
            removeSISTGeometry: function () {
                Communicator.mediator.trigger('map:geometry:remove:all')
            },
            displaySITSGeometry: function () {
                // TODO: find a better place for the style configuration
                function coords_to_geom(coords) {
                    return new OpenLayers.Geometry.MultiPolygon(_.map(
                        coords,
                        function (item) {
                            return new OpenLayers.Geometry.Polygon(
                                new OpenLayers.Geometry.LinearRing(
                                    _.map(item, function (xy) {
                                        return new OpenLayers.Geometry.Point(
                                            xy[0], xy[1]
                                        );
                                    })
                                )
                            )
                        }
                    ));
                };
                // clear the geometry layer
                this.removeSISTGeometry()
                // display the selected polygon
                Communicator.mediator.trigger('map:geometry:add', {
                    geometry: coords_to_geom(
                        this.sourceModel.get('selection_area')
                    ),
                    attributes: {
                        identifer: this.sourceModel.get('identifier'),
                        type: 'selected-area'
                    },
                    style: {
                        fill: false,
                        stroke: true,
                        strokeColor: '#ffff88',
                        strokeOpacity: 0.6,
                        strokeWidth: 2.5,
                        strokeDashstyle: 'dot',
                    }
                });
                // display the selection polygon
                Communicator.mediator.trigger('map:geometry:add', {
                    geometry: coords_to_geom(
                        this.sourceModel.get('selection_area')
                    ),
                    attributes: {
                        identifer: this.sourceModel.get('identifier'),
                        type: 'selection-area'
                    },
                    style: {
                        fill: false,
                        stroke: true,
                        strokeColor: '#ffff88',
                        strokeOpacity: 0.6,
                        strokeWidth: 2.5,
                    }
                });
                // display the CIA
                Communicator.mediator.trigger('map:geometry:add', {
                    geometry: coords_to_geom(
                        this.sourceModel.get('common_intersection_area')
                    ),
                    attributes: {
                        identifer: this.sourceModel.get('identifier'),
                        type: 'common-area'
                    },
                    style: {
                        fill: false,
                        stroke: true,
                        strokeColor: '#88ffff',
                        strokeOpacity: 0.5,
                        strokeWidth: 2.5,
                    }
                });
            },
            processSITS: function () {
                Communicator.mediator.trigger(
                    'dialog:open:JobCreation', {'sits': this.sourceModel}
                );
            },
            removeSITS: function () {
                if (this.sourceModel.get('editable')) {
                    Communicator.mediator.trigger(
                        'time_series:removal:confirm', this.sourceModel
                    );
                }
            },
            scrollTo: function (id) {
                var $list = this.$('#coverage-list');
                var $item = this.$('#' + id);
                if ($item.get().length < 1) return;
                $list.scrollTop(
                    $list.scrollTop() + $item.offset().top - $list.offset().top
                );
            },
            getIndexOf: function (id) {
                 // TODO: Change to findIndex after upgrading Underscore.js
                var model = this.collection.find(function (model) {
                    return model.get('id') == id;
                });
                return this.collection.indexOf(model);
            },
            selectById: function(selected) {
                if (selected != this.model.get('selected'))
                {
                    this.model.set('selected', selected);
                    this.scrollTo(selected);
                }
            },
            selectByIndex: function (index) {
                if (this.collection.length < 1) return;
                index = index % this.collection.length;
                if (index < 0) {
                    index += this.collection.length;
                }
                this.selectById(this.collection.at(index).get('id'));
            },
            selectFirst: function () {
                this.selectByIndex(0);
            },
            selectLast: function () {
                this.selectByIndex(-1);
            },
            scrollToCurrent: function () {
                this.scrollTo(this.model.get('selected'));
            },
            selectPrevious: function () {
                var index = this.getIndexOf(this.model.get('selected'));
                this.selectByIndex(Math.max(0, index - 1));
            },
            selectNext: function () {
                var length = this.collection.length;
                var index = this.getIndexOf(this.model.get('selected'));
                this.selectByIndex(Math.min(length - 1, index + 1));
            },
            openManager: function () {
                Communicator.mediator.trigger('dialog:open:SITSManager', true);
            },
            openEditor: function () {
                if (this.sourceModel.get('editable')) {
                    Communicator.mediator.trigger(
                        'sits:editor:edit', this.sourceModel
                    );
                }
            },
            refetch: function () {
                Communicator.mediator.trigger('sits:browser:fetch', true);
            },
            focusToSelection: function () {
            /*
                if (this.collection.length < 1) { return ; }
                var ext = this.collection.reduce(function (ext, model) {
                    var x0 = model.get('x0');
                    var x1 = model.get('x1');
                    var y0 = model.get('y0');
                    var y1 = model.get('y1');
                    return {
                        x0: ext.x0 < x0 ? ext.x0 : x0,
                        y0: ext.y0 < y0 ? ext.y0 : y0,
                        x1: ext.x1 > x1 ? ext.x1 : x1,
                        y1: ext.y1 > y1 ? ext.y1 : y1
                    };
                }, {
                    x0: Number.POSITIVE_INFINITY,
                    y0: Number.POSITIVE_INFINITY,
                    x1: Number.NEGATIVE_INFINITY,
                    y1: Number.NEGATIVE_INFINITY
                });
                Communicator.mediator.trigger('map:set:extent', [
                    ext.x0, ext.y0, ext.x1, ext.y1
                ]);
            */
                Communicator.mediator.trigger(
                    'map:set:extent', this.model.get('selection_extent')
                )
                Communicator.mediator.trigger('timeslider:zoom', {
                    start: new Date(this.model.get('selection').toi.start),
                    end: new Date(this.model.get('selection').toi.end)
                });
            }
        });

        return {SITSBrowserView: SITSBrowserView};
    };

    root.define(deps, init);
}).call(this);
