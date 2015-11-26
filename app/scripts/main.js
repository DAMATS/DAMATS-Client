//-------------------------------------------------------------------------------
//
// Project: DAMATS Client
// Authors: Daniel Santillan <daniel.santillan@eox.at>
//
//-------------------------------------------------------------------------------
// Copyright (C) 2014 EOX IT Services GmbH
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies of this Software or works derived from this Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//-------------------------------------------------------------------------------

(function () {
    'use strict';

    var root = this;

    function setupLoggingConsole(enable_logging) {
        // Check if console exists and set a dummy console if not avaiable
        // or logging disabled by configuration.
        if (!enable_logging || typeof console === 'undefined' || !console.log) {
            window.console = {
                debug: function () {},
                trace: function () {},
                log: function () {},
                info: function () {},
                warn: function () {},
                error: function () {}
            };
        }
    }

    var dependencies = [
        'backbone',
        'app',
        'backbone.marionette',
        'regionManager',
        'jquery',
        'jqueryui',
        'util',
        'libcoverage'
    ]

	function require_error(err) {
        console.log("Require failed!")
        console.log(err)
        window.alert(
            "The application failed to load some of the client's " +
            "dependencies.\n" +
            "Reason: " + err.requireType + "\n" +
            "Module(s): " + err.requireModules
        )
        //location.reload(true)
    }

    function require_callback(Backbone, App) {
        // TODO: Separate static and dynamical configuration.

        // Load and parse client's configuration.
        $.getJSON("scripts/config.json", function (values) {

            var views = [];
            var models = [];
            var templates = [];
            var options = {};
            var config = {};

            setupLoggingConsole(values.debug);

            _.each(values.views, function (item) {
                views.push(item);
            }, this);

            _.each(values.models, function (item) {
                console.log(item);
                models.push(item);
            }, this);

            _.each(values.templates, function (item) {
                templates.push(item.template);
            }, this);

            root.require([].concat(
                values.mapConfig.visualizationLibs,	// map visualisation libs
                views,
                models,
                templates
            ), function () {
                App.configure(values);
                App.start();
            }, require_error);

            // Set timeout for loading wheel in order no to spin endlessly
            // in case of an error.
            setTimeout(function () {
                if($('#loadscreen').length){
                    $('#loadscreen').remove();
                    $("#error-messages").append(
                        '<div class="alert alert-warning alert-danger">'+
                          '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                          '<strong>Warning!</strong>' +
                          '<p>Due to the encoutered errors the application ' +
                          'cannot be started properly.</p>' +
                          '<p>This may be a temporary problem.<br>' +
                          'Please, try to reaload the client first.<p>' +
                          '<p>If the problem persists contact the site administrator. <p>' +
                        '</div>'
                    );
                }
            }, 10000);
        })
        .fail( function() {
            $('#loadscreen').empty();
            $('#loadscreen').html(
                '<p class="warninglabel">' +
                'The application failed to load the configuration file.<br>' +
                'This may be a temporary problem. ' +
                'Try to reaload the client.<br><br>' +
                'If the problem persists contact the site administrator.' +
                '</p>'
            );
        });

    }

    // Assure that all required JS modules and the configuration are available
    // and trigger the main app's setup
    root.require(dependencies, require_callback, require_error);

}).call(this);
