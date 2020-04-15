const runApplescript = require('run-applescript');

const getBrowserLauncher = function(browserName) {
  return function(url) {
    this._url = url;

    // record if safari was already open via `wasopen`
    // then open safari with a tab at `karma url`
    // safari was open a
    const script = `
    set wasopen to false
    if application "${browserName}" is running then set wasopen to true
    tell application "${browserName}" to activate
    tell application "System Events"    
        click menu item "Clear History…" of menu 1 of menu bar item "History" of menu bar 1 of process "${browserName}"    
        try        
            click button "Clear History" of front window of process "${browserName}"        
        on error
            try
                click button "Clear History" of sheet 1 of window 1 of process "${browserName}"            
            end try
        end try
    end tell
    tell application "${browserName}"
      make new document with properties {URL:"${url}"}
    end tell
    return wasopen
    `;

    runApplescript(script).then((result) => {
      this._wasOpen = (result === 'true');
    }).catch((err) => {
      throw err;
    });
  };
};

const getBrowserKiller = function(browserName) {
  return function(done) {
    // code to close blank favorites tab, we don't need
    // it now, but if we ever do:
    // close (documents where name is "favorites")

    // close the karma url and safari if it wasn't open
    // before we started
    const script = `
    tell application "${browserName}"
      close documents where URL = "${this._url}"
      ${this._wasOpen ? '' : 'quit'}
    end tell
    `;

    runApplescript(script).then((result) => {
      done();
    }).catch((err) => {
      done();
      throw err;
    });
  };
};

const SafariBrowser = function(baseBrowserDecorator) {
  baseBrowserDecorator(this);
  this._start = getBrowserLauncher('Safari');
  this.on('kill', getBrowserKiller('Safari'));
};

SafariBrowser.prototype = {
  name: 'Safari'
};

SafariBrowser.$inject = ['baseBrowserDecorator'];

const SafariTechBrowser = function(baseBrowserDecorator) {
  baseBrowserDecorator(this);
  this._start = getBrowserLauncher('Safari Technology Preview');
  this.on('kill', getBrowserKiller('Safari Technology Preview'));
};

SafariTechBrowser.prototype = {
  name: 'SafariTechPreview'
};

SafariBrowser.$inject = ['baseBrowserDecorator'];

module.exports = {
  'launcher:Safari': ['type', SafariBrowser],
  'launcher:SafariTechPreview': ['type', SafariTechBrowser]
};
