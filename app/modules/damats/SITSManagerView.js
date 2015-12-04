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
        'hbs!tmpl/SITSManager',
        'hbs!tmpl/SITSManagerItem',
        'underscore'
    ];

    function init(
        Backbone,
        Communicator,
        SITSManagerTmpl,
        SITSManagerItemTmpl
    ) {
        var SITSManagerItemView = Backbone.Marionette.ItemView.extend({
            tagName: 'div',
            className: 'input-group sits-item',
            template: {type: 'handlebars', template: SITSManagerItemTmpl},
            events: {
                'click .btn-browse': 'onBrowse',
                'click .btn-edit': 'onEdit',
                'click .btn-remove-locked': 'onRemoveLocked',
                'click .btn-remove': 'onRemove',
                'click .form-control': 'onClick'
            },

            onClick: function () {
                this.onBrowse();
            },

            onReset: function () {
                this.onBrowse();
            },

            onBrowse: function () {
                Communicator.mediator.trigger(
                    'sits:browser:browse', this.model
                );
            },

            onEdit: function () {
                if (!this.model.get('locked')) {
                    Communicator.mediator.trigger(
                        'sits:editor:edit', this.model
                    );
                }
            },

            onRemove: function () {
                Communicator.mediator.trigger(
                    'time_series:removal:confirm', this.model
                );
            },

            onRemoveLocked: function () {
                console.log(this.model.get('identifier') + '.onRemoveLocked()');
            }
        });

        var SITSManagerView = Backbone.Marionette.CompositeView.extend({
            itemView: SITSManagerItemView,
            appendHtml: function (collectionView, itemView, index) {
                collectionView.$('#sits-list').append(itemView.el);
            },
            templateHelpers: function () {
                return {
                    length: this.collection.length,
                    is_empty: this.collection.length < 1
                };
            },
            tagName: 'div',
            className: 'panel panel-default sits-manager not-selectable',
            template: {type: 'handlebars', template: SITSManagerTmpl},
            events: {
                'click #btn-sits-create': 'onCreateClick'
            },

            onShow: function (view) {
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.collection, 'sync', this.render);
                this.listenTo(this.collection, 'update', this.render);
                this.listenTo(this.collection, 'reset', this.render);
                this.listenTo(this.collection, 'add', this.render);
                this.listenTo(this.collection, 'remove', this.render);
                this.delegateEvents(this.events);
                this.$('.close').on('click', _.bind(this.onCloseClick, this));
                this.$el.draggable({
                    containment: '#content' ,
                    scroll: false,
                    handle: '.panel-heading'
                });
            },

            onCreateClick: function () {
                Communicator.mediator.trigger('dialog:open:SITSCreation', true);
            },

            onCloseClick: function () {
                this.close();
            }
        });

        return {SITSManagerView: SITSManagerView};
    };

    root.define(deps, init);
}).call(this);
