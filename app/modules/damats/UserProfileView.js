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
        'hbs!tmpl/UserProfile',
        'hbs!tmpl/UserProfileGroupItem',
        'underscore'
    ];

    function init(
        Backbone,
        Communicator,
        globals,
        UserProfileTmpl,
        UserProfileGroupItemTmpl
    ) {
        var UserProfileGroupItemView = Backbone.Marionette.ItemView.extend({
            tagName: 'li',
            className: 'list-group-item user-group-item',
            template: {type: 'handlebars', template: UserProfileGroupItemTmpl}
        });

        var UserProfileView = Backbone.Marionette.CompositeView.extend({
            itemView: UserProfileGroupItemView,
            appendHtml: function (collectionView, itemView, index) {
                collectionView.$('#user-group-list').append(itemView.el);
            },
            templateHelpers: function () {
                return {
                    is_fetching: (
                        this.model.is_fetching || this.collection.is_fetching
                    ),
                    fetch_failed: (
                        this.model.fetch_failed || this.collection.fetch_failed
                    ),
                    length: this.collection.length,
                    is_empty: this.collection.length < 1
                };
            },

            tagName: 'div',
            className: 'panel panel-default user-profile not-selectable',
            template: {type: 'handlebars', template: UserProfileTmpl},
            events: {
                'click #btn-user-update': 'onUpdateClick',
                'change #txt-user-name': 'onNameChange',
                'change #txt-user-description': 'onDescriptionChange',
                'click .close': 'close'
            },

            onShow: function (view) {
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.collection, 'reset', this.render);
                this.listenTo(this.collection, 'update', this.render);
                this.listenTo(this.model, 'fetch:start', this.render);
                this.listenTo(this.model, 'fetch:stop', this.render);
                this.listenTo(this.model, 'save:error', this.onSaveError);
                this.listenTo(this.collection, 'fetch:start', this.render);
                this.listenTo(this.collection, 'fetch:stop', this.render);
                this.delegateEvents(this.events);
                this.$el.draggable({
                    containment: '#content' ,
                    scroll: false,
                    handle: '.panel-heading'
                });
                this.fillForm();
                this.$('#btn-user-update').attr('disabled', 'disabled');
            },

            onRender: function () {
                this.fillForm();
            },

            onUpdateClick: function () {
                this.model.save();
                this.$('#btn-user-update').attr('disabled', 'disabled');
            },

            onSaveError: function () {
                this.$('#btn-user-update').removeAttr('disabled');
            },

            fillForm: function () {
                // fill the form variables
                $('#txt-user-name').val(this.model.get('name'));
                $('#txt-user-description').val(this.model.get('description'));
                this.$('#btn-user-update').attr('disabled', 'disabled');
            },

            onNameChange: function () {
                this.model.set({name: $('#txt-user-name').val()});
                this.$('#btn-user-update').removeAttr('disabled');
            },

            onDescriptionChange: function () {
                this.model.set({description: $('#txt-user-description').val()});
                this.$('#btn-user-update').removeAttr('disabled');
            }
        });

        return {UserProfileView: UserProfileView};
    };

    root.define(deps, init);
}).call(this);

