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
        'hbs!tmpl/SITSEditor',
        'hbs!tmpl/SITSEditorCoverageItem',
        'underscore'
    ];

    function init(
        Backbone,
        Communicator,
        SITSEditorTmpl,
        SITSEditorCoverageItemTmpl
    ) {
        var SITSEditorItemView = Backbone.Marionette.ItemView.extend({
            tagName: 'div',
            className: 'input-group coverage-item',
            attributes: function () {
                return {id: this.model.get('id')};
            },
            template: {
                type: 'handlebars',
                template: SITSEditorCoverageItemTmpl
            },
            templateHelpers: function () {
                return {
                    is_saving: this.is_saving,
                    is_selected: this.isSelected()
                };
            },
            events: {
                'click #item': 'onClick',
                'click #checkbox': 'onCheckboxClick'
            },
            initialize: function (options) {
                this.parentModel = options.parentModel;
                this.listenTo(this.model, 'save:stop', this.onSaveStop);
                this.listenTo(this.parentModel, 'change:selected', this.onSelectionChange);
                this.is_saving = false;
            },
            onRender: function () {
                this.onSelectionChange();
            },
            onCheckboxClick: function () {
                var model = this.model;
                if (!this.is_saving) {
                    this.model.save('in', !this.model.get('in'), {
                        error: function () {
                            // in case of a save failure revert
                            // to the previous state
                            model.set('in', model.previous('in'));
                        }
                    });
                    this.is_saving = true;
                }
            },
            onSaveStop: function () {
                this.is_saving = false;
                this.render();
            },
            onClick: function () {
                var id = this.model.get('id');
                this.parentModel.set('selected', this.model.get('id'));
            },
            setLayer: function () {
                Communicator.mediator.trigger(
                    'time:change', {
                        start: new Date(this.model.get('t0')),
                        end: new Date(this.model.get('t1'))
                });
            },
            onSelectionChange: function () {
                var previous = this.parentModel.previous('selected');
                var current = this.parentModel.get('selected');
                var id = this.model.get('id');
                var className = 'alert-info';
                if ((id == current) && (id != previous)) {
                    this.$('#item').addClass(className);
                    this.setLayer();
                } else if ((id != current) && (id == previous)) {
                    this.$('#item').removeClass(className);
                }
            },
            isSelected: function () {
                var selected = this.parentModel.get('selected');
                return this.model.get('id') == selected;
            }
        });

        var SITSEditorView = Backbone.Marionette.CompositeView.extend({
            itemView: SITSEditorItemView,
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
            className: 'panel panel-default sits-editor not-selectable',
            template: {type: 'handlebars', template: SITSEditorTmpl},
            events: {
                'click #btn-focus': 'onFocusClick',
                'click #btn-open-manager': 'openManager',
                'click #btn-open-browser': 'openBrowser',
                'click #btn-refetch': 'refetch',
                'click #btn-delete': 'removeSITS',
                'click #btn-first': 'selectFirst',
                'click #btn-last': 'selectLast',
                'click #btn-prev': 'selectPrevious',
                'click #btn-next': 'selectNext',
                'click #btn-current': 'scrollToCurrent',
                'click .close': 'close'
            },

            initialize: function (options) {
                this.sourceModel = options.sourceModel;
            },

            onShow: function (view) {
                this.listenTo(this.sourceModel, 'destroy', this.openManager);
                this.listenTo(this.collection, 'sync', this.render);
                this.listenTo(this.collection, 'update', this.render);
                this.listenTo(this.collection, 'reset', this.render);
                this.listenTo(this.collection, 'add', this.render);
                this.listenTo(this.collection, 'remove', this.render);
                this.listenTo(this.collection, 'fetch:start', this.render);
                this.listenTo(this.collection, 'fetch:stop', this.render);
                this.delegateEvents(this.events);
                this.$el.draggable({
                    containment: '#content' ,
                    scroll: false,
                    handle: '.panel-heading'
                });
                Communicator.mediator.trigger(
                    'map:layer:show:exclusive', this.model
                );
            },

            onRender: function () {
                this.scrollToCurrent();
            },

            removeSITS: function () {
                Communicator.mediator.trigger(
                    'time_series:removal:confirm', this.sourceModel
                );
            },

            scrollTo: function (id) {
                var $list = this.$('#coverage-list');
                var $item = this.$('#' + id);
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

            selectByIndex: function (index) {
                if (this.collection.length < 1) return;
                index = index % this.collection.length;
                if (index < 0) {
                    index += this.collection.length;
                }
                var selected = this.collection.at(index).get('id');
                if (selected != this.model.get('selected'))
                {
                    this.model.set('selected', selected);
                    this.scrollTo(selected);
                }
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

            openBrowser: function () {
                Communicator.mediator.trigger(
                    'sits:browser:browse', this.sourceModel
                );
            },

            refetch: function () {
                Communicator.mediator.trigger('sits:editor:fetch', true);
            },

            onFocusClick: function () {
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
            }
        });

        return {SITSEditorView: SITSEditorView};
    };

    root.define(deps, init);
}).call(this);
