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
        'modules/damats/CommonUtilities',
        'modules/damats/FeatureStyles',
        'hbs!tmpl/SITSEditor',
        'hbs!tmpl/SITSEditorCoverageItem',
        'underscore'
    ];

    function init(
        Backbone,
        Communicator,
        globals,
        cutils,
        fstyles,
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
                this.parentSourceModel = options.parentSourceModel;
                this.listenTo(this.model, 'save:stop', this.onSaveStop);
                this.listenTo(this.parentModel, 'change:selected', this.onSelectionChange);
                this.is_saving = false;
            },
            onRender: function () {
                this.onSelectionChange();
            },
            onCheckboxClick: function () {
                var model = this.model;
                var parentSourceModel = this.parentSourceModel;
                if (!this.is_saving) {
                    this.model.save('in', !this.model.get('in'), {
                        success: function () {
                            // re-fetch geometry
                            parentSourceModel.fetch();
                        },
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
                this.parentModel.set('selected', this.model.get('id'));
            },
            setLayer: function () {
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
                    parentSourceModel: this.sourceModel,
                    parentModel: this.model
                };
            },
            appendHtml: function (collectionView, itemView, index) {
                collectionView.$('#coverage-list').append(itemView.el);
            },
            templateHelpers: function () {
                return {
                    locked_scroll: this.locked_scroll,
                    is_fetching: this.collection.is_fetching,
                    fetch_failed: this.collection.fetch_failed,
                    length: this.collection.length,
                    singular: this.collection.length == 1,
                    is_empty: this.collection.length < 1
                };
            },
            tagName: 'div',
            className: 'panel panel-default sits-editor not-selectable',
            template: {type: 'handlebars', template: SITSEditorTmpl},
            events: {
                'click #btn-focus': 'focusToAoI',
                'click #btn-open-manager': 'openManager',
                'click #btn-open-browser': 'openBrowser',
                'click #btn-clone': 'cloneSITS',
                'click #btn-refetch': 'refetch',
                'click #btn-process': 'processSITS',
                'click #btn-delete': 'removeSITS',
                'click #btn-first': 'selectFirst',
                'click #btn-last': 'selectLast',
                'click #btn-prev': 'selectPrevious',
                'click #btn-next': 'selectNext',
                'click #btn-current': 'toggleScrollLock',
                'click .object-metadata': 'editMetadata',
                'click .close': 'close'
            },
            initialize: function (options) {
                this.locked_scroll = true;
                this.scroll_offset = 0;
                this.sourceModel = options.sourceModel;
            },
            onShow: function (view) {
                this.listenTo(this.sourceModel, 'destroy', this.openManager);
                this.listenTo(this.sourceModel, 'change', this.onSourceModelChange);
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.collection, 'fetch:start', this.render);
                this.listenTo(this.collection, 'fetch:stop', this.onFetchStop);
                this.listenTo(Communicator.mediator, 'product:selected', this.selectById);
                this.listenTo(Communicator.mediator, 'data:fetch:all', this.refetch);
                this.listenTo(Communicator.mediator, 'map:extent:changed', this.focusToToI);
                this.delegateEvents(this.events);
                this.$el.draggable({
                    containment: '#content' ,
                    scroll: false,
                    handle: '.panel-heading'
                });
                Communicator.mediator.trigger('date:selection:disable');
                Communicator.mediator.trigger(
                    'map:layer:show:exclusive', this.model.get('source')
                );
                Communicator.mediator.trigger('time:change', {
                    start: new Date(this.model.get('selection').toi.start),
                    end: new Date(this.model.get('selection').toi.start)
                });
                this.displaySITSGeometry();
                this.focusToAoI();
            },
            onClose: function () {
                Communicator.mediator.trigger('map:layer:hide:all');
                Communicator.mediator.trigger('date:tick:remove');
                this.removeSISTGeometry();
            },
            onFetchStop: function() {
                if ((this.collection.length > 0) && (!this.model.get('selected'))) {
                    this.selectFirst();
                } else {
                    this.render();
                }
            },
            onRender: function () {
                var $covlist = this.$('#coverage-list');
                $covlist.on('scroll', _.bind(this.onScroll, this));
                $covlist.scrollTop(this.scroll_offset);
            },
            editMetadata: function () {
                Communicator.mediator.trigger(
                    'object:metadata:edit', this.sourceModel
                );
            },
            onSourceModelChange: function () {
                this.model.set(this.sourceModel.changedAttributes());
                this.refreshSITSGeometry();
            },
            refreshSITSGeometry: function () {
                this.removeSISTGeometry();
                this.displaySITSGeometry();
            },
            removeSISTGeometry: function () {
                Communicator.mediator.trigger('map:geometry:remove:all');
            },
            displaySITSGeometry: function () {
                // clear the geometry layer
                this.removeSISTGeometry();
                // display the selected AoI polygon (matched data)
                Communicator.mediator.trigger('map:geometry:add', {
                    geometry: cutils.coordsToGeometry(
                        this.sourceModel.get('selection_area')
                    ),
                    attributes: {
                        identifer: this.sourceModel.get('identifier'),
                        type: 'selected-area'
                    },
                    style: fstyles.aoi
                });
                // display the selection polygon (user input)
                Communicator.mediator.trigger('map:geometry:add', {
                    geometry: cutils.coordsToGeometry(
                        this.sourceModel.get('selection_area')
                    ),
                    attributes: {
                        identifer: this.sourceModel.get('identifier'),
                        type: 'selection-area'
                    },
                    style: fstyles.selection
                });
                // display the CIA
                Communicator.mediator.trigger('map:geometry:add', {
                    geometry: cutils.coordsToGeometry(
                        this.sourceModel.get('common_intersection_area')
                    ),
                    attributes: {
                        identifer: this.sourceModel.get('identifier'),
                        type: 'common-area'
                    },
                    style: fstyles.cia
                });
            },
            processSITS: function () {
                Communicator.mediator.trigger(
                    'dialog:open:JobCreation', {'sits': this.sourceModel}
                );
            },
            cloneSITS: function () {
                Communicator.mediator.trigger('sits:editor:clone', this.model);
            },
            removeSITS: function () {
                Communicator.mediator.trigger(
                    'time_series:removal:confirm', this.sourceModel
                );
            },
            scrollTo: function (id) {
                if (!this.locked_scroll) return;
                var $list = this.$('#coverage-list');
                var $item = this.$('#' + id);
                if ($item.get().length < 1) return;
                var centre_offset = 0.5 * ($list.height() - $item.height());
                this.scroll_offset = (
                    $list.scrollTop() + $item.offset().top - $list.offset().top -
                    (centre_offset > 0 ? centre_offset : 0)
                );
                $list.scrollTop(this.scroll_offset);
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
            onScroll: function () {
                var $covlist = this.$('#coverage-list');
                if (this.scroll_offset != $covlist.scrollTop()) {
                    this.scroll_offset = $covlist.scrollTop();
                    if (this.locked_scroll) {
                        this.toggleScrollLock();
                    }
                }
            },
            toggleScrollLock: function () {
                var $el = this.$el.find('#btn-current');
                if (this.locked_scroll) {
                    this.locked_scroll = false;
                    $el.removeClass('active').removeAttr('aria-pressed');
                } else {
                    this.locked_scroll = true;
                    $el.addClass('active').attr('aria-pressed', 'true');
                    this.scrollToCurrent();
                }
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
            focusToAoI: function () {
                this._focus_on = true;
                Communicator.mediator.trigger(
                    'map:set:extent', this.model.get('selection_extent')
                );
            },
            focusToToI: function () {
                if (this._focus_on) {
                    Communicator.mediator.trigger('timeslider:zoom', {
                        start: new Date(this.model.get('selection').toi.start),
                        end: new Date(this.model.get('selection').toi.end)
                    });
                    this._focus_on = false;
                }
            }
        });

        return {SITSEditorView: SITSEditorView};
    };

    root.define(deps, init);
}).call(this);
