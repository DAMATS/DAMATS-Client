# DAMATS Client

The DAMATS Client provides web-based user interface to the DAMATS Server.

## Technologies used

The application uses [Yeoman](http://yeoman.io/) which integrates:

* [Yo](https://github.com/yeoman/yo) : scaffolds out the application, writing the Grunt configuration and pulling in relevant Grunt tasks that you might need for your build.
* [Grunt](http://gruntjs.com/) : which allows building, previewing and testing the project
* [Bower](http://bower.io/) : which allows managing of dependencies and automatic download, thus making the application easily extendible.

## Libraries used

* [require](http://requirejs.org/)
* [Underscore](http://underscorejs.org/)
* [jQuery](http://jquery.com/)
* [Backbone](http://backbonejs.org/)
* [Backbone Marionette](http://marionettejs.com/)

## How to setup development environmet (on a Linux machine)

0.  Get the code from GitHub [DAMATS repository](https://github.com/DAMATS/DAMATS):

    ```
    git clone git@github.com:DAMATS/DAMATSClient.git
    ```

    or, just for inspecting the code without the possibility to push changes
    back to github:

    ```
    git clone https://github.com/DAMATS/DAMATSClient.git
    ```

0.  Install development environment:

    Make sure [Node.js](http://nodejs.org) and [NPM](https://npmjs.org) are
    installed on your machine and run:

    ```
    sudo npm install -g grunt-cli
    sudo npm install -g bower 
    cd ./DAMATSClient/
    npm install 
    ```

    These commands install the needed Node.js packages. In case of any trouble
    try to use a reasonably recent version of Node.js. Also note that newer
    versions of Node.js contain the NPM already bundled in the baseline
    installation. 

0.  Install client dependencies:  

    The required JavaScript frameworks can be installed by: 

    ```
    bower install
    ```

0.  Start the [Grunt](http://gruntjs.com/) development server:

    ```
    grunt server 
    ```

    and point your browser to port 9000 of the machine where the grunt is
    running.  

If you managed to reach this the last step you can start to hack the code. 
The browser view refreshes itself automatically reflecting the code changes made. 


## How to deploy the code on a server 

0.  Create deployment package: 

    ```
    grunt build
    ```

    This command creates `DAMATSClient/dist/` directory containing the
    produced deployment version. Take the directory and mode it to other
    location: 
    
    ```
    mv DAMATSClient/dist/ ./DAMATSClient-my-build-x.y.z
    ```
    
    This directory should be then packed by some archiving tool (`zip`, `tar`,
    `cpio` ... etc.) creating the *deployment package*, e.g., as follows:
    ```
    tar -cvzf ./DAMATSClient-my-build-x.y.z.tgz ./DAMATSClient-my-build-x.y.z
    ```
    
    This *deployment package* is independent of the grunt *development
    environment* and can be deployed as static content with any web-server
    capable of serving static files. 
    

0.  Copy and unpack the content of the deployment package to your server and
    make sure the web-server can access the `index.html` file.

0.  Tailor the client's configuration (`config.json` and `data.json` files) 
    to fit your application. 


## Setting up the development environment on Ubuntu 14.4 

0.  Setup PPA repository to get latest Node.js: 

    Execute following command to add Chris Lea's Node.js repository:
    ```
    sudo add-apt-repository ppa:chris-lea/node.js 
    ```

    Update the apt sources: 
    ```
    sudo apt-get update 
    ```

    And finally install the Node.JS:
    ```
    sudo apt-get install nodejs
    ```

0.  Install Ruby, Ruby Gems and Compass 

    Run following commands: 
    ```
    sudo apt-get install ruby rubygems-integration ruby-dev
    sudo gem install compass
    ```

0.  Install global Node.JS components: 

    ```
    sudo npm install -g grunt-cli
    sudo npm install -g bower 
    ```

0.  Get the code from GitHub [DAMATS repository](https://github.com/DAMATS/DAMATS):

    ```
    git clone git@github.com:DAMATS/DAMATSClient.git
    ```
    or
    ```
    git clone https://github.com/DAMATS/DAMATSClient.git
    ```

0.  Install development environment:

    ```
    cd ./DAMATSClient
    npm install 
    ```
    
0.  Install client dependencies:  

    The required JavaScript frameworks can be installed by: 

    ```
    bower install
    ```

0.  Start the [Grunt](http://gruntjs.com/) development server:

    ```
    grunt server 
    ```

    and point your browser to port 9000 of the machine where the grunt is running.  
