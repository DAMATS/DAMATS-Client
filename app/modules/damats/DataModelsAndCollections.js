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

// This module defines DAMATS data models and collections.
// Auxiliary GUI models are not included here.

(function () {
    'use strict';
    var root = this;
    var deps = ['backbone', 'communicator', 'underscore'];

    function init(Backbone, Communicator) {

        var defaults_baseline = {
                //identifier: null,
                name: null,
                description: null
        };

        function fetch(options) {
            var this_ = this;
            var success, error;
            options = options ? _.clone(options) : {};
            success = options.success;
            error = options.error;
            options.success = function (model, resp, options) {
                this_.is_fetching = false;
                this_.fetch_failed = false;
                this_.trigger('fetch:stop');
                this_.trigger('fetch:success');
                if (success) success.call(this, model, resp, options);
            };
            options.error = function (xhr, textStatus, errorThrown) {
                this_.is_fetching = false;
                this_.fetch_failed = true;
                this_.trigger('fetch:stop');
                this_.trigger('fetch:error');
                if (error) error.call(this, xhr, textStatus, errorThrown);
            };
            this.is_fetching = true;
            this.fetch_failed = null ;
            this.trigger('fetch:start');
            return this.constructor.__super__.fetch.call(this, options);
        }

        function save(key, val, options) {
            var this_ = this;
            var success, error, attributes;
            // process input arguments
            if (key == null || typeof key === 'object') {
                attributes = key;
                options = val;
            } else {
                (attributes = {})[key] = val;
            }
            options = options ? _.clone(options) : {};
            success = options.success;
            error = options.error;
            options.success = function (model, resp, options) {
                this_.is_saving = false;
                this_.save_failed = false;
                this_.trigger('save:stop');
                this_.trigger('save:success');
                if (success) success.call(this, model, resp, options);
            };
            options.error = function (xhr, textStatus, errorThrown) {
                this_.is_saving = false;
                this_.save_failed = true;
                this_.trigger('save:stop');
                this_.trigger('save:error');
                if (error) error.call(this, xhr, textStatus, errorThrown);
            };
            this_.is_saving = true;
            this_.save_failed = null;
            this_.trigger('save:start');
            return this.constructor.__super__.save.call(this, attributes, options);
        }

        var UserModel = Backbone.Model.extend({
            fetch: fetch,
            save: save,
            idAttribute: 'identifier',
            defaults: defaults_baseline
        });

        var GroupModel = Backbone.Model.extend({
            fetch: fetch,
            save: save,
            idAttribute: 'identifier',
            defaults: defaults_baseline
        });

        var SourceSeriesModel = Backbone.Model.extend({
            fetch: fetch,
            save: save,
            idAttribute: 'identifier',
            defaults: defaults_baseline
        });

        var TimeSeriesModel = Backbone.Model.extend({
            fetch: fetch,
            save: save,
            idAttribute: 'identifier',
            defaults: _.extend({
                editable: false,
                owned: true
            }, defaults_baseline)
        });

        var CoverageModel =  Backbone.Model.extend({
            fetch: fetch,
            save: save,
            idAttribute: 'id',
            defaults: {}
        });

        var ProcessModel =  Backbone.Model.extend({
            fetch: fetch,
            save: save,
            idAttribute: 'identifier',
            defaults: {}
        });

        var JobModel =  Backbone.Model.extend({
            fetch: fetch,
            save: save,
            idAttribute: 'identifier',
            defaults: {}
        });


        var GroupCollection = Backbone.Collection.extend({
            fetch: fetch,
            model: GroupModel
        });

        var SourceSeriesCollection = Backbone.Collection.extend({
            fetch: fetch,
            model: SourceSeriesModel
        });

        var TimeSeriesCollection = Backbone.Collection.extend({
            fetch: fetch,
            model: TimeSeriesModel
        });

        var CoverageCollection = Backbone.Collection.extend({
            fetch: fetch,
            model: CoverageModel
        });

        var ProcessCollection = Backbone.Collection.extend({
            fetch: fetch,
            model: ProcessModel
        });

        var JobCollection = Backbone.Collection.extend({
            fetch: fetch,
            model: JobModel
        });

        return {
            UserModel: UserModel,
            GroupModel: GroupModel,
            GroupCollection: GroupCollection,
            SourceSeriesModel: SourceSeriesModel,
            SourceSeriesCollection: SourceSeriesCollection,
            TimeSeriesModel: TimeSeriesModel,
            TimeSeriesCollection: TimeSeriesCollection,
            CoverageModel: CoverageModel,
            CoverageCollection: CoverageCollection,
            ProcessModel: ProcessModel,
            ProcessCollection: ProcessCollection,
            JobModel: JobModel,
            JobCollection: JobCollection
        };
    };
    root.define(deps, init);
}).call(this);
