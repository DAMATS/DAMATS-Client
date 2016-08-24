//------------------------------------------------------------------------------
//
// Project: DAMATS Client
// Authors: Martin Paces <martin.paces@eox.at>
//
//------------------------------------------------------------------------------
// Copyright (C) 2016 EOX IT Services GmbH
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
        'hbs!tmpl/ObjectMetadataEditor',
        'underscore'
    ];

    function init(
        Backbone,
        Communicator,
        ObjectMetadataEditorTmpl
    ) {
        var ObjectMetadataEditorView = Backbone.Marionette.CompositeView.extend({
            tagName: 'div',
            className: 'modal fade',
            template: {type: 'handlebars', template: ObjectMetadataEditorTmpl},
            templateHelpers: function () {
                var labels = {
                    "User": "User",
                    "TimeSeries": "SITS",
                    "Job": "job"
                };
                return {
                    owned: this.model.owned || this.model.get('owned'),
                    type: this.model.type,
                    label: labels[this.model.type]
                };
            },
            attributes: {
                role: 'dialog',
                tabindex: '-1',
                'aria-labelledby': 'about-title',
                'aria-hidden': true,
                'data-keyboard': true,
                'data-backdrop': 'static'
            },
            events: {
                'click #btn-obj-save': 'onSave',
                'input #txt-obj-name': 'onInput',
                'input #txt-obj-description': 'onInput',
                'hidden.bs.modal': 'onCancel'
            },
            fillForm: function () {
                // fill the form variables
                $('#txt-obj-id').val(this.model.get('identifier'));
                $('#txt-obj-name').val(this.model.get('name'));
                $('#txt-obj-description').val(this.model.get('description'));
                this.$('#btn-obj-save').attr('disabled', 'disabled');
            },
            onInput: function() {
                this.$('#btn-obj-save').removeAttr('disabled');
            },
            onShow: function (view) {
                this.delegateEvents(this.events);
                this.fillForm();
            },
            onCancel: function () {
                Communicator.mediator.trigger(
                    'dialog:close:ObjectMetadataEditor', this.model
                );
            },
            onSave: function () {
                if (this.model.owned || this.model.get('owned')) {
                    this.model.set({
                        name: $('#txt-obj-name').val(),
                        description: $('#txt-obj-description').val()
                    });
                    this.model.save();
                }
            }
        });
        return {ObjectMetadataEditorView: ObjectMetadataEditorView};
    };

    root.define(deps, init);
}).call(this);
