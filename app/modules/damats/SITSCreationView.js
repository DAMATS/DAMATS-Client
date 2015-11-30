//------------------------------------------------------------------------------
//
// Project: DAMATS Client
// Authors: Martin Paces <martin.paces@eox.at>
//          Daniel Santillan <daniel.santillan@eox.at>
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
        'hbs!tmpl/SITSCreation',
        'hbs!tmpl/SITSCreationSourceItem',
        'underscore',
        'bootstrap-datepicker',
        'bootstrap-select'
    ];

    function init(
        Backbone,
        Communicator,
        SITSCreationTmpl,
        SITSCreationSourceItemTmpl
    ) {
        var SITSCreationSourceItemView = Backbone.Marionette.ItemView.extend({
            tagName: 'div',
            className: 'input-group source-item',
            attributes: function () {
                return {
                    value: this.model.get('identifier')
                };
            },
            events: {
                'click': 'onClick'
            },
            initialize: function (options) {
                this.parentModel = options.parentModel;
                this.listenTo(this.parentModel, 'change:source', this.reset);
            },
            template: {
                type: 'handlebars',
                template: SITSCreationSourceItemTmpl
            },
            templateHelpers: function () {
                return {is_selected: this.isSelected()};
            },
            onClick: function () {
                this.check();
                this.parentModel.set('source', this.model.get('identifier'));
            },
            check: function () {
                //this.$('#rad-source').checked = true;
                this.$('#rad-source').prop('checked', true);
            },
            reset: function () {
                if (!this.isSelected()) {
                    this.$('#rad-source').prop('checked', false);
                }
            },
            isSelected: function () {
                var selected = (
                    this.parentModel ? this.parentModel.get('source') : null
                );
                return this.model.get('identifier') == selected;
            }
        });

        var SITSCreationView = Backbone.Marionette.CompositeView.extend({
            itemView: SITSCreationSourceItemView,
            itemViewOptions : function () {
                return {
                    parentModel: this.model
                };
            },
            appendHtml: function (collectionView, itemView, index) {
                collectionView.$('#source-list').append(itemView.el);
            },
            tagName: 'div',
            className: 'panel panel-default sits-creation not-selectable',
            template: {type: 'handlebars', template: SITSCreationTmpl},
            events: {
                'click #btn-draw-bbox': 'onBBoxClick',
                'click #btn-clear-bbox': 'onClearClick',
                'click #btn-sits-create': 'onCreateClick',
                'change #txt-name': 'onNameFormChange',
                'change #txt-minx': 'onBBoxFormChange',
                'change #txt-maxx': 'onBBoxFormChange',
                'change #txt-miny': 'onBBoxFormChange',
                'change #txt-maxy': 'onBBoxFormChange',
                'hide': 'onCloseTimeWidget'
            },

            onShow: function (view) {
                this.listenTo(this.model, 'change:name', this.onNameChange);
                this.listenTo(this.model, 'change:AoI', this.onAoIChange);
                this.listenTo(this.model, 'change:ToI', this.onToIChange);
                this.listenTo(this.model, 'change', this.onModelChange);
                this.timeinterval = {};
                this.delegateEvents(this.events);
                this.$('.close').on('click', _.bind(this.onClose, this));
                this.$el.draggable({
                    containment: '#content' ,
                    scroll: false,
                    handle: '.panel-heading'
                });

                var name = this.model.get('name');
                if (name) {
                    $('#txt-name').val(name);
                }

                this.$('#div-date-begin input[type="text"]').datepicker({
                        autoclose: true,
                        format: 'yyyy-mm-dd',
                        keyboardNavigation: false
                });
                this.$('#div-date-end input[type="text"]').datepicker({
                    autoclose: true,
                    format: 'yyyy-mm-dd',
                    keyboardNavigation: false
                });
                // setDate

                this.onNameChange();
                this.onToIChange();
                this.onAoIChange();
                this.onModelChange();

                $(document).on(
                    'touch click', '#div-date-begin .input-group-addon',
                    function (evt) {
                        $('input[type="text"]', $(this).parent()).focus();
                    }
                );
                $(document).on(
                    'touch click', '#div-date-end .input-group-addon',
                    function (evt) {
                        $('input[type="text"]', $(this).parent()).focus();
                    }
                );
            },

            onBBoxClick: function () {
                this.model.set('AoI', null);
                Communicator.mediator.trigger(
                    'selection:activated', {id: 'bboxSelection', active: true}
                );
            },

            onClearClick: function () {
                this.$('#txt-minx').val('');
                this.$('#txt-maxx').val('');
                this.$('#txt-miny').val('');
                this.$('#txt-maxy').val('');
                this.model.set('AoI', null);
                Communicator.mediator.trigger(
                    'selection:activated', {id: 'bboxSelection', active: false}
                );
            },

            onCreateClick: function () {
                Communicator.mediator.trigger('sits:creation:create', true);
            },

            onCloseTimeWidget: function (evt) {
                var $start = this.$('#div-date-begin input[type="text"]');
                var $stop = this.$('#div-date-end input[type="text"]');
                Communicator.mediator.trigger('date:selection:change', {
                    start: $start.datepicker('getDate'),
                    end: $stop.datepicker('getDate')
                });
            },

            onToIChange: function () {
                var toi = this.model.get('ToI');
                if (!toi) {
                    toi = {start: null, end: null};
                }
                this.$('#div-date-begin input[type="text"]').datepicker(
                    'setDate', toi.start
                );
                this.$('#div-date-end input[type="text"]').datepicker(
                    'setDate', toi.end
                );
            },

            onAoIChange: function () {
                var aoi = this.model.get('AoI');
                if (aoi) {
                    this.$('#txt-minx').val(aoi.left);
                    this.$('#txt-maxx').val(aoi.right);
                    this.$('#txt-miny').val(aoi.bottom);
                    this.$('#txt-maxy').val(aoi.top);
                } else {
                    this.$('#txt-minx').val('');
                    this.$('#txt-maxx').val('');
                    this.$('#txt-miny').val('');
                    this.$('#txt-maxy').val('');
                }
            },

            onBBoxFormChange: function (event) {
                var aoi = {
                    left: parseFloat($('#txt-minx').val()),
                    right: parseFloat($('#txt-maxx').val()),
                    bottom: parseFloat($('#txt-miny').val()),
                    top: parseFloat($('#txt-maxy').val())
                };
                this.$('#btn-sits-create').attr('disabled', 'disabled');
                if (
                    !isNaN(aoi.left) && !isNaN(aoi.right) &&
                    !isNaN(aoi.bottom) && !isNaN(aoi.top)
                ) {
                    if (aoi.bottom <= aoi.top) {
                        Communicator.mediator.trigger(
                            'selection:bbox:changed', aoi
                        );
                        //NOTE: Model is changed by the controller.
                    }
                }
            },

            onNameChange: function () {
                $('#txt-name').val(this.model.get('name'));
            },

            onNameFormChange: function () {
                this.model.set('name', $('#txt-name').val());
            },

            onModelChange: function () {
                // This method takes care about enabling/disabling the
                var has_name = this.model.get('name');
                var has_source = this.model.get('source');
                var toi = this.model.get('ToI');
                var aoi = this.model.get('AoI');
                var has_aoi = aoi && !(
                    isNaN(aoi.left) || isNaN(aoi.right) ||
                    isNaN(aoi.bottom) || isNaN(aoi.top)
                ) && (aoi.bottom <= aoi.top);
                var has_toi = toi;

                if (has_name && has_source && has_aoi && has_toi) {
                    this.$('#btn-sits-create').removeAttr('disabled');
                } else {
                    this.$('#btn-sits-create').attr('disabled', 'disabled');
                }
            },

            onClose: function () {
                this.close();
            }
        });

        return {SITSCreationView: SITSCreationView};
    };

    root.define(deps, init);
}).call(this);
