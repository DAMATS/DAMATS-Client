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
        'hbs!tmpl/SITSBrowser',
        'hbs!tmpl/SITSBrowserCoverageItem',
        'underscore'
    ];

    function init(
        Backbone,
        Communicator,
        SITSBrowserTmpl,
        SITSBrowserCoverageItemTmpl
    ) {
        var SITSBrowserItemView = Backbone.Marionette.ItemView.extend({
            tagName: 'li',
            className: 'list-group-item coverage-item',
            template: {
                type: 'handlebars',
                template: SITSBrowserCoverageItemTmpl
            },
            templateHelpers: function () {
                return {
                    is_selected: this.is_selected
                };
            },
            events: {
                'click': 'onClick'
            },
            initialize: function (options) {
                this.parentModel = options.parentModel;
                //this.listenTo(this.parentModel, 'change:selection', this.reset);
                //this.is_selected = false;
            },
            onShow: function () {
            /*
                if (this.is_selected) {
                    this.$el.addClass("coverage-item-selected");
                }
            */
            },
            onClick: function () {
                console.log(this.model.get('id'));
                //this.is_selected = true;
                //this.$el.addClass("coverage-item-selected");
                this.$el.addClass('label-primary');
                //this.parentModel.set('selection', this.model);
                Communicator.mediator.trigger(
                    'time:change', {
                        start: new Date(this.model.get('t0')),
                        end: new Date(this.model.get('t1'))
                });
                /*
                Communicator.mediator.trigger("map:set:extent", [
                    this.model.get('x0'), this.model.get('y0'),
                    this.model.get('x1'), this.model.get('y1')
                ]);
                */
            },
            reset: function () {
            /*
                if(this.is_selected) {
                    this.is_selected = false;
                    this.$el.removeClass("coverage-item-selected");
                }
            */
            },
            isSelected: function () {
            /*
                var selected = (
                    this.parentModel ? this.parentModel.get('selection') : null
                );
                return this.model.get('identifier') == selected;
            */
                return false;
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
                    length: this.collection.length,
                    is_empty: this.collection.length < 1
                };
            },
            tagName: 'div',
            className: 'panel panel-default sits-browser not-selectable',
            template: {type: 'handlebars', template: SITSBrowserTmpl},
            events: {
                'click #btn-focus': 'onFocusClick',
                'click .close': 'close'
            },

            onShow: function (view) {
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.collection, 'sync', this.render);
                this.listenTo(this.collection, 'update', this.render);
                this.listenTo(this.collection, 'reset', this.render);
                this.listenTo(this.collection, 'add', this.render);
                this.listenTo(this.collection, 'remove', this.render);
                this.delegateEvents(this.events);
                Communicator.mediator.trigger(
                    'map:layer:show:exclusive', this.model
                );
            },

            onFocusClick: function () {
                if (this.collection.length < 1) { return ; }
                var ext = this.collection.reduce(function (ext, model) {
                    console.log(ext);
                    console.log(model);
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
            }
        });

        return {SITSBrowserView: SITSBrowserView};
    };

    root.define(deps, init);
}).call(this);
