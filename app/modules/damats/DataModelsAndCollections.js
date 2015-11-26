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

// This module defines DAMATS data models and collections.
// Auxiliary GUI models are not included here.

(function () {
    'use strict';
    var root = this;
    var deps = ['backbone', 'communicator'];

    function init(Backbone, Communicator) {

        var defaults_baseline = {
                //identifier: null,
                name: null,
                description: null
        };

        var UserModel = Backbone.Model.extend({
            idAttribute: 'identifier',
            defaults: defaults_baseline
        });
        var GroupModel = Backbone.Model.extend({
            idAttribute: 'identifier',
            defaults: defaults_baseline
        });
        var SourceSeriesModel = Backbone.Model.extend({
            idAttribute: 'identifier',
            defaults: defaults_baseline
        });

        var GroupCollection = Backbone.Collection.extend({
            model: GroupModel
        });
        var SourceSeriesCollection = Backbone.Collection.extend({
            model: SourceSeriesModel
        });

        return {
            UserModel: UserModel,
            GroupModel: GroupModel,
            GroupCollection: GroupCollection,
            SourceSeriesModel: SourceSeriesModel,
            SourceSeriesCollection: SourceSeriesCollection
        };
    };
    root.define(deps, init);
}).call(this);

