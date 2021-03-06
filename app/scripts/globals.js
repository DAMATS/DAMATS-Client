//------------------------------------------------------------------------------
//
// Project: EOxClient <https://github.com/EOX-A/EOxClient>
// Authors: Daniel Santillan <daniel.santillan@eox.at>
//          Martin Paces <martin.paces@eox.at>
//
//------------------------------------------------------------------------------
// Copyright (C) 2014 EOX IT Services GmbH
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

// global shared content
define(
    [
        'backbone',
        'objectStore',
        'modules/damats/DataModelsAndCollections'
    ],
    function (Backbone, ObjectStore, DataModels) {
        return {
            version: "0.4.6",
            objects: new ObjectStore(),
            selections: new ObjectStore(),
            baseLayers: new Backbone.Collection(),
            products: new Backbone.Collection(),
            overlays: new Backbone.Collection(),
            damats: {
                groups: new DataModels.GroupCollection(),
                user: new DataModels.UserModel(),
                sources: new DataModels.SourceSeriesCollection(),
                time_series: new DataModels.TimeSeriesCollection(),
                processes: new DataModels.ProcessCollection(),
                jobs: new DataModels.JobCollection(),
                productUrl: null,
                productTemplate: {},
                fetchAll: function () {
                    this.user.fetch();
                    this.groups.fetch();
                    this.sources.fetch();
                    this.processes.fetch();
                    this.time_series.fetch();
                    this.jobs.fetch();
                }
            }
        };
    }
);
