/*
Copyright (c) 2009 Google Inc. (Brad Neuberg, http://codinginparadise.org)

Portions Copyright (c) 2008 Rick Masters
Portions Copyright (c) 2008 Others (see COPYING.txt for details on
third party code)

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

// TODO: Document the architecture of the JavaScript portion of the library
// separately and point to it from here.

// Remove timing functions when done with Issue 96
window.timer = {};

function start(subject, subjectStarted) {
  //console.log('start('+subject+','+subjectStarted+')');
  if (subjectStarted && !ifStarted(subjectStarted)) {
    //console.log(subjectStarted + ' not started yet so returning for ' + subject);
    return;
  }
  //console.log('storing time for ' + subject);
  window.timer[subject] = {start: new Date().getTime()};
}

function end(subject, subjectStarted) {
  //console.log('end('+subject+','+subjectStarted+')');
  if (subjectStarted && !ifStarted(subjectStarted)) {
    //console.log(subjectStarted + ' not started yet so returning for ' + subject);
    return;
  }
  
  if (!window.timer[subject]) {
    console.log('Unknown subject: ' + subject);
    return;
  }
  
  window.timer[subject].end = new Date().getTime();
  
  //console.log('at end, storing total time: ' + total(subject));
}

function total(subject) {
  if (!window.timer[subject]) {
    console.log('Unknown subject: ' + subject);
    return;
  }
  
  var t = window.timer[subject];
  if (t) {
    return t.end - t.start;
  } else {
    return null;
  }
}

function ifStarted(subject) {
  for (var i in window.timer) {
    var t = window.timer[i];
    if (i == subject && t.start !== undefined && t.end === undefined) {
      return true;
    }
  }
  
  return false;
}

function report() {
  for (var i in window.timer) {
    var t = total(i);
    if (t !== null) {
      console.log(i + ': ' + t + 'ms');
    }
  }
}
// Remove these functions when done with Issue 96

(function(){ // hide everything externally to avoid name collisions
 
// expose namespaces globally to ease developer authoring
window.svgns = 'http://www.w3.org/2000/svg';
window.xlinkns = 'http://www.w3.org/1999/xlink';

// Firefox and Safari will incorrectly turn our internal parsed XML
// for the Flash Handler into actual SVG nodes, causing issues. This is
// a workaround to prevent this problem.
svgnsFake = 'urn:__fake__internal__namespace'; 
 
// browser detection adapted from Dojo
var isOpera = false, isSafari = false, isMoz = false, isIE = false, 
    isAIR = false, isKhtml = false, isFF = false;
    
function _detectBrowsers() {
  var n = navigator,
      dua = n.userAgent,
      dav = n.appVersion,
      tv = parseFloat(dav);

  if (dua.indexOf('Opera') >= 0) { isOpera = tv; }
  // safari detection derived from:
  //    http://developer.apple.com/internet/safari/faq.html#anchor2
  //    http://developer.apple.com/internet/safari/uamatrix.html
  var index = Math.max(dav.indexOf('WebKit'), dav.indexOf('Safari'), 0);
  if (index) {
    // try to grab the explicit Safari version first. If we don't get
    // one, look for 419.3+ as the indication that we're on something
    // "Safari 3-ish". Lastly, default to "Safari 2" handling.
    isSafari = parseFloat(dav.split('Version/')[1]) ||
      (parseFloat(dav.substr(index + 7)) > 419.3) ? 3 : 2;
  }
  if (dua.indexOf('AdobeAIR') >= 0) { isAIR = 1; }
  if (dav.indexOf('Konqueror') >= 0 || isSafari) { isKhtml =  tv; }
  if (dua.indexOf('Gecko') >= 0 && !isKhtml) { isMoz = tv; }
  if (isMoz) {
    isFF = parseFloat(dua.split('Firefox/')[1]) || undefined;
  }
  if (document.all && !isOpera) {
    isIE = parseFloat(dav.split('MSIE ')[1]) || undefined;
  }
}

_detectBrowsers();

// end browser detection


// be able to have debug output when there is no Firebug
// see if debugging is turned on
function doDebugging() {
  var debug = false;
  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src.indexOf('svg.js') != -1) {
      var debugSetting = scripts[i].getAttribute('data-debug');
      debug = (debugSetting === 'true' || debugSetting === true) ? true : false;
    }
  }
  
  return debug;
}
var debug = doDebugging();

if (typeof console == 'undefined' || !console.log) {
  var queue = [];
  console = {};
  if (!debug) {
    console.log = function() {};
  } else {
    console.log = function(msg) {
      var body = null;
      var delay = false;
    
      // IE can sometimes throw an exception if document.body is accessed
      // before the document is fully loaded
      try { 
        body = document.getElementsByTagName('body')[0]; 
      } catch (exp) {
        delay = true;
      }
    
      // IE will sometimes have the body object but we can get the dreaded
      // "Operation Aborted" error if we try to do an appendChild on it; a 
      // workaround is that the doScroll method will throw an exception before 
      // we can truly use the body element so we can detect this before
      // any "Operation Aborted" errors
      if (isIE) {
        try {
          document.documentElement.doScroll('left');
        } catch (exp) {
          delay = true;
        }
      }

      if (delay) {
        queue.push(msg);
        return;
      }
       
      var p;
      while (queue.length) {
        var oldMsg = queue.shift();
        p = document.createElement('p');
        p.appendChild(document.createTextNode(oldMsg));
        body.appendChild(p);
      }
    
      // display new message now
      p = document.createElement('p');
      p.appendChild(document.createTextNode(msg));
      body.appendChild(p);
    };
    
    // IE has an unfortunate issue; under some situations calling
    // document.body.appendChild can throw an Operation Aborted error,
    // such as when there are many SVG OBJECTs on a page. This is a workaround
    // to print out any queued messages until the page has truly loaded.
    if (isIE) {
      function flushQueue() {
        while (queue.length) {
          var oldMsg = queue.shift();
          p = document.createElement('p');
          p.appendChild(document.createTextNode(oldMsg));
          document.body.appendChild(p);
        }
      }

      var debugInterval = window.setInterval(function() {
        if (document.readyState == 'complete') {
          flushQueue();
          window.clearTimeout(debugInterval);
        }
      }, 50);
    }
  }
}
// end debug output methods

/*
  Quick way to define prototypes that take up less space and result in
  smaller file size; much less verbose than standard 
  foobar.prototype.someFunc = function() lists.

  @param f Function object/constructor to add to.
  @param addMe Object literal that contains the properties/methods to
    add to f's prototype.
*/
function extend(f, addMe) {
  for (var i in addMe) {
    f.prototype[i] = addMe[i];
  }
}

/**
  Mixes an object literal of properties into some instance. Good for things 
  that mimic 'static' properties.
  
  @param f Function object/contructor to add to
  @param addMe Object literal that contains the properties/methods to add to f.
*/
function mixin(f, addMe) {
  for (var i in addMe) {
    f[i] = addMe[i];
  } 
}

/** Utility function to do XPath cross browser.

    @param doc Either HTML or XML document to work with.
    @param context DOM node context to restrict the xpath executing 
    against; can be null, which defaults to doc.documentElement.
    @param expr String XPath expression to execute.
    @param namespaces Optional; an array that contains prefix to namespace
    lookups; see the _getNamespaces() methods in this file for how this
    data structure is setup.
    
    @returns Array with results, empty array if there are none. */
function xpath(doc, context, expr, namespaces) {
  if (!context) {
    context = doc.documentElement;
  }

  if (typeof XPathEvaluator != 'undefined') { // non-IE browsers
    var evaluator = new XPathEvaluator();
    var resolver = doc.createNSResolver(context);
    var result = evaluator.evaluate(expr, context, resolver, 0, null);
    var found = createNodeList(), current;
    while (current = result.iterateNext()) {
      found.push(current);
    }

    return found;
  } else { // IE
    doc.setProperty('SelectionLanguage', 'XPath');
    
    if (namespaces) {
      var allNamespaces = '';
      // IE throws an error if the same namespace is present multiple times,
      // so remove duplicates
      var foundNamespace = {};
      for (var i = 0; i < namespaces.length; i++) {
        var namespaceURI = namespaces[i];
        var prefix = namespaces['_' + namespaceURI];

        // seen before?
        if (!foundNamespace['_' + namespaceURI]) {
          if (prefix == 'xmlns') {
            allNamespaces += 'xmlns="' + namespaceURI + '" ';
          } else {
            allNamespaces += 'xmlns:' + prefix + '="' + namespaceURI + '" ';
          }
          
          foundNamespace['_' + namespaceURI] = namespaceURI;
        }
      }
      doc.setProperty('SelectionNamespaces',  allNamespaces);
    }
    
    var found = context.selectNodes(expr);
    if (found === null || typeof found == 'undefined') {
      found = createNodeList();
    }
    
    // found is not an Array; it is a NodeList -- turn it into an Array
    var results = createNodeList();
    for (var i = 0; i < found.length; i++) {
      results.push(found[i]);
    }
    
    return results;
  }
}

/** Parses the given XML string and returns the document object.

    @param xml XML String to parse.
    @param preserveWhiteSpace Whether to parse whitespace in the XML document
    into their own nodes. Defaults to false. Controls Internet Explorer's
    XML parser only.
    
    @returns XML DOM document node.
*/
function parseXML(xml, preserveWhiteSpace) {
  if (preserveWhiteSpace === undefined) {
    preserveWhiteSpace = false;
  }
    
  var xmlDoc;
  if (typeof DOMParser != 'undefined') { // non-IE browsers
    // parse the SVG using an XML parser
    var parser = new DOMParser();
    try { 
      xmlDoc = parser.parseFromString(xml, 'application/xml');
    } catch (e) {
      throw e;
    }
    
    var root = xmlDoc.documentElement;
    if (root.nodeName == 'parsererror') {
      throw new Error('There is a bug in your SVG: '
                      + (new XMLSerializer().serializeToString(root)));
    }
  } else { // IE
    // only use the following two MSXML parsers:
    // http://blogs.msdn.com/xmlteam/archive/2006/10/23/using-the-right-version-of-msxml-in-internet-explorer.aspx
    var versions = [ 'Msxml2.DOMDocument.6.0', 'Msxml2.DOMDocument.3.0' ];
    
    var xmlDoc;
    for (var i = 0; i < versions.length; i++) {
      try {
        xmlDoc = new ActiveXObject(versions[i]);
        if (xmlDoc) {
          break;
        }
      } catch (e) {}
    }
    
    if (!xmlDoc) {
      throw new Error('Unable to instantiate XML parser');
    }
    
    try {
      xmlDoc.preserveWhiteSpace = preserveWhiteSpace;
      // IE will attempt to resolve external DTDs (i.e. the SVG DTD) unless 
      // we add the following two flags
      xmlDoc.resolveExternals = false;
      xmlDoc.validateOnParse = false;
      
      // MSXML 6 breaking change (Issue 138):
      // http://code.google.com/p/sgweb/issues/detail?id=138
      xmlDoc.setProperty('ProhibitDTD', false);
      
      xmlDoc.async = 'false';
      var successful = xmlDoc.loadXML(xml);
      
      if (!successful || xmlDoc.parseError.errorCode !== 0) {
        throw new Error(xmlDoc.parseError.reason);
      }
    } catch (e) {
      console.log(e.message);
      throw new Error('Unable to parse SVG: ' + e.message);
    }
  }
  
  return xmlDoc;
}

/*
  Useful for closures and event handlers. Instead of having to do
  this:
  
  var self = this;
  window.onload = function(){
      self.init();
  }
  
  you can do this:
  
  window.onload = hitch(this, 'init');
  
  @param context The instance to bind this method to.
  @param method A string method name or function object to run on context.
*/
function hitch(context, method) {
  if (typeof method == 'string') {
    method = context[method];
  }
  
  // this method shows up in the style string on IE's HTC object since we
  // use it to extend the HTC element's style object with methods like
  // item(), setProperty(), etc., so we want to keep it short
  return function() { return method.apply(context, (arguments.length) ? arguments : []); };
}

/* 
  Internet Explorer's list of standard XHR PROGIDS. 
*/
var XHR_PROGIDS = [
  'MSXML2.XMLHTTP.6.0', 'MSXML2.XMLHTTP.3.0', 'MSXML2.XMLHTTP',
  'Microsoft.XMLHTTP'
];

/*
  Standard way to grab XMLHttpRequest object.
*/
function xhrObj() {
  if (typeof XMLHttpRequest != 'undefined') {
    return new XMLHttpRequest();
  } else if (ActiveXObject) {
    var xhr = null;
    var i; // save the good PROGID for quicker access next time
    for (i = 0; i < XHR_PROGIDS.length && !xhr; ++i) {
      try {
        xhr = new ActiveXObject(XHR_PROGIDS[i]);
      } catch(e) {}
    }

    if (!xhr) {
      throw new Error('XMLHttpRequest object not available on this platform');
    }

    return xhr;
  }
}

// GUID generation from blog post at
// http://note19.com/2007/05/27/javascript-guid-generator/
// We simply use randomly generated numbers, which is fine since we only
// need these to be locally unique during a single session
function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

// TODO: Explore whether making this GUID smaller would speed up sending
// things to Flash or memory usage; would a smaller GUID lead to more 
// collisions (birthday paradox), or do we not have enough nodes for this
// length to really matter?
function guid() {
  // NOTE: IE 6 has a crazy bug: we used to have {} and - characters in 
  // our GUIDs, but if you have these inside the ID of an OBJECT, such as 
  // __svg__random__{0bd2b199-6e64-63da-1ff8-cd8ab4c3d6d0}__object, then
  // IE 6 gives you an "Expected ;" error, which means that the
  // ID gets interpreted as JavaScript! We use underscores instead.
  return '_'+S4()+S4()+'_'+S4()+'_'+S4()+'_'+S4()+'_'+S4()+S4()+S4()+'_';
}


/** 
  Our singleton object that acts as the primary entry point for the library. 
  Gets exposed globally as 'svgweb'.
*/
function SVGWeb() {
  // grab any configuration that might exist on where our library resources
  // are
  this.libraryPath = this._getLibraryPath();
  
  // see if there is an optional HTC filename being used, such as svg-htc.php;
  // these are used to have the server automatically send the correct MIME
  // type for HTC files without having to fiddle with MIME type settings
  this.htcFilename = this._getHTCFilename();
  
  // prepare IE by inserting special markup into the page to have the HTC
  // be available
  if (isIE) {
    FlashHandler._prepareBehavior(this.libraryPath, this.htcFilename);
  }
  
  // make sure we can intercept onload listener registration to delay onload 
  // until we are done with our internal machinery
  this._interceptOnloadListeners();
  
  // wait for our page's DOM content to be available
  this._initDOMContentLoaded();
}

extend(SVGWeb, {
  // path to find library resources
  libraryPath: './',
  // RenderConfig object of which renderer (native or Flash) to use
  config: null,
  pageLoaded: false,
  handlers: [],
  totalLoaded: 0,
  
  /** Every element (including text nodes) has a unique GUID. This lookup
      table allows us to go from a GUID taken from an XML node to a fake 
      node (_Element or _Node) that might have been instantiated already. */
  _guidLookup: [],
  
  /** Onload page load listeners. */
  _loadListeners: [],
  
  /** A data structure that we used to keep track of removed nodes, necessary
      so we can clean things up and prevent memory leaks on IE on page unload.
      Unfortunately we have to keep track of this at the global 'svgweb'
      level rather than on individual handlers because a removed node
      might have never been associated with a real DOM or a real handler. */
  _removedNodes: [],
  
  /** Adds an event listener to know when both the page, the internal SVG
      machinery, and any SVG SCRIPTS or OBJECTS are finished loading.
      Window.onload is not safe, since it can get fired before we are
      truly done, so this method should be used instead.
      
      @param listener Function that will get called when page and all
      embedded SVG is loaded and rendered.
      @param fromObject Optional. If true, then we are calling this from
      inside an SVG OBJECT file.
      @param objectWindow Optional. Provided when called from inside an SVG
      OBJECT file; this is the window object inside the SVG OBJECT. */
  addOnLoad: function(listener, fromObject, objectWindow) {
    if (fromObject) { // addOnLoad called from an SVG file embedded with OBJECT
      var obj = objectWindow.frameElement;
      
      // If we are being called from an SVG OBJECT tag and are the Flash
      // renderer than just execute the onload listener now since we know
      // the SVG file is done rendering.
      if (fromObject && this.getHandlerType() == 'flash') {
        listener.apply(objectWindow);
      } else {
        // NOTE: some browsers will fire the onload of the SVG file _before_ our
        // NativeHandler is done (Firefox); others will do it the opposite way
        // (Safari). We set variables pointing between the OBJECT and its
        // NativeHandler to handle this.
        if (obj._svgHandler) { // NativeHandler already constructed
          obj._svgHandler._onObjectLoad(listener, objectWindow);
        } else {
          // NativeHandler not constructed yet; store a reference for later
          // handling
          obj._svgWindow = objectWindow;
          obj._svgFunc = listener;
        }
      }
    } else { // normal addOnLoad request from containing HTML page
      this._loadListeners.push(listener);
    }
  },
  
  /** Returns a string for the given handler for this platform, 'flash' if
      flash is being used or 'native' if the native capabilities are being
      used. */
  getHandlerType: function() {
    if (this.renderer == FlashHandler) {
      return 'flash';
    } else if (this.renderer == NativeHandler) {
      return 'native';
    }
  },
  
  /** Appends a dynamically created SVG OBJECT or SVG root to the page.
      See the section "Dynamically Creating and Removing SVG OBJECTs and 
      SVG Roots" for details. NOTE: Only appending SVG OBJECTs is supported
      for now.
      
      @node Either an 'object' created with 
      document.createElement('object', true) or an SVG root created with
      document.createElementNS(svgns, 'svg')
      @parent An HTML DOM parent to attach our SVG OBJECT or SVG root to.
      This DOM parent must already be attached to the visible DOM. */
  appendChild: function(node, parent) {
    if (node.nodeName.toLowerCase() == 'object'
        && node.getAttribute('type') == 'image/svg+xml') {
      // dynamically created OBJECT tag for an SVG file
      this.totalSVG++;
      this._svgObjects.push(node);
      
      if (this.getHandlerType() == 'native') {
        parent.appendChild(node);
      }
      
      var placeHolder = node;
      if (this.getHandlerType() == 'flash') {
        // register onloads
        if (node.onload) {
          node.addEventListener('load', node.onload, false);
        }
        
        // turn our OBJECT into a place-holder DIV attached to the DOM, 
        // copying over our properties; this will get replaced by the 
        // Flash OBJECT
        var div = document._createElement('div');
        for (var j = 0; j < node.attributes.length; j++) {
          var attr = node.attributes[j];
          div.setAttribute(attr.nodeName, attr.nodeValue);
        } 
        parent.appendChild(div);
      
        // copy over internal event listener info
        div._listeners = node._listeners;
        
        placeHolder = div;
      }
              
      // now handle this SVG OBJECT
      var objID = this._processSVGObject(placeHolder);
      
      // add the ID to our original SVG OBJECT node as a private member;
      // we will later use this if svgweb.removeChild is called to remove
      // the node in order to remove the SVG OBJECT from our
      // handler._svgObjects array
      node._objID = objID;
    }
  },
  
  /** Removes a dynamically created SVG OBJECT or SVG root to the page.
      See the section "Dynamically Creating and Removing SVG OBJECTs and 
      SVG Roots" for details. NOTE: Only removing SVG OBJECTs is supported
      for now.
      
      @node OBJECT or EMBED tag for the SVG OBJECT to remove.
      @parent The parent of the node to remove. */
  removeChild: function(node, parent) {
    if (node.nodeName.toLowerCase() == 'object' 
        || node.nodeName.toLowerCase() == 'embed') {
      this.totalSVG--;
      this.totalLoaded--;
      
      // remove from our list of handlers
      var objID = node.getAttribute('id');
      var objHandler = this.handlers[objID];
      var newHandlers = [];
      for (var i = 0; i < this.handlers.length; i++) {
        var currentHandler = this.handlers[i];
        if (currentHandler != objHandler) {
          newHandlers[currentHandler.id] = currentHandler;
          newHandlers.push(currentHandler);
        } 
      }
      this.handlers = newHandlers;
      
      if (this.getHandlerType() == 'flash') {
        // remove any setTimeout or setInterval functions that might have
        // been registered inside this object; see _SVGWindow.setTimeout
        // for details
        var iframeWin = objHandler.document.defaultView;
        for (var i = 0; i < iframeWin._intervalIDs.length; i++) {
          iframeWin.clearInterval(iframeWin._intervalIDs[i]);
        }
        for (var i = 0; i < iframeWin._timeoutIDs.length; i++) {
          iframeWin.clearTimeout(iframeWin._timeoutIDs[i]);
        }
      
        // remove keyboard event handlers; we added a record of these for
        // exactly this reason in _Node.addEventListener()
        for (var i = 0; i < objHandler._keyboardListeners.length; i++) {
          var l = objHandler._keyboardListeners[i];
          if (isIE) {
            document.detachEvent('onkeydown', l);
          } else {
            // we aren't sure whether the event listener is a useCapture or
            // not; just try to remove both
            document.removeEventListener('keydown', l, true);
            document.removeEventListener('keydown', l, false);
          }
        }
      }
      
      // remove the original SVG OBJECT node from our handlers._svgObjects
      // array
      for (var i = 0; i < svgweb._svgObjects.length; i++) {
        if (svgweb._svgObjects[i]._objID === objID) {
          svgweb._svgObjects.splice(i, 1);
          break;
        }
      }
              
      // remove from the page
      node.parentNode.removeChild(node);
      
      if (this.getHandlerType() == 'flash') {
        // delete the HTC container and all HTC nodes that belong to this
        // SVG OBJECT
        var container = document.getElementById('__htc_container');
        if (container) {
          for (var i = 0; i < container.childNodes.length; i++) {
            var child = container.childNodes[i];
            if (typeof child.ownerDocument != 'undefined'
                && child.ownerDocument === objHandler._svgObject.document) {
              if (typeof child._fakeNode != 'undefined'
                  && typeof child._fakeNode._htcNode != 'undefined') {
                child._fakeNode._htcNode = null;
              }
              child._fakeNode = null;
              child._handler = null;
            }
          }
        }
      
        // clear out the guidLookup table for nodes that belong to this
        // SVG OBJECT
        for (var guid in svgweb._guidLookup) {
          var child = svgweb._guidLookup[guid];
          if (child._fake && child.ownerDocument === objHandler.document) {
            delete svgweb._guidLookup[guid];
          }
        }
      
        // remove various properties to prevent IE memory leaks
        objHandler._finishedCallback = null;
        objHandler.flash.contentDocument = null;
        objHandler.flash = null;
        objHandler._xml = null;
        objHandler.window._scope = null;
        objHandler.window = null;
      
        var svgObj = objHandler._svgObject;
        var svgDoc = svgObj.document;
        svgDoc._nodeById = null;
        svgDoc._xml = null;
        svgDoc.defaultView = null;
        svgDoc.documentElement = null;
        svgDoc.rootElement = null;
        svgDoc.defaultView = null;
        svgDoc = null;  
        svgObj._svgNode = null;
        svgObj._handler = null;
      
        iframeWin._setTimeout = null;
        iframeWin.setTimeout = null;
        iframeWin._setInterval = null;
        iframeWin.setInterval = null;
      
        objHandler._svgObject = null;
        svgObj = null;
        objHandler = null;
        iframeWin = null;
      } // end if (this.getHandlerType() == 'flash')
    } // SVG OBJECT handling
  },
  
  /** Sets up an onContentLoaded listener */
  _initDOMContentLoaded: function() {
    // code adapted from Dean Edwards/Matthias Miller/John Resig/others
  
    var self = this;
    if (document.addEventListener) {
      // DOMContentLoaded natively supported on Opera 9/Mozilla/Safari 3
      document.addEventListener('DOMContentLoaded', function() {
        self._saveWindowOnload();
        self._onDOMContentLoaded();
      }, false);
    } else { // Internet Explorer
      // id is set to be __ie__svg__onload rather than __ie_onload so
      // we don't have name collisions with other scripts using this
      // code as well
      document.write('<script id=__ie__svg__onload defer '
                      + 'src=javascript:void(0)><\/script>');
      var script = document.getElementById('__ie__svg__onload');
      script.onreadystatechange = function() {
        // Save any window.onload listener that might be registered so we can
        // delay calling it until we are done internally. IE has two tricky
        // states when it comes to this:
        // * Page loaded from cache - window.onload will be ready during
        // 'loaded' or 'loading' readyState event. If we wait until a
        // 'complete' readyState for this kind it will be too late.
        // * Page not in cache - we must use a document.onreadystatechange
        // listener to detect an 'interactive' or 'complete' readyState event.
        if (this.readyState != 'complete' && window.onload) {
          self._saveWindowOnload();
        } else if (this.readyState == 'complete') {
          // all the DOM content is finished loading -- continue our internal
          // execution now
          self._onDOMContentLoaded();
        }
      }
      
      // needed to intercept window.onload when page loaded first time
      // (i.e. not in cache); see details above in script.onreadystatechange
      var documentReady = function() {
        if (window.onload) {
          self._saveWindowOnload();
          document.detachEvent('onreadystatechange', documentReady);
        }
      };
      document.attachEvent('onreadystatechange', documentReady);
    }
  },
  
  /** Gets any data-path value that might exist on the SCRIPT tag
      that pulls in our svg.js library to configure where to find
      library resources like SWF files, HTC files, etc. */
  _getLibraryPath: function() {
    // determine the path to our HTC and Flash files
    var libraryPath = './';
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src.indexOf('svg.js') != -1 
          && scripts[i].getAttribute('data-path')) {
        libraryPath = scripts[i].getAttribute('data-path');
        break;
      }
    }
    
    if (libraryPath.charAt(libraryPath.length - 1) != '/') {
      libraryPath += '/';
    }
    
    return libraryPath;
  },
  
  /** Gets an optional data-htc-filename value that might exist on the SCRIPT
      tag. If present, this holds a different filename for where to grab the
      HTC file from, such as svg-htc.php or svg-htc.asp. This is a trick to
      help support those in environments where they can't manually add new
      MIME types, so we have an ASP, JSP, or PHP file set the MIME type for the
      HTC file automatically. */
  _getHTCFilename: function() {
    var htcFilename = 'svg.htc';
    
    // see if one of our three predefined file names is given in the query
    // string as the query parameter 'svg.htcFilename'; we do whitelisting 
    // rather than directly copying this value in to prevent XSS attacks
    var loc = window.location.toString();
    if (loc.indexOf('svg.htcFilename=svg-htc.php') != -1) {
      return 'svg-htc.php';
    } else if (loc.indexOf('svg.htcFilename=svg-htc.jsp') != -1) {
      return 'svg-htc.jsp';
    } else if (loc.indexOf('svg.htcFilename=svg-htc.asp') != -1) {
      return 'svg-htc.asp';
    }
    
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src.indexOf('svg.js') != -1 
          && scripts[i].getAttribute('data-htc-filename')) {
        htcFilename = scripts[i].getAttribute('data-htc-filename');
        break;
      }
    }
    
    return htcFilename;
    
  },
  
  /** Fires when the DOM content of the page is ready to be worked with. */
  _onDOMContentLoaded: function() {
    //console.log('onDOMContentLoaded');
    
    // quit if this function has already been called
    if (arguments.callee.done) {
      return;
    }
    
    // flag this function so we don't do the same thing twice
    arguments.callee.done = true;
    
    // start tracking total startup time
    this._startTime = new Date().getTime();
    
    // cleanup onDOMContentLoaded handler to prevent memory leaks on IE
    var listener = document.getElementById('__ie__svg__onload');
    if (listener) {
      listener.parentNode.removeChild(listener);
      listener.onreadystatechange = null;
      listener = null;
    }
    
    // determine what renderers (native or Flash) to use for which browsers
    this.config = new RenderConfig();
    
    // sign up for the onunload event on IE to clean up references that
    // can cause memory leaks
    if (isIE) {
      this._watchUnload();
    }

    // extract any SVG SCRIPTs or OBJECTs
    this._svgScripts = this._getSVGScripts();
    this._svgObjects = this._getSVGObjects();

    this.totalSVG = this._svgScripts.length + this._svgObjects.length;
    
    // do various things we must do early on in the page load process
    // around cleaning up SVG OBJECTs on the page
    this._cleanupSVGObjects();
    
    // handle a peculiarity for Safari (see method for details)
    this._handleHTMLTitleBug();
    
    // see if we can even support SVG in any way
    if (!this.config.supported) {
      // no ability to use SVG in any way
      this._displayNotSupported(this.config.reason);
      this._fireOnLoad();
      return;
    }
    
    // setup which renderer we will use
    this.renderer;
    if (this.config.use == 'flash') {
      this.renderer = FlashHandler;
    } else if (this.config.use == 'native') {
      this.renderer = NativeHandler;
    }
    
    // patch the document and style objects with bug fixes for the 
    // NativeHandler and actual implementations for the FlashHandler
    this.renderer._patchBrowserObjects(window, document);
    
    // no SVG - we're done
    if (this.totalSVG === 0) {
      this._fireOnLoad();
      return;
    }
  
    // now process each of the SVG SCRIPTs and SVG OBJECTs
    var self = this;
    for (var i = 0; i < this._svgScripts.length; i++) {
      this._processSVGScript(this._svgScripts[i]);
    }
    
    for (var i = 0; i < this._svgObjects.length; i++) {
      var objID = this._processSVGObject(this._svgObjects[i]);
      
      // add the ID to our original SVG OBJECT node as a private member;
      // we will later use this if svgweb.removeChild is called to remove
      // the node in order to remove the SVG OBJECT from our
      // handler._svgObjects array
      this._svgObjects[i]._objID = objID;
    }
    
    // wait until all of them have done their work, then fire onload
  },
  
  /** Gets any SVG SCRIPT blocks on the page. */
  _getSVGScripts: function() {
    var scripts = document.getElementsByTagName('script');
    var results = [];
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].type == 'image/svg+xml') {
        results.push(scripts[i]);
      }
    }
    
    return results;
  },

  /** Gets any SVG OBJECTs on the page. */
  _getSVGObjects: function() {
    // Note for IE: Unfortunately we have to use @classid to carry our MIME 
    // type instead of @type for IE. Here's why: on IE, you must have 
    // either @classid or @type present on your OBJECT tag. If there is 
    // _any_ fallback content inside of the OBJECT tag, IE will erase the 
    // OBJECT from the DOM and replace it with the fallback content if the 
    // @type attribute is set to an unknown MIME type; this makes it 
    // impossible for us to then get the OBJECT from the DOM below. If we 
    // don't have a @classid this will also happen, so we just set it to 
    // the string 'image/svg+xml' which is arbitrary. If both @type and 
    // @classid are present, IE will still look at the type first and 
    // repeat the same incorrect fallback behavior for our purposes.
    var objs = document.getElementsByTagName('object');
    var results = [];
    for (var i = 0; i < objs.length; i++) {
      if (objs[i].getAttribute('classid') == 'image/svg+xml') {
        results.push(objs[i]);
      } else if (objs[i].getAttribute('type') == 'image/svg+xml') {
        results.push(objs[i]);
      }
    }
    
    return results;
  },
  
  /** Displays not supported messages. 
  
      @param reason String containing why this browser is not supported. */
  _displayNotSupported: function(reason) {
    // write the reason into the OBJECT tags if nothing is already present
    for (var i = 0; i < this._svgObjects.length; i++) {
      var obj = this._svgObjects[i];
      // ignore whitespace children
      if (!obj.childNodes.length || 
          (obj.childNodes.length == 1 && obj.childNodes[0].nodeType == 3
            && /^[ ]*$/m.test(obj.childNodes[0].nodeValue))) {
        var span = document.createElement('span');
        span.className = 'svg-noscript';
        span.appendChild(document.createTextNode(reason));
        obj.parentNode.replaceChild(span, obj);
      }
    }
    
    // surface any adjacent NOSCRIPTs that might be adjacent to our SVG
    // SCRIPTs; if none present, write out our reason
    for (var i = 0; i < this._svgScripts.length; i++) {
      var script = this._svgScripts[i];
      var output = document.createElement('span');
      output.className = 'svg-noscript';
      
      var sibling = script.nextSibling;
      // jump past everything until we hit our first Element
      while (sibling && sibling.nodeType != 1) {
        sibling = sibling.nextSibling;
      }
      
      if (sibling && sibling.nodeName.toLowerCase() == 'noscript') {
        var noscript = sibling;
        output.innerHTML = noscript.innerHTML;
      } else {
        output.appendChild(document.createTextNode(reason));
      }
      
      script.parentNode.insertBefore(output, script);
    }
  },
  
  /** Fires any addOnLoad() listeners that were registered by a developer. */
  _fireOnLoad: function() {
    // see if all SVG OBJECTs are done loading; if so, fire final onload
    // event for any externally registered SVG
    if (this.handlers.length < this._svgObjects.length) {
      // not even done constructing all our Native Handlers yet
      return;
    }

    var allLoaded = true;
    for (var i = 0; i < this.handlers.length; i++) {
      var h = this.handlers[i];
      if (h.type == 'object' && !h._loaded) {
        allLoaded = false;
        break;
      }
    }

    if (!allLoaded) {
      return;
    }

    // the page is truly finished loading
    this.pageLoaded = true;
    
    // report total startup time
    this._endTime = new Date().getTime();
    // FIXME: Get these times to be more accurate; I think they are off
    //console.log('Total JS plus Flash startup time: ' 
    //                + (this._endTime - this._startTime) + 'ms');
    
    // we do a slight timeout so that if exceptions get thrown inside the
    // developers onload methods they will correctly show up and get reported
    // to the developer; otherwise since the fireOnLoad method is called 
    // from Flash and an exception gets called it can get 'squelched'
    var self = this;
    window.setTimeout(function() {
      // make a copy of our listeners and then clear them out _before_ looping
      // and calling each one; this is to handle the following edge condition: 
      // one of the listeners might dynamically create an SVG OBJECT _inside_ 
      // of it, which would then add a new listener, and we would then 
      // incorrectly get it in our list of listeners as we loop below!
      var listeners = self._loadListeners;
      self._loadListeners = [];
      this.totalLoaded = 0;
      for (var i = 0; i < listeners.length; i++) {
        try {
          listeners[i]();
        } catch (exp) {
          console.log('Error while firing onload: ' + (exp.message || exp));
        }
      }
    }, 1);
  },
  
  /** Cleans up some SVG in various ways (adding IDs, etc.)
  
      @param svg SVG string to clean up.
      @param addMissing If true, we add missing
      XML doctypes, SVG namespace, etc. to make working with SVG a bit easier
      when doing direct embed; if false, we require the XML to be
      well-formed and correct (primarily for independent .svg files). 
      @param normalizeWhitespace If true, we try to remove whitespace between 
      nodes to make the DOM more similar to Internet Explorer's 
      ignoreWhiteSpace, mostly used when doing direct embed of SVG into an 
      HTML page; if false, we leave things alone (primarily for independent 
      .svg files). 
      
      @returns Returns an object with two values:
        svg: cleaned up SVG as a String
        xml: parsed SVG as an XML object
  */
  _cleanSVG: function(svg, addMissing, normalizeWhitespace) {
    start('cleanSVG');
    
    // remove any leading whitespace from beginning and end of SVG doc
    svg = svg.replace(/^\s*/, '');
    svg = svg.replace(/\s*$/, '');
        
    if (addMissing) {
      // add any missing things (XML declaration, SVG namespace, etc.)
      if (/\<\?xml/m.test(svg) == false) { // XML declaration
        svg = '<?xml version="1.0"?>\n' + svg;
      }
      // add SVG namespace declaration; don't however if there is a custom 
      // prefix for SVG namespace
      if (/\<[^\:]+\:svg/m.test(svg) == false) {
        if (/xmlns\=['"]http:\/\/www\.w3\.org\/2000\/svg['"]/.test(svg) == false) {
          svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
      }
      // add xlink namespace if it is not present
      if (/xmlns:[^=]+=['"]http:\/\/www\.w3\.org\/1999\/xlink['"]/.test(svg) == false) {
        svg = svg.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
      }
    }
    
    if (normalizeWhitespace) {
      // remove whitespace between tags to normalize the DOM between IE
      // and other browsers
      svg = svg.replace(/\>\s+\</gm, '><');
    }
    
    // transform text nodes into 'fake' elements so that we can track them
    // with a GUID
    if (this.renderer == FlashHandler) {
      // strip out <!-- --> style comments; these cause a variety of problems:
      // 1) We don't parse comments into our DOM, 2) when we add our
      // <__text> sections below they can get incorrectly nested into multi
      // line comments; stripping them out is a simple solution for now.
      var commentRE = /<!\-\-/g;
      RegExp.lastIndex = 0; // reset global exec()
      var match = commentRE.exec(svg);
      var i = 0;
      var strippedSVG = svg;
      while (match && RegExp.lastMatch) {
        // get the text of the comment
        var endIndx = RegExp.rightContext.indexOf('-->') + 3;
        var comment = '<!--' + RegExp.rightContext.substring(0, endIndx);
        
        // now strip it out
        strippedSVG = strippedSVG.replace(comment, '');
        
        // find next match
        match = commentRE.exec(svg);
        i++;
      }
      svg = strippedSVG;
      
      // We might have nested <svg> elements; we want to make sure we don't
      // incorrectly think these are SVG root elements. To do this, temporarily
      // rename the SVG root element, then rename nested <svg> root elements
      // to a temporary token that we will restore at the end of this method
      svg = svg.replace(/<(svg:)?svg/, '<$1SVGROOT'); // root <svg> element
      svg = svg.replace(/<(svg:)?svg/g, '<$1NESTEDSVG'); // nested <svg>
      svg = svg.replace(/<(svg:)?SVGROOT/, '<$1svg');
      
      // break SVG string into pieces so that we don't incorrectly add our
      // <__text> fake text nodes outside the SVG root tag
      var separator = svg.match(/<[a-zA-Z_-]*:?svg/)[0];
      var pieces = svg.split(/<[a-zA-Z_-]*:?svg/);
      
      // extract CDATA sections temporarily so that we don't end up
      // adding double <__text> blocks
      RegExp.lastIndex = 0; // reset global exec()
      var cdataRE = /<\!\[CDATA\[/g;
      match = cdataRE.exec(pieces[1]);
      var cdataBlocks = [];
      i = 0;
      while (match && RegExp.rightContext) {
        var startIdx = cdataRE.lastIndex - '<![CDATA['.length;
        var context = RegExp.rightContext;
        var endIdx = cdataRE.lastIndex + context.indexOf(']]>') + 2;
        var section = context.substring(0, context.indexOf(']]>'));
        
        // save this CDATA section for later
        section = '<![CDATA[' + section + ']]>';
        cdataBlocks.push(section);
        
        // change the CDATA section into a token that we will replace later
        var before = pieces[1].substring(0, startIdx);
        var after = pieces[1].substring(endIdx + 1, pieces[1].length);
        pieces[1] = before + '__SVG_CDATA_TOKEN_' + i + after;
        
        // find next match
        match = cdataRE.exec(pieces[1]);
        i++;
      }
      
      // capture anything between > and < tags
      pieces[1] = pieces[1].replace(/>([^>]+)</g, 
                                    '><__text>$1</__text><');
                                    
      // re-assemble our CDATA blocks
      for (var i = 0; i < cdataBlocks.length; i++) {
        pieces[1] = pieces[1].replace('__SVG_CDATA_TOKEN_' + i, cdataBlocks[i]);
      }
                      
      // paste the pieces back together
      svg = pieces[0] + separator + pieces[1];
      for (var i = 2; i < pieces.length; i++) {
        svg = svg + pieces[i];
      }
    }
    
    // earlier we turned nested <svg> elements into a temporary token; restore
    // them
    svg = svg.replace(/<(svg:)?NESTEDSVG/g, '<$1svg');
                 
    if (this.renderer == FlashHandler) {
      // handle Flash encoding issues
      svg = FlashHandler._encodeFlashData(svg);
      
      // Firefox and Safari will parse any nodes in the SVG namespace into 'real'
      // SVG nodes when using the Flash handler, which we don't want 
      // (they take up more memory, and can mess up our return results in some 
      // cases). To get around this, we change the SVG namespace in our XML into
      // a temporary different one to prevent this from happening.
      svg = svg.replace(/xmlns(\:[^=]*)?=['"]http\:\/\/www\.w3\.org\/2000\/svg['"]/g, 
                        "xmlns$1='" + svgnsFake + "'");
    }
        
    // add guids and IDs to all elements and get the root SVG elements ID;
    // this also has the side effect of also parsing our SVG into an actual
    // XML tree we can use later; we do it here so that we don't have to
    // parse the XML twice for performance reasons
    var xml = this._addTracking(svg, normalizeWhitespace);
    if (typeof XMLSerializer != 'undefined') { // non-IE browsers
      svg = (new XMLSerializer()).serializeToString(xml);
    } else { // IE
      svg = xml.xml;
    }
    
    // remove the fake SVG namespace we added as a workaround right above now 
    // that we are parsed
    if (this.renderer == FlashHandler) {
      svg = svg.replace(new RegExp(svgnsFake, 'g'), svgns);
    }
    
    end('cleanSVG');
    return {svg: svg, xml: xml};
  },
  
  /** Extracts SVG from the script, cleans it up, adds GUIDs to all elements, 
      and then creates the correct Flash or Native handler to do 
      the hard work. 
      
      @param script SCRIPT node to get the SVG from. */
  _processSVGScript: function(script) {
    //console.log('processSVGScript, script='+script);
    var svg = script.innerHTML;
    var results = this._cleanSVG(svg, true, true);
    svg = results.svg;
    var xml = results.xml;
    var rootID = xml.documentElement.getAttribute('id');
    
    // create the correct handler
    var self = this;
    var finishedCallback = function(id, type){
      // prevent IE memory leaks
      script = null;
      xml = null;

      self._handleDone(id, type);
    };

    var handler = new this.renderer({type: 'script', 
                                     svgID: rootID,
                                     xml: xml, 
                                     svgString: svg,
                                     scriptNode: script,
                                     finishedCallback: finishedCallback});

    // NOTE: FIXME: If someone chooses a rootID that starts with a number
    // this will break
    this.handlers[rootID] = handler;
    this.handlers.push(handler);      
  },
  
  /** Extracts or autogenerates an ID for the object and then creates the
      correct Flash or Native handler to do the hard work. 
      
      @returns The ID for the object, either what was specified or what was
      autogenerated. */
  _processSVGObject: function(obj) {
    //console.log('processSVGObject');
    var objID = obj.getAttribute('id');
    // extract an ID from the OBJECT tag; generate a random ID if needed
    if (!objID) {
      obj.setAttribute('id', svgweb._generateID('__svg__random__', '__object'));
      objID = obj.getAttribute('id');
    }

    // create the correct handler
    var finishedCallback = (function(self) {
      return function(id, type) {
        self._handleDone(id, type);
      };
    })(this); // prevent IE memory leaks
    
    var handler = new this.renderer({type: 'object', 
                                     objID: objID,
                                     objNode: obj,
                                     finishedCallback: finishedCallback});
                                      
    // NOTE: FIXME: If someone chooses an objID that starts with a number
    // this will break
    this.handlers[objID] = handler;
    this.handlers.push(handler);
    
    return objID;
  },
  
  /** Generates a random SVG ID. It is recommended that you use the prefix
      and postfix.
      
      @param prefix An optional string to add to the beginning of the ID.
      @param postfix An optional string to add to the end of the ID. */
  _generateID: function(prefix, postfix) {
    // generate an ID for this element
    if (!postfix) {
      postfix = '';
    }
    
    if (!prefix) {
      prefix = '';
    }
    
    return prefix + guid() + postfix;
  },
  
  /** Walks the SVG DOM, adding automatic generated GUIDs to all elements.
      Generates an ID for the SVG root if one is not present.
      
      @param normalizeWhitespace If true, then when parsing we ignore
      whitespace, acting more like normal HTML; if false, then we keep
      whitespace as independent nodes more like XML.
      @returns Parsed DOM XML Document of the SVG with all elements having 
      an ID and a GUID. */
  _addTracking: function(svg, normalizeWhitespace) {
    var parseWhitespace = !normalizeWhitespace;
                    
    // parse the SVG
    var xmlDoc = parseXML(svg, parseWhitespace);
    var root = xmlDoc.documentElement;
    
    // make sure the root has an ID
    if (root && !root.getAttribute('id')) {
      root.setAttribute('id', this._generateID('__svg__random__', null));
    }
    
    if (this.getHandlerType() != 'flash') {
      return xmlDoc;
    }
    
    // now walk the parsed DOM
    var current = root;
    while (current) {
      if (current.nodeType == _Node.ELEMENT_NODE) {
        current.setAttribute('__guid', guid());
      }
      
      if (current.nodeType == _Node.ELEMENT_NODE 
          && !current.getAttribute('id')) {
        // generate a random ID, since the Flash backend needs IDs for certain
        // scenarios (such as tracking dependencies around redraws for USE
        // nodes, for example)
        current.setAttribute('id', svgweb._generateID('__svg__random__', null));
      }
      
      var next = current.firstChild;
      if (next) {
        current = next;
        continue;
      }
      
      while (current) {
        if (current != root) {
          next = current.nextSibling;
          if (next) {
            current = next;
            break;
          }
        }
        if (current == root) {
          current = null;
        } else {
          current = current.parentNode;
          if (current.nodeType != 1
              || current.nodeName.toUpperCase() == 'SVG') {
            current = null;
          }
        }
      }
    }
    
    return xmlDoc;
  },
  
  /** Called when an SVG SCRIPT or OBJECT is done loading. If we are finished
      loading every SVG item then we fire window onload and also indicate to
      each handler that the page is finished loading so that handlers can
      take further action, such as executing any SVG scripts that might be
      inside of an SVG file loaded in an SVG OBJECT. 
      
      @param ID of either the SVG root element inside of an SVG SCRIPT or 
      the SVG OBJECT that has finished loading.
      @param type Either 'script' for an SVG SCRIPT or 'object' for an
      SVG OBJECT.
      */
  _handleDone: function(id, type) {
    this.totalLoaded++;
    
    if (this.totalLoaded >= this.totalSVG) {
      // we are finished
      this._fireOnLoad();
    }
  },
  
  /** Safari 3 has a strange bug where if you have no HTML TITLE element,
      it will interpret the first SVG TITLE as the HTML TITLE and change
      the browser's title at the top of the title bar; this only happens
      with the native handler, but for consistency we insert an empty
      HTML TITLE into the page if none is present for all handlers
      which solves the issue. */
  _handleHTMLTitleBug: function() {
    var head = document.getElementsByTagName('head')[0];
    var title = head.getElementsByTagName('title');
    if (title.length === 0) {
      title = document.createElement('title');
      head.appendChild(title);
    }
  },
  
  /** This method is a hook useful for unit testing; unit testing can
      override it to be informed if an error occurs inside the Flash
      so that we can stop the unit test and report the error. */
  _fireFlashError: function(logString) {
  },
  
  /** Add an .id attribute for non-SVG and non-HTML nodes for the Native
      Handler, which don't have them by default in order to have parity with the
      Flash viewer. We have this here instead of on the Native Handlers
      themselves because the method is called by our patched 
      document.getElementByTagNameNS and we don't want to do any closure
      magic there to prevent memory leaks. */
  _exportID: function(node) {
    node.__defineGetter__('id', function() {
      return node.getAttribute('id');
    });
    node.__defineSetter__('id', function(newValue) {
      return node.setAttribute('id', newValue);
    });
  },
  
  /** Sign up for the onunload event on IE to clean up references that
      can cause memory leaks. */
  _watchUnload: function() {
    window.attachEvent('onunload', function(evt) {
      // detach this anonymous listener
      window.detachEvent('onunload', arguments.callee);
      
      // do all the onunload work now
      svgweb._fireUnload();
    });
  },
  
  /** Called when window unload event fires; putting this in a separate
      function helps us with unit testing. */
  _fireUnload: function() {
    if (!isIE) { // helps with unit testing
      return;
    }

    // clean up svg:svg root tags
    for (var i = 0; i < svgweb.handlers.length; i++) {
      var root = svgweb.handlers[i].document.documentElement;
      
      if (svgweb.handlers[i].type == 'script') {
        root = root._htcNode;
      }
      
      // remove anything we added to the HTC's style object as well as our
      // property change listener
      root.detachEvent('onpropertychange', root._fakeNode.style._changeListener);
      root.style.item = null;
      root.style.setProperty = null;
      root.style.getPropertyValue = null;
      
      // clean up our hidden HTML DOM and our Flash object
      var flashObj = svgweb.handlers[i].flash;
      flashObj.sendToFlash = null;
      flashObj.parentNode.removeChild(flashObj);
      var html = root._getHTCDocument().getElementsByTagName('html')[0];
      html.parentNode.removeChild(html);
        
      // delete object references
      root._fakeNode._htcNode = null;
      root._fakeNode = null;
      root._realParentNode = null;
      root._realPreviousSibling = null;
      root._realNextSibling = null;
      root._handler = null;
      
      root = null;
    }
    
    // delete the HTC container and all HTC nodes
    var container = document.getElementById('__htc_container');
    if (container) {
      for (var i = 0; i < container.childNodes.length; i++) {
        var child = container.childNodes[i];
        child._fakeNode._htcNode = null;
        child._fakeNode = null;
        child._handler = null;
      }
      container.parentNode.removeChild(container);
      container = null;
    }

    // for all the handlers, remove their reference to the Flash object
    for (var i = 0; i < svgweb.handlers.length; i++) {
      var handler = svgweb.handlers[i];
      handler.flash = null;
    }
    svgweb.handlers = null;

    // clean up any nodes that were removed in the past
    for (var i = 0; i < svgweb._removedNodes.length; i++) {
      var node = svgweb._removedNodes[i];
      if (node._fakeNode) {
        node._fakeNode._htcNode = null;
      }
      node._fakeNode = null;
      node._handler = null;
    }
    svgweb._removedNodes = null;
    
    // cleanup document patching
    document.getElementById = null;
    document._getElementById = null;
    document.getElementsByTagNameNS = null;
    document._getElementsByTagNameNS = null;
    document.createElementNS = null;
    document._createElementNS = null;
    document.createElement = null;
    document._createElement = null;
    document.createTextNode = null;
    document._createTextNode = null;
    document._importNodeFunc = null;
    
    window.addEventListener = null;
    window._addEventListener = null;
    window.attachEvent = null;
    window._attachEvent = null;
  },
  
  /** Does certain things early on in the page load process to cleanup
      any SVG objects on our page, such as making them hidden, etc. */
  _cleanupSVGObjects: function() {
    // if this browser has native SVG support, do some tricks to take away
    // control from it for the Flash renderer early in the process
    if (this.config.use == 'flash' && this.config.hasNativeSVG()) {
      for (var i = 0; i < this._svgObjects.length; i++) {
        // replace the SVG OBJECT with a DIV
        var obj = this._svgObjects[i];
        var div = document.createElement('div');
        for (var j = 0; j < obj.attributes.length; j++) {
          var attr = obj.attributes[j];
          div.setAttribute(attr.nodeName, attr.nodeValue);
        }
        // bring over fallback content
        var fallback = obj.innerHTML;
        div.innerHTML = fallback;
        obj.parentNode.replaceChild(div, obj);
        this._svgObjects[i] = div;
      }
    }
    
    // make any SVG objects have visibility hidden early in the process
    // to prevent IE from showing scroll bars
    for (var i = 0; i < this._svgObjects.length; i++) {
      this._svgObjects[i].style.visibility = 'hidden';
    }
  },
  
  /** Intercepts setting up window.onload events so we can delay firing
      them until we are done with our internal work. */
  _interceptOnloadListeners: function() {
    if (window.addEventListener) {
      window._addEventListener = window.addEventListener;
      window.addEventListener = function(type, f, useCapture) {
        if (type != 'load') {
          return window._addEventListener(type, f, useCapture);
        } else {
          svgweb.addOnLoad(f);
        }
      }
    }
    
    if (isIE && window.attachEvent) {
      window._attachEvent = window.attachEvent;
      window.attachEvent = function(type, f) {
        if (type != 'onload') {
          return window._attachEvent(type, f);
        } else {
          svgweb.addOnLoad(f);
        }
      }
    }
  },
  
  _saveWindowOnload: function() {
    // intercept and save window.onload or <body onload="">
    if (window.onload) {
      // preserve IE's different behavior of firing window.onload 
      // behavior _before_ everything else; other browsers don't necessarily
      // give preferential treatment to window.onload
      if (isIE) {
        this._loadListeners.splice(0, 0, window.onload);
      } else {
        this._loadListeners.push(window.onload);
      }
      window.onload = null;
    }
  }
});


/** Sees if there is a META tag to force Flash rendering for all browsers.
    Also determines if the browser supports native SVG or Flash and the
    correct Flash version. Determines the best renderer to use. */
function RenderConfig() {
  // see if there is a META tag for 'svg.render.forceflash' or a query
  // value in the URL
  if (!this._forceFlash()) {
    // if not, see if this browser natively supports SVG
    if (this.hasNativeSVG()) {
      this.supported = true;
      this.use = 'native';
      return;
    }
  } else {
    console.log('Forcing Flash SVG viewer for this browser');
  }
  
  // if not, see if this browser has Flash and the correct Flash version (9+)
  var info = new FlashInfo();
  if (info.capable) {
    if (info.isVersionOrAbove(9, 0, 0)) {
      this.supported = true;
      this.use = 'flash';
    } else { // has Flash but wrong version
      this.supported = false;
      this.reason = 'Flash 9+ required';
    }
  } else { // no Flash present
    this.supported = false;
    this.reason = 'Flash 9+ or a different browser required';
  }
}

extend(RenderConfig, {
  /** Boolean on whether the given browser is supported. */
  supported: false,
  
  /* String on why the given browser is not supported. */
  reason: null,
  
  /** String on which renderer to use: flash or native. */
  use: null,
  
  /** Determines if there is the META tag 'svg.render.forceflash' set to
      true or a URL query value with 'svg.render.forceflash' given. */
  _forceFlash: function() {
    var results = false;
    var hasMeta = false;
    
    var meta = document.getElementsByTagName('meta');
    for (var i = 0; i < meta.length; i++) {
      if (meta[i].name == 'svg.render.forceflash' &&
          meta[i].content.toLowerCase() == 'true') {
        results = true;
        hasMeta = true;
      }
    }
    
    if (window.location.search.indexOf('svg.render.forceflash=true') != -1) {
      results = true;
    } else if (hasMeta
               && window.location.search.indexOf(
                                        'svg.render.forceflash=false') != -1) {
      // URL takes precedence
      results = false;
    }
    
    return results;
  },
  
  /** Determines whether this browser supports native SVG. */
  hasNativeSVG: function() {
    if (document.implementation && document.implementation.hasFeature) {
      return document.implementation.hasFeature(
            'http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1');
    } else {
      return false;
    }
  }
});


// adapted from Dojo Flash dojox.flash.Info
function FlashInfo(){
	// summary: A class that helps us determine whether Flash is available.
	// description:
	//	A class that helps us determine whether Flash is available,
	//	it's major and minor versions, and what Flash version features should
	//	be used for Flash/JavaScript communication. Parts of this code
	//	are adapted from the automatic Flash plugin detection code autogenerated 
	//	by the Macromedia Flash 8 authoring environment.

	this._detectVersion();
}

FlashInfo.prototype = {
	// version: String
	//		The full version string, such as "8r22".
	version: -1,
	
	// versionMajor, versionMinor, versionRevision: String
	//		The major, minor, and revisions of the plugin. For example, if the
	//		plugin is 8r22, then the major version is 8, the minor version is 0,
	//		and the revision is 22. 
	versionMajor: -1,
	versionMinor: -1,
	versionRevision: -1,
	
	// capable: Boolean
	//		Whether this platform has Flash already installed.
	capable: false,
	
	isVersionOrAbove: function(
							/* int */ reqMajorVer, 
							/* int */ reqMinorVer, 
							/* int */ reqVer){ /* Boolean */
		// summary: 
		//	Asserts that this environment has the given major, minor, and revision
		//	numbers for the Flash player.
		// description:
		//	Asserts that this environment has the given major, minor, and revision
		//	numbers for the Flash player. 
		//	
		//	Example- To test for Flash Player 7r14:
		//	
		//	info.isVersionOrAbove(7, 0, 14)
		// returns:
		//	Returns true if the player is equal
		//	or above the given version, false otherwise.
		
		// make the revision a decimal (i.e. transform revision 14 into
		// 0.14
		reqVer = parseFloat("." + reqVer);
		
		if (this.versionMajor >= reqMajorVer && this.versionMinor >= reqMinorVer
			 && this.versionRevision >= reqVer) {
			return true;
		} else {
			return false;
		}
	},
	
	_detectVersion: function(){
		var versionStr;
		
		// loop backwards through the versions until we find the newest version	
		for (var testVersion = 25; testVersion > 0; testVersion--) {
			if (isIE) {
				var axo;
				try {
					if (testVersion > 6) {
						axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash." 
																		+ testVersion);
					} else {
						axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
					}
					if (typeof axo == "object") {
						if (testVersion == 6) {
							axo.AllowScriptAccess = "always";
						}
						versionStr = axo.GetVariable("$version");
					}
				} catch(e) {
					continue;
				}
			} else {
				versionStr = this._JSFlashInfo(testVersion);		
			}
				
			if (versionStr == -1 ) {
				this.capable = false; 
				return;
			} else if (versionStr !== 0) {
				var versionArray;
				if (isIE) {
					var tempArray = versionStr.split(" ");
					var tempString = tempArray[1];
					versionArray = tempString.split(",");
				} else {
					versionArray = versionStr.split(".");
				}
					
				this.versionMajor = versionArray[0];
				this.versionMinor = versionArray[1];
				this.versionRevision = versionArray[2];
				
				// 7.0r24 == 7.24
				var versionString = this.versionMajor + "." + this.versionRevision;
				this.version = parseFloat(versionString);
				
				this.capable = true;
				
				break;
			}
		}
	},
	 
	// JavaScript helper required to detect Flash Player PlugIn version 
	// information.
	_JSFlashInfo: function(testVersion){
		// NS/Opera version >= 3 check for Flash plugin in plugin array
		if (navigator.plugins !== null && navigator.plugins.length > 0) {
			if (navigator.plugins["Shockwave Flash 2.0"] || 
				 navigator.plugins["Shockwave Flash"]) {
				var swVer2 = navigator.plugins["Shockwave Flash 2.0"] ? " 2.0" : "";
				var flashDescription = navigator.plugins["Shockwave Flash" + swVer2].description;
				var descArray = flashDescription.split(" ");
				var tempArrayMajor = descArray[2].split(".");
				var versionMajor = tempArrayMajor[0];
				var versionMinor = tempArrayMajor[1];
				var tempArrayMinor = (descArray[3] || descArray[4]).split("r");
				var versionRevision = tempArrayMinor[1] > 0 ? tempArrayMinor[1] : 0;
				var version = versionMajor + "." + versionMinor + "." + versionRevision;
											
				return version;
			}
		}
		
		return -1;
	}
};


/** Creates a FlashHandler that will embed the given SVG into the page using
    Flash. Pass in an object literal with the correct arguments. 
    
    If dealing with an SVG SCRIPT tag these arguments are:
    
    type - The string 'script'.
    svgID - A unique ID for the SVG root tag.
    xml - XML Document object for parsed SVG.
    svgString - The SVG content as a String.
    scriptNode - The DOM element for the SVG SCRIPT block.
    finishedCallback - Called when we are done loading and rendering the
    SVG inside of the Flash player; called with two arguments, the svgID
    that was just rendered and type set to 'script'.
    
    If dealing with an SVG OBJECT tag these arguments are:
    
    type - The string 'object'.
    objID - A unique ID for the SVG OBJECT tag.
    objNode - DOM OBJECT pointing to an SVG URL to handle.
    finishedCallback - Called when we are done loading and rendering the
    SVG inside of the Flash player; called with two arguments, the svgID
    that was just rendered and type set to 'object'. 
  */
function FlashHandler(args) {
  this.type = args.type;
  this._finishedCallback = args.finishedCallback;
  
  // we keep a record of all keyboard listeners added by any of our nodes;
  // this is necessary so that if the containing SVG document is removed from
  // the DOM we can clean up keyboard listeners, which are actually registered
  // on the document object
  this._keyboardListeners = [];
  
  if (this.type == 'script') {
    this.id = args.svgID;
    this._xml = args.xml;
    this._svgString = args.svgString;
    this._scriptNode = args.scriptNode;
    this._handleScript();
  } else if (this.type == 'object') {
    this.id = args.objID;
    this._objNode = args.objNode;
    this._handleObject();
  }
}

// start of 'static' singleton functions and properties

// when someone calls createElementNS or createTextNode we are not attached
// to a handler yet; we need an XML document object in order to generate things
// though, so this single unattached XML document object serves that purpose
FlashHandler._unattachedDoc = parseXML('<?xml version="1.0"?>\n'
                                       + '<svg xmlns="' + svgns + '"></svg>',
                                       false);

/** Prepares the svg.htc behavior for IE. */
FlashHandler._prepareBehavior = function(libraryPath, htcFilename) {
  // Adapted from Mark Finkle's SVG using VML project

  // add the SVG namespace to the page in a way IE can use
  var ns = null;
  for (var i = 0; i < document.namespaces.length; i++) {
    if (document.namespaces.item(i).name == 'svg') {
      ns = document.namespaces.item(i);
      break;
    }
  }
  
  if (ns === null) {
    ns = document.namespaces.add('svg', svgns);
  }
  
  // attach SVG behavior to the page
  ns.doImport(libraryPath + htcFilename);
};

/** Fetches an _Element or _Node or creates a new one on demand.
    
    @param nodeXML XML or HTML DOM node for the element to use when 
    constructing the _Element or _Node.
    @param handler Optional. A FlashHandler to associate with this node if
    the node is attached to a real DOM.
    
    @returns If IE, returns the HTC proxy for the node (i.e. node._htcNode) so
    that external callers can manipulate it and have getter/setter magic happen; 
    if other browsers, returns the _Node or _Element itself. */
FlashHandler._getNode = function(nodeXML, handler) {
  //console.log('getNode, nodeXML='+nodeXML+', nodeName='+nodeXML.nodeName+', guid='+nodeXML.getAttribute('__guid')+', handler='+handler);
  var node;
  
  // if we've created an _Element or _Node for this XML before, we
  // stored a reference to it by GUID so we could get it later
  node = svgweb._guidLookup['_' + nodeXML.getAttribute('__guid')];

  // NOTE: We represent text nodes using an XML Element node in order to do
  // tracking, so we have to catch this fact below
  var fakeTextNode = false;
  if (!node && nodeXML.nodeName == '__text') {
    fakeTextNode = true;
  }
  
  if (!node && !fakeTextNode && nodeXML.nodeType == _Node.ELEMENT_NODE) {
    // never seen before -- we'll have to create a new _Element now
    node = new _Element(nodeXML.nodeName, nodeXML.prefix, 
                        nodeXML.namespaceURI, nodeXML, handler, true);
  } else if (!node && (nodeXML.nodeType == _Node.TEXT_NODE || fakeTextNode)) {
    node = new _Node('#text', _Node.TEXT_NODE, null, null, nodeXML,
                     handler, false);
  } else if (!node) {
    throw new Error('Unknown node type given to _getNode: ' 
                    + nodeXML.nodeType);
  }
    
  return node._getProxyNode();
};

/** Patches the document object to also use the Flash backend. */
FlashHandler._patchBrowserObjects = function(win, doc) {
  if (doc._getElementById) { // already patched
    return;
  }
  
  // We don't capture the original document functions as a closure, 
  // as Firefox doesn't like this and will fail to run the original. 
  // Instead, we capture the original versions on the document object
  // itself but with a _ prefix.
  
  document._getElementById = document.getElementById;
  document.getElementById = FlashHandler._getElementById;
  
  document._getElementsByTagNameNS = document.getElementsByTagNameNS;
  document.getElementsByTagNameNS = FlashHandler._getElementsByTagNameNS;
  
  document._createElementNS = document.createElementNS;
  document.createElementNS = FlashHandler._createElementNS;
  
  document._createElement = document.createElement;
  document.createElement = FlashHandler._createElement;
    
  document._createTextNode = document.createTextNode;
  document.createTextNode = FlashHandler._createTextNode;
  
  document._importNodeFunc = FlashHandler._importNodeFunc;
};

/** Our implementation of getElementById, which we patch into the 
    document object. We do it here to prevent a closure and therefore
    a memory leak on IE. Note that this function runs in the global
    scope, so 'this' will not refer to our object instance but rather
    the window object. */
FlashHandler._getElementById = function(id) {
  var result = document._getElementById(id);
  if (result !== null) { // Firefox doesn't like 'if (result)'
    return result;
  }

  for (var i = 0; i < svgweb.handlers.length; i++) {
    if (svgweb.handlers[i].type == 'script') {
      result = svgweb.handlers[i].document.getElementById(id);
    }
    
    if (result) {
      return result;
    }
  }
  
  return null;
};

/** Our implementation of getElementsByTagNameNS, which we patch into the 
    document object. We do it here to prevent a closure and therefore
    a memory leak on IE. Note that this function runs in the global
    scope, so 'this' will not refer to our object instance but rather
    the window object. */
FlashHandler._getElementsByTagNameNS = function(ns, localName) {
  //console.log('getElementsByTagNameNS, ns='+ns+', localName='+localName);
  var results = createNodeList();
  
  // NOTE: can't use Array.concat to combine our arrays below because 
  // document._getElementsByTagNameNS results aren't a real Array, they
  // are DOM NodeLists
  
  if (document._getElementsByTagNameNS) {
    var matches = document._getElementsByTagNameNS(ns, localName);
    
    for (var j = 0; j < matches.length; j++) {
      results.push(matches[j]);
    }
  }
  
  for (var i = 0; i < svgweb.handlers.length; i++) {
    if (svgweb.handlers[i].type == 'script') {
      var doc = svgweb.handlers[i].document;
      var matches = doc.getElementsByTagNameNS(ns, localName);
      for (var j = 0; j < matches.length; j++) {
        results.push(matches[j]);
      }
    }
  }

  return results;
};

/** Our implementation of createElementNS, which we patch into the 
    document object. We do it here to prevent a closure and therefore
    a memory leak on IE. Note that this function runs in the global
    scope, so 'this' will not refer to our object instance but rather
    the window object. */
FlashHandler._createElementNS = function(ns, qname) {
  //console.log('createElementNS, ns='+ns+', qname='+qname);
  if (ns === null || ns == 'http://www.w3.org/1999/xhtml') {
    if (isIE) {
      return document.createElement(qname);
    } else {
      return document._createElementNS(ns, qname);
    }
  }
  
  // Firefox and Safari will incorrectly turn our internal parsed XML
  // for the Flash Handler into actual SVG nodes, causing issues. This is
  // a workaround to prevent this problem.
  if (ns == svgns) {
    ns = svgnsFake;
  }
  
  // someone might be using this library on an XHTML page;
  // only use our overridden createElementNS if they are using
  // a namespace we have never seen before
  if (!isIE) {
    var namespaceFound = false;
    for (var i = 0; i < svgweb.handlers.length; i++) {
      if (svgweb.handlers[i].type == 'script'
          && svgweb.handlers[i].document._namespaces['_' + ns]) {
        namespaceFound = true;
        break;
      }
    }
    
    if (!namespaceFound) {
      return document._createElementNS(ns, qname);
    }
  }
  
  var prefix;
  for (var i = 0; i < svgweb.handlers.length; i++) {
    if (svgweb.handlers[i].type == 'script') {
      prefix = svgweb.handlers[i].document._namespaces['_' + ns];
      if (prefix) {
        break;
      }
    }
  }
  
  if (prefix == 'xmlns' || !prefix) { // default SVG namespace
    prefix = null;
  }

  var node = new _Element(qname, prefix, ns);
  
  return node._getProxyNode(); 
};

/** Our implementation of createElement, which we patch into the 
    document object. We do it here to prevent a closure and therefore
    a memory leak on IE. Note that this function runs in the global
    scope, so 'this' will not refer to our object instance but rather
    the window object. 
    
    We patch createElement to have a second boolean argument that controls 
    how we handle the nodeName, in particular for 'object'. This flags to
    us that this object will be used as an SVG object so that we can 
    keep track of onload listeners added through addEventListener.
    
    @param nodeName The node name, such as 'div' or 'object'.
    @param forSVG Optional boolean on whether the node is an OBJECT that
    will be used as an SVG OBJECT. Defaults to false. */
FlashHandler._createElement = function(nodeName, forSVG) {
  if (!forSVG) {
    return document._createElement(nodeName);
  } else if (forSVG && nodeName.toLowerCase() == 'object') {
    var obj = document._createElement('object');
    obj._listeners = [];
    
    // capture any original addEventListener method
    var addEventListener = obj.addEventListener;
    // Do a trick to form a mini-closure here so that we don't capture
    // the objects above and form memory leaks on IE. We basically patch
    // addEventListener for just this object to build up our list of
    // onload listeners; for other event types we delegate to the browser's
    // native way to attach event listeners.
    (function(_obj, _addEventListener){
      _obj.addEventListener = function(type, listener, useCapture) {
        // handle onloads special
        // NOTE: 'this' == our SVG OBJECT
        if (type == 'load') {
          this._listeners.push(listener);
        } else if (!addEventListener) { // IE
          this.attachEvent('on' + type, listener);
        } else { // W3C
          _addEventListener(type, listener, useCapture);
        }  
      };
    })(obj, addEventListener); // pass in object and native addEventListener
    
    return obj;
  }
};

/** Our implementation of createTextNode, which we patch into the 
    document object. We do it here to prevent a closure and therefore
    a memory leak on IE. Note that this function runs in the global
    scope, so 'this' will not refer to our object instance but rather
    the window object. 
    
    We patch createTextNode to have a second boolean argument that controls 
    whether the resulting text node will be appended within our SVG tree. 
    We need this so we can return one of our magic _Nodes instead of a native
    DOM node for later appending and tracking. 
    
    @param data Text String.
    @param forSVG Optional boolean on whether node will be attached to
    SVG sub-tree. Defaults to false. */
FlashHandler._createTextNode = function(data, forSVG) {
  if (!forSVG) {
    return document._createTextNode(data);
  } else {
    // we create a DOM Element instead of a DOM Text Node so that we can
    // assign it a _guid and do tracking on it; we assign the data value
    // to a DOM Text Node that is a child of our fake DOM Element. Note
    // that since we are unattached we use an XML document object we
    // created earlier (FlashHandler._unattachedDoc) in order to
    // generate things.
    var doc = FlashHandler._unattachedDoc;
    var nodeXML;
    if (isIE) {
      nodeXML = doc.createElement('__text');
    } else {
      nodeXML = doc.createElementNS(svgnsFake, '__text');
    }
    nodeXML.appendChild(doc.createTextNode(data));
    var textNode = new _Node('#text', _Node.TEXT_NODE, null, null, nodeXML);
    textNode._nodeValue = data;
    textNode.ownerDocument = document;
    
    return textNode._getProxyNode();
  }
};

/** IE doesn't support the importNode function. We define it on the
    document object as _importNodeFunc. Unfortunately we need it there
    since it is a recursive function and needs to call itself, and we
    don't want to do this on an object instance to avoid memory leaks
    from closures on IE. Note that this function runs in the global scope
    so 'this' will point to the Window object. 
    
    @param doc The document object to work with.
    @param node An XML node to import
    @param allChildren Whether to import the node's children as well. */
FlashHandler._importNodeFunc = function(doc, node, allChildren) {
  switch (node.nodeType) {
    case 1: // ELEMENT NODE
      var newNode = doc.createElement(node.nodeName);

      // does the node have any attributes to add?
      if (node.attributes && node.attributes.length > 0) {
        for (var i = 0; i < node.attributes.length; i++) {
          var attrName = node.attributes[i].nodeName;
          var attrValue = node.getAttribute(attrName);
          newNode.setAttribute(attrName, attrValue);
        }
      }

      // are we going after children too, and does the node have any?
      if (allChildren && node.childNodes && node.childNodes.length > 0) {
        for (var i = 0; i < node.childNodes.length; i++) {
          newNode.appendChild(
              document._importNodeFunc(doc, node.childNodes[i], allChildren));
        }
      }

      return newNode;
      break;
    case 3: // TEXT NODE
      return doc.createTextNode(node.nodeValue);
      break;
  }
};

/** Flash has a number of encoding issues when talking over the Flash/JS
    boundry. This method encapsulates fixing these issues. 
    
    @param str String before fixing encoding issues.
    
    @returns String suitable for sending to Flash. */
FlashHandler._encodeFlashData = function(str) {
  // Flash has a surprising bug: backslashing certain characters will
  // cause an 'Illegal Character' error. For example, if I have a SCRIPT
  // inside my SVG OBJECT as follows: var temp = "\"\"" then I will get
  // this exception. To handle this we double encode back slashes.
  str = str.toString().replace(/\\/g, '\\\\');
  
  // Flash barfs on entities, such as &quot;. To get around this, tokenize
  // our & characters which we will then replace on the other side.
  str = str.replace(/&/g, '__SVG__AMPERSAND');
  
  return str;
};

// end static singleton functions

// methods that every FlashHandler instance will have
extend(FlashHandler, {
  /** The Flash object's ID; set by _SVGSVGElement. */
  flashID: null, 
  
  /** The Flash object; set by _SVGSVGElement. */
  flash: null,
  
  /** If we this handler is in charge of an SVG OBJECT and that object
      has explicit width and height settings on itself, we store these
      here to later pass to Flash to help with viewBox calculations. These
      are set by FlashInserter._determineSize(). */
  _explicitWidth: null,
  _explicitHeight: null,

  /**
    Stringifies the object we send back and forth between Flash and JavaScript.
    Performance testing found that sending strings between Flash and JS is
    about twice as fast as sending objects.
  */
  _msgToString: function(msg) {
    var result = [];
    for (var i in msg) {
      result.push(i + ':' + msg[i]);
    }
    
    // we use a custom delimiter (__SVG__DELIMIT) instead of commas, since 
    // the message might have an XML payload or commas already
    result = result.join('__SVG__DELIMIT');
    
    return result;
  },
  
  /** Turns the string results from Flash back into an Object. The HTC
      still returns an Object, so we detect that and simply return it if so. */
  _stringToMsg: function(msg) {
    if (msg == null || typeof msg != 'string') {
      return msg;
    }
    
    var results = {};
          
    // our delimiter is a custom token: __SVG__DELIMIT
    var tokens = msg.split(/__SVG__DELIMIT/g);
    for (var i = 0; i < tokens.length; i++) {
        // each token is a propname:propvalue pair
        var cutAt = tokens[i].indexOf(':');
        var propName = tokens[i].substring(0, cutAt);
        var propValue = tokens[i].substring(cutAt + 1);
        if (propValue === 'true') {
            propValue = true;
        } else if (propValue === 'false') {
            propValue = false;
        } else if (propValue === 'null') {
            propValue = null;
        } else if (propValue === 'undefined') {
            propValue = undefined;
        }
                        
        results[propName] = propValue;
    }
    
    return results;
  },
  
  /**
    Stringifies the msg object sent back from the Flash SVG renderer or 
    from the HTC file to help with debugging.
  */
  debugMsg: function(msg) {
    if (msg === undefined) {
      return 'undefined';
    } else if (msg === null) {
      return 'null';
    }

    var result = [];
    for (var i in msg) {
      result.push(i + ':' + msg[i]);
    }
    result = result.join(', ');

    return '{' + result + '}';
  },
  
  /** Sends a message to the Flash object rendering this SVG. */
  sendToFlash: function(msg) {
    // note that 'this.flash' is set by the FlashInserter class after we 
    // create a Flash object there
    return this._stringToMsg(this.flash.sendToFlash(this._msgToString(msg)));
  },
  
  /** @param msg The HTC sends us an Object populated with various values;
      for Flash, we send over string values instead since we found that
      performance is roughly double as strings. */
  onMessage: function(msg) {
    msg = this._stringToMsg(msg);
    //console.log('onMessage, msg='+this.debugMsg(msg));
    if (msg.type == 'event') {
      this._onEvent(msg);
      return;
    } else if (msg.type == 'log') {
      this._onLog(msg);
      return;
    } else if (msg.type == 'script') {
      this._onObjectScript(msg);
      return;
    } else if (msg.type == 'error') {
      this._onFlashError(msg);
    }
  },
  
  /** Called by _SVGSVGElement or _SVGObject when we are loaded and rendered. 
  
      @param id The ID of the SVG element.
      @param type The type of element that is finished loading,
      either 'script' or 'object'. */
  fireOnLoad: function(id, type) {
    this._finishedCallback(id, type);
  },
  
  /** Handles SVG embedded into the page with a SCRIPT tag. */
  _handleScript: function() {
    // create proxy objects representing the Document and SVG root; these
    // kick off creating the Flash internally
    this.document = new _Document(this._xml, this);
    this.document.documentElement = 
            new _SVGSVGElement(this._xml.documentElement, this._svgString,
                               this._scriptNode, this);
  },
  
  /** Handles SVG embedded into the page with an OBJECT tag. */
  _handleObject: function() {
    // transform the SVG OBJECT into a Flash one; the _SVGObject class
    // will handle embedding the Flash asychronously; see there for 
    // where the code continues after the Flash is done loading
    this._svgObject = new _SVGObject(this._objNode, this);
    this._objNode = null;
  },
  
  _onLog: function(msg) {
    console.log('FLASH: ' + msg.logString);
  },
  
  _onEvent: function(msg) {
    //console.log('onEvent, msg='+this.debugMsg(msg));
    if (msg.eventType.substr(0, 5) == 'mouse') {
      this._onMouseEvent(msg);
      return;
    } else if (msg.eventType == 'onRenderingFinished') {
      if (this.type == 'script') {
        this.document.documentElement._onRenderingFinished(msg);
      } else if (this.type == 'object') {
        this._svgObject._onRenderingFinished(msg);
      }
      return;
    } else if (msg.eventType == 'onFlashLoaded') {
      if (this.type == 'script') {
        this.document.documentElement._onFlashLoaded(msg);
      } else if (this.type == 'object') {
        this._svgObject._onFlashLoaded(msg);
      }
      return;
    }
  },
  
  _onMouseEvent: function(msg) {
    //console.log('_onMouseEvent, msg='+this.debugMsg(msg));
    var target = svgweb._guidLookup['_' + msg.targetGUID];
    var currentTarget = svgweb._guidLookup['_' + msg.currentTargetGUID];

    // TODO: FIXME: need to compute proper coordinates
    var evt = { target: target,
                currentTarget: currentTarget,
                clientX: msg.screenX,
                clientY: msg.screenY,
                screenX: msg.screenX,
                screenY: msg.screenY,
                preventDefault: function() { this.returnValue=false; }
              };
              
    var handlers = currentTarget._listeners[msg.eventType];
    for (var i = 0; i < handlers.length; i++) {
      var handler = handlers[i];
      var listener = handler.listener;
      listener(evt);
    }
  },
  
  /** Calls if the Flash encounters an error. */
  _onFlashError: function(msg) {
    this._onLog(msg);
    svgweb._fireFlashError('FLASH: ' + msg.logString);
    throw new Error('FLASH: ' + msg.logString);
  },
  
  /** Stores any SCRIPT that might be inside an SVG file embedded through
      an SVG OBJECT to be executed at a later time when are done
      loading the Flash and HTC infrastructure. */
  _onObjectScript: function(msg) {
    //console.log('onObjectScript, msg='+this.debugMsg(msg));
    
    // batch for later execution
    this._svgObject._scriptsToExec.push(msg.script);
  }
});  


/** Creates a NativeHandler that will embed the given SVG into the page using
    native SVG support. Pass in an object literal with the correct arguments. 
    
    If dealing with an SVG SCRIPT tag these arguments are:
    
    type - The string 'script'.
    svgID - A unique ID for the SVG root tag.
    xml - XML Document object for parsed SVG.
    svgString - The SVG content as a String.
    scriptNode - The DOM element for the SVG SCRIPT block.
    finishedCallback - Called when we are done loading and rendering the
    SVG; called with two arguments, the svgID that was just rendered and 
    type set to 'script'.
    
    If dealing with an SVG OBJECT tag these arguments are:
    
    type - The string 'object'.
    objID - A unique ID for the SVG OBJECT tag.
    objNode - DOM OBJECT pointing to an SVG URL to handle.
    finishedCallback - Called when we are done loading and rendering the
    SVG; called with two arguments, the svgID that was just rendered and 
    type set to 'object'.
  */
function NativeHandler(args) {
  this.type = args.type;
  this._finishedCallback = args.finishedCallback;
  
  this._xml = args.xml;
  
  if (this.type == 'object') {
    // these are mostly handled by the browser
    this.id = args.objID;
    this._objNode = args.objNode;
    this._handleObject();
  } else if (this.type == 'script') {
    this.id = args.svgID;
    this._svgString = args.svgString;
    this._scriptNode = args.scriptNode;
    this._handleScript();
  }
}

// start of 'static' singleton functions, mostly around patching the 
// document object with some bug fixes
NativeHandler._patchBrowserObjects = function(win, doc) {
  if (doc._getElementById) {
    // already defined before
    return;
  }
  
  // we have to patch getElementById because getting a node by ID
  // if it is namespaced to something that is not XHTML or SVG does
  // not work natively; we build up a lookup table in _processSVGScript
  // that we can work with later
  // FIXME: explore actually removing support for this, as it's 'correct'
  // behavior according to the XML specification and would save file size
  // and simplify the NativeHandler code significantly
  
  // getElementById
  doc._getElementById = doc.getElementById;
  doc.getElementById = function(id) {
    var result = doc._getElementById(id);
    if (result !== null) { // Firefox doesn't like 'if (result)'
      // This is to solve an edge bug on Safari 3;
      // if you do a replaceChild on a non-SVG, non-HTML node,
      // the element is still returned by getElementById!
      // The element has a null parentNode.
      // TODO: FIXME: Track down whether this is caused by a memory
      // leak of some kind
      if (result.parentNode === null) {
        return null;
      } else {
        return result;
      }
    }
    
    // The id attribute for namespaced, non-SVG and non-HTML nodes
    // does not get picked up by getElementById, such as 
    // <sodipodi:namedview id="someID"/>, so we have to use an XPath 
    // expression
    result = xpath(doc, null, '//*[@id="' + id + '"]');
    if (result.length) {
      var node = result[0];
      
      // add an .id attribute for non-SVG and non-HTML nodes, which
      // don't have them by default in order to have parity with the
      // Flash viewer; note Firefox doesn't like if (node.namespaceURI)
      // rather than (node.namespaceURI !== null)
      if (node.namespaceURI !== null && node.namespaceURI != svgns
          && node.namespaceURI != 'http://www.w3.org/1999/xhtml') {
        svgweb._exportID(node);
      }
      
      return node;
    } else {
      return null;
    }
  };
  
  // we also have to patch getElementsByTagNameNS because it does 
  // not seem to work consistently with namepaced content in an HTML
  // context, I believe due to casing issues (i.e. if the local name
  // were RDF rather than rdf it won't work)
  
  // getElementsByTagNameNS
  doc._getElementsByTagNameNS = doc.getElementsByTagNameNS;
  doc.getElementsByTagNameNS = function(ns, localName) {
    var result = doc._getElementsByTagNameNS(ns, localName);
    
    // firefox doesn't like if (result)
    if (result !== null && result.length !== 0) {
      if (ns !== null && ns != 'http://www.w3.org/1999/xhtml' && ns != svgns) {
        // add an .id attribute for non-SVG and non-HTML nodes, which
        // don't have them by default in order to have parity with the
        // Flash viewer
        for (var i = 0; i < result.length; i++) {
          var node = result[i];
          svgweb._exportID(node);
        }
        
        return result;
      }
      
      return result;
    }
    
    if (result === null || result.length === 0) {
      result = createNodeList();
    }
    
    var xpathResults;
    for (var i = 0; i < svgweb.handlers.length; i++) {
      var handler = svgweb.handlers[i];
      
      if (handler.type == 'object') {
        continue;
      }
      
      var prefix = handler._namespaces['_' + ns];
      if (!prefix) {
        continue;
      }
      
      var expr;
      if (prefix == 'xmlns') { // default SVG namespace
        expr = "//*[namespace-uri()='" + svgns + "' and name()='" 
               + localName + "']";
      } else if (prefix) {
        expr = '//' + prefix + ':' + localName;
      } else {
        expr = '//' + localName;
      }
      
      xpathResults = xpath(doc, handler._svgRoot, expr, 
                           handler._namespaces);
      if (xpathResults !== null && xpathResults !== undefined
          && xpathResults.length > 0) {
        for (var j = 0; j < xpathResults.length; j++) {
          var node = xpathResults[j];
          
          // add an .id attribute for non-SVG and non-HTML nodes, which
          // don't have them by default in order to have parity with the
          // Flash viewer; note Firefox doesn't like if (node.namespaceURI)
          // rather than (node.namespaceURI !== null)
          if (node.namespaceURI !== null && node.namespaceURI != svgns
              && node.namespaceURI != 'http://www.w3.org/1999/xhtml') {
            svgweb._exportID(node);
          }
          
          result.push(node);
        }
        
        return result;
      }
    }
    
    return createNodeList();
  };
  
  // Firefox/Native needs some help around svgElement.style.* access; see
  // NativeHandler._patchStyleObject for details
  if (isFF) {
    NativeHandler._patchStyleObject(win);
  }
};

/** Surprisingly, Firefox doesn't work when setting svgElement.style.property! 
    For example, if you set myCircle.style.fill = 'red', nothing happens. You 
    have to do myCircle.style.setProperty('fill', 'red', null). This issue is 
    independent of the fact that we are running in a text/html situation,
    and happens in self-contained SVG files as well. To fix this, we have
    to patch in the ability to use the svgElement.style.* syntax. Note that
    Safari, Opera, Chrome, and others all natively support the 
    svgElement.style.* syntax so we don't have to patch anything there.
    
    @param window The owner window to patch.
*/
NativeHandler._patchStyleObject = function(win) {
  // Unfortunately, trying to set SVGElement.prototype.style = to our own
  // custom object that then defines all of our getters and setters doesn't
  // work; somehow that is a 'magical' prototype that doesn't stick. Instead,
  // the trick we have to use is to modify the CSSStyleDeclaration prototype.
  // TODO: Document whether adding extra members to CSSStyleDeclaration has
  // a memory impact because it also affects HTML elements.
  
  // prototype definitions are 'window' specific
  var patchMe = win.CSSStyleDeclaration;
  
  // define getters and setters for SVG CSS property names
  for (var i = 0; i < _Style._allStyles.length; i++) {
    var styleName = _Style._allStyles[i];
  
    // convert camel casing (i.e. strokeWidth becomes stroke-width)
    var stylePropName = styleName.replace(/([A-Z])/g, '-$1').toLowerCase();
  
    // Do a trick so that we can have a separate closure for each
    // iteration of the loop and therefore each separate style name; 
    // closures are function-level, so doing an anonymous inline function 
    // will force the closure into just being what we pass into it. If we 
    // don't do this then the closure will actually always simply be the final 
    // index position when the for loop finishes.
    (function(styleName, stylePropName) {
      patchMe.prototype.__defineSetter__(styleName, 
        function(styleValue) {
          return this.setProperty(stylePropName, styleValue, null);
        }
      );
      patchMe.prototype.__defineGetter__(styleName, 
        function() {
          return this.getPropertyValue(stylePropName);
        }
      );
    })(styleName, stylePropName); // pass closure values
  }
};

// end of static singleton functions

// methods that every NativeHandler instance has
extend(NativeHandler, {
  /** Handles SVG embedded into the page with a SCRIPT tag. */
  _handleScript: function() {
    // build up a list of namespaces, used by our patched getElementsByTagNameNS
    this._namespaces = this._getNamespaces();
    
    // replace the SCRIPT node with some actual SVG
    this._processSVGScript(this._xml, this._svgString, this._scriptNode);
    
    // indicate that we are done
    this._finishedCallback(this.id, 'script');
  },
  
  /** Handles SVG embedded into the page with an OBJECT tag. */
  _handleObject: function() {
    // needed so that Firefox doesn't display scroll bars on SVG content
    // (Issue 164: http://code.google.com/p/svgweb/issues/detail?id=164)
    // FIXME: Will this cause issues if someone wants to override default
    // overflow behavior?
    this._objNode.style.overflow = 'hidden';
        
    // make the object visible again
    this._objNode.style.visibility = 'visible';
    
    // at this point we wait for our SVG OBJECTs to call svgweb.addOnLoad
    // so we can know they have loaded. Some browsers however will fire the 
    // onload of the SVG file _before_ our NativeHandler is done depending
    // on whether they are loading from the cache or not; others will do it the 
    // opposite way (Safari). If the onload was fired and therefore 
    // svgweb.addOnLoad was called, then we stored a reference the SVG file's 
    // Window object there.
    if (this._objNode._svgWindow) {
      this._onObjectLoad(this._objNode._svgFunc, this._objNode._svgWindow);
    } else {    
      // if SVG Window isn't there, then we need to wait for svgweb.addOnLoad
      // to get called by the SVG file itself. Store a reference to ourselves
      // to be used there.
      this._objNode._svgHandler = this;
    }
  },
  
  /** Called by svgweb.addOnLoad() or our NativeHandler function constructor
      after an SVG OBJECT has loaded to tell us that we have loaded. We require 
      that script writers manually tell us when they have loaded; see 
      'Knowing When Your SVG Is Loaded' section in the documentation.
      
      @param func The actual onload function to fire inside the SVG file
      (i.e. this is the function the end developer wants run when the SVG
      file is done loading).
      @param win The Window object inside the SVG OBJECT */
  _onObjectLoad: function(func, win) {
    //console.log('onObjectLoad');
    // flag that we are loaded
    this._loaded = true;
    
    // patch the document and style objects to correct some browser bugs and 
    // to have more consistency between the Flash and Native handlers
    var doc = win.document;    
    NativeHandler._patchBrowserObjects(win, doc);
    
    // expose the svgns and xlinkns variables inside in the SVG files 
    // Window object
    win.svgns = svgns;
    win.xlinkns = xlinkns;
    
    // build up list of namespaces so that getElementsByTagNameNS works with
    // foreign namespaces
    this._namespaces = this._getNamespaces(doc);
    
    // execute the actual SVG onload that the developer wants run
    if (func) {
      func.apply(win);
    }
    
    // try to fire the page-level onload event; the svgweb object will check
    // to make sure all SVG OBJECTs are loaded
    svgweb._fireOnLoad();
  },
  
  /** Inserts the SVG back into the HTML page with the correct namespace. */
  _processSVGScript: function(xml, svgString, scriptNode) {
   var importedSVG = document.importNode(xml.documentElement, true);
   scriptNode.parentNode.replaceChild(importedSVG, scriptNode);
   this._svgRoot = importedSVG;
  },
  
  /** Extracts any namespaces we might have, creating a prefix/namespaceURI
      lookup table.
      
      NOTE: We only support namespace declarations on the root SVG node
      for now.
      
      @param doc Optional. If present, then we retrieve the list of namespaces
      from the SVG inside of the object. This is the document object inside the
      SVG file.
      
      @returns An object that associates prefix to namespaceURI, and vice
      versa. */
  _getNamespaces: function(doc) {
    var results = [];
    
    var attrs;
    if (doc) {
      attrs = doc.documentElement.attributes;
    } else {
      attrs = this._xml.documentElement.attributes;
    }
    
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      if (/^xmlns:?(.*)$/.test(attr.nodeName)) {
        var m = attr.nodeName.match(/^xmlns:?(.*)$/);
        var prefix = (m[1] ? m[1] : 'xmlns');
        var namespaceURI = attr.nodeValue;
        
        // don't add duplicates
        if (!results['_' + prefix]) {
          results['_' + prefix] = namespaceURI;
          results['_' + namespaceURI] = prefix;
          results.push(namespaceURI);
        }
      }
    }
    
    return results;
  }
});


/*
  The SVG 1.1 spec requires DOM Level 2 Core and Events support.
  
  DOM Level 2 Core spec: http://www.w3.org/TR/DOM-Level-2-Core/
  DOM Level 2 Events spec: 
  http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-Registration-interfaces
  
  The following DOM 2 Core interfaces are not supported:
  NamedNodeMap, Attr, Text, Comment, CDATASection, 
  DocumentType, Notation, Entity, EntityReference,
  ProcessingInstruction, DocumentFragment

  We underscore our DOM interface names below so that they don't collide 
  with the browser's implementations of these (for example, Firefox exposes 
  the DOMException, Node, etc. interfaces as well)
  
  FIXME: We aren't correctly throwing _DOMExceptions and _SVGExceptions 
  throughout our code where required.
*/

function _DOMException(code) {
  this.code = code;
  
  // superclass constructor
  Error(this.toString());
}

// subclass built-in browser Error object
_DOMException.prototype = new Error;

mixin(_DOMException, {
  INDEX_SIZE_ERR: 1, DOMSTRING_SIZE_ERR: 2, HIERARCHY_REQUEST_ERR: 3,
  WRONG_DOCUMENT_ERR: 4, INVALID_CHARACTER_ERR: 5, NO_DATA_ALLOWED_ERR: 6,
  NO_MODIFICATION_ALLOWED_ERR: 7, NOT_FOUND_ERR: 8, NOT_SUPPORTED_ERR: 9,
  INUSE_ATTRIBUTE_ERR: 10, INVALID_STATE_ERR: 11, SYNTAX_ERR: 12,
  INVALID_MODIFICATION_ERR: 13, NAMESPACE_ERR: 14, INVALID_ACCESS_ERR: 15
});

extend(_DOMException, {
  toString: function() {  
    // rather than having a giant switch statement here which will bloat the
    // code size, just dynamically get the property name for the given error 
    // code and turn it into a string
    for (var i in _DOMException) {
      if (i.indexOf('ERR') != -1 && _DOMException[i] === this.code) {
        return String(i);
      }
    }
    
    return 'Unknown error: ' + this.code;
  }
});


function _SVGException(code) {
  this.code = code;
  
  // superclass constructor
  Error(this.toString());
}

// subclass built-in browser Error object
_SVGException.prototype = new Error;

mixin(_SVGException, {
  SVG_WRONG_TYPE_ERR: 0, SVG_INVALID_VALUE_ERR: 1, SVG_MATRIX_NOT_INVERTABLE: 2
});

extend(_SVGException, {
  toString: function() {  
    switch(this.code) {
      case 0: return 'SVG_WRONG_TYPE_ERR';
      case 1: return 'SVG_INVALID_VALUE_ERR';
      case 2: return 'SVG_MATRIX_NOT_INVERTABLE';
      default: return 'Unknown error: ' + this.code;
    }
  }
});


function _DOMImplementation() {}

extend(_DOMImplementation, {
  hasFeature: function(feature /* String */, version /* String */) /* Boolean */ {
    // TODO
  }
  
  // Note: createDocumentType and createDocument left out
});


// Note: Only element and text section nodes are supported for now.
// We don't parse and retain comments, processing instructions, etc. CDATA
// nodes are turned into text nodes.
function _Node(nodeName, nodeType, prefix, namespaceURI, nodeXML, handler, 
               passThrough) {
  if (nodeName === undefined && nodeType === undefined) {
    // prototype subclassing
    return;
  }
  
  this.nodeName = nodeName;
  this._nodeXML = nodeXML;
  this._handler = handler;
  this._listeners = {};
  this._detachedListeners = [];
  this.fake = true;
  
  // Firefox and Safari will incorrectly turn our internal parsed XML
  // for the Flash Handler into actual SVG nodes, causing issues. This is
  // a workaround to prevent this problem.
  if (namespaceURI == svgnsFake) {
    namespaceURI = svgns;
  }
  
  // determine whether we are attached
  this._attached = true;
  if (!this._handler) {
    this._attached = false;
  }
  
  // handle nodes that were created with createElementNS but are not yet
  // attached to the document yet
  if (nodeType == _Node.ELEMENT_NODE && !this._nodeXML && !this._handler) {
    // build up an empty XML node for this element
    var xml = '<?xml version="1.0"?>\n';
    if (namespaceURI == svgns && !prefix) {
      // we use a fake namespace for SVG to prevent Firefox and Safari
      // from incorrectly making these XML nodes real SVG objects!
      xml += '<' + nodeName + ' xmlns="' + svgnsFake + '"/>';
    } else {
      xml += '<' + nodeName + ' xmlns:' + prefix + '="' + namespaceURI + '"/>';
    }
        
    this._nodeXML = parseXML(xml).documentElement;
  }
  
  // handle guid tracking
  if (nodeType != _Node.DOCUMENT_NODE && this._nodeXML) {
    if (!this._nodeXML.getAttribute('__guid')) {
      this._nodeXML.setAttribute('__guid', guid());
    }
    this._guid = this._nodeXML.getAttribute('__guid');
    
    // store a reference to the new node so that later fetching of this
    // node will respect object equality
    svgweb._guidLookup['_' + this._guid] = this;
  }
  
  if (nodeType == _Node.ELEMENT_NODE) {
    if (nodeName.indexOf(':') != -1) {
      this.localName = nodeName.match(/^[^:]*:(.*)$/)[1];
    } else {
      this.localName = nodeName;
    }
  }
  
  if (nodeType) {
    this.nodeType = nodeType;
  } else {
    this.nodeType = _Node.ELEMENT_NODE;
  }
    
  if (nodeType == _Node.ELEMENT_NODE || nodeType == _Node.DOCUMENT_NODE) {
    this.prefix = prefix;
    this.namespaceURI = namespaceURI;
    this._nodeValue = null;
  } else if (nodeType == _Node.TEXT_NODE) {
    // We store the actual text node value as a child of our 'fake' DOM
    // Element. We have to use a DOM Element so that we have access to
    // setAttribute to store a fake __guid attribute to track the text node. 
    this._nodeValue = this._nodeXML.firstChild.nodeValue;
    
    // browsers return null instead of undefined; match their behavior
    this.prefix = null;
    this.namespaceURI = null;
    if (this._nodeValue === undefined) {
      this._nodeValue = null;
    }
  }
  
  if (this._attached) {
    if (this._handler.type == 'script') {
      this.ownerDocument = document;
    } else if (this._handler.type == 'object') {
      this.ownerDocument = this._handler.document;
    }
  }
  
  if (passThrough === undefined) {
    passThrough = false;
  }
  this._passThrough = passThrough;
  
  // create empty stub methods for certain methods to help IE's HTC be
  // smaller, which has a very strong affect on performance
  if (isIE) {
    this._createEmptyMethods();
  }
  
  this._childNodes = this._createChildNodes();
    
  // we use an XML Element rather than an XML Text Node to 'track' our
  // text nodes; indicate as such using an attribute
  if (nodeType == _Node.TEXT_NODE) {
    this._nodeXML.setAttribute('__fakeTextNode', true);
  }
  
  // prepare the getter and setter magic for non-IE browsers
  if (!isIE) {
    this._defineNodeAccessors();
  } else if (isIE && this.nodeType != _Node.DOCUMENT_NODE) {
    // If we are IE, we must use a behavior in order to get onpropertychange
    // and override core DOM methods. We only do this for normal SVG elements
    // and not for the DOCUMENT element. For the SVG root element, we only
    // create our HTC node here if we are being embedded with an SVG OBJECT
    // element; SVG SCRIPT elements override the normal process here and do 
    // their embedding in the _SVGSVGElement class itself later on.
    if (this.nodeName == 'svg' && this._handler.type == 'script') {
      // do nothing; _SVGSVGElement will do the HTC node handling in this case
    } else { // everything else
      this._createHTC();
    }
  }
}

mixin(_Node, {
  ELEMENT_NODE: 1,
  TEXT_NODE: 3,
  DOCUMENT_NODE: 9
  
  // Note: many other node types left out here
});

extend(_Node, {
  /* Event listeners; this is an object hashtable that keys the event name,
     such as 'mousedown', with an array of functions to execute when this 
     event happens. This second level array is also used as an object
     hashtable to associate the function + useCapture with the listener so
     that we can implement removeListener at a later point. We only add to
     this table if the node is attached to the DOM. Example:
     
     _listeners['mousedown'] --> array of listeners
     _listeners['mousedown'][0] --> first mousedown listener, a function
     _listeners['mousedown']['_' + someListener + ':' + useCapture] --> 
                                  getting listener by function reference for
                                  mouse down event 
  */
  _listeners: null,
  
  /* An array that we use to store addEventListener requests for detached nodes, 
     where each array entry is an object literal with the following values:
     
     type - The type of the event
     listener - The function object to execute
     useCapture - Whether to use capturing or not. */
  _detachedListeners: null,
  
  insertBefore: function(newChild /* _Node */, refChild /* _Node */) {
    //console.log('insertBefore, newChild='+newChild.id+', refChild='+refChild.id);
    
    if (this.nodeType != _Node.ELEMENT_NODE) {
      throw new _DOMException(_DOMException.NOT_SUPPORTED_ERR);
    }
    
    // if the children are DOM nodes, turn them into _Node or _Element
    // references
    newChild = this._getFakeNode(newChild);
    refChild = this._getFakeNode(refChild);
    
    // add an ID entry for newChild into nodeById
    if (newChild.nodeType == _Node.ELEMENT_NODE) {
      var newChildID = newChild._getId();
      if (newChildID && this._attached) {
        this._handler.document._nodeById['_' + newChildID] = newChild;
      }
    }
    
    // get an index position for where refChild is
    var findResults = this._findChild(refChild);
    if (findResults === null) {
      // TODO: Throw the correct DOM error instead
      throw new Error('Invalid child passed to insertBefore');
    }
    var position = findResults.position;
    
    // import newChild into ourselves, insert it into our XML, and process
    // the newChild and all its descendants
    var importedNode = this._importNode(newChild, false);
    this._nodeXML.insertBefore(importedNode, refChild._nodeXML);
    this._processAppendedChildren(newChild, this, this._attached, 
                                  this._passThrough);
    
    if (!isIE) {
      // _childNodes is an object literal instead of an array
      // to support getter/setter magic for Safari
      this._defineChildNodeAccessor(this._childNodes.length);
      this._childNodes.length++;
    }
    
    // inform Flash about the change
    if (this._attached && this._passThrough) {
      var xmlString = FlashHandler._encodeFlashData(this._toXML(newChild));
      this._handler.sendToFlash({ type: 'invoke', 
                                  method: 'insertBefore',
                                  childXML: xmlString,
                                  refChildGUID: refChild._guid,
                                  parentGUID: this._guid,
                                  position: position });
    }
    
    return newChild._getProxyNode();
  },
  
  replaceChild: function(newChild /* _Node */, oldChild /* _Node */) {
    //console.log('replaceChild, newChild='+newChild.nodeName+', oldChild='+oldChild.nodeName);
    
    if (this.nodeType != _Node.ELEMENT_NODE) {
      throw new _DOMException(_DOMException.NOT_SUPPORTED_ERR);
    }
    
    // the children could be DOM nodes; turn them into something we can
    // work with, such as _Nodes or _Elements
    newChild = this._getFakeNode(newChild);
    oldChild = this._getFakeNode(oldChild);
    
    // in our XML, find the index position of where oldChild used to be
    var findResults = this._findChild(oldChild);
    if (findResults === null) {
      // TODO: Throw the correct DOM error instead
      throw new Error('Invalid child passed to replaceChild');
    }
    var position = findResults.position;
    
    // remove oldChild
    this.removeChild(oldChild);
    
    if (!isIE) {
      // _childNodes is an object literal instead of an array
      // to support getter/setter magic for Safari
      this._defineChildNodeAccessor(this._childNodes.length);
      this._childNodes.length++;
    }
    
    // import newChild into ourselves, telling importNode not to do an
    // appendChild since we will handle things ourselves manually later on
    var importedNode = this._importNode(newChild, false);

    // now bring the imported child into our XML where the oldChild used to be
    if (position >= this._nodeXML.childNodes.length) {
      // old node was at the end -- just do an appendChild
      this._nodeXML.appendChild(importedNode);
    } else {
      // old node is somewhere in the middle or beginning; jump one ahead
      // from the old position and do an insertBefore
      var placeBefore = this._nodeXML.childNodes[position];
      this._nodeXML.insertBefore(importedNode, placeBefore);
    }
    
    // now process the newChild's node
    this._processAppendedChildren(newChild, this, this._attached, 
                                  this._passThrough);
    
    // recursively set the removed node to be unattached and to not
    // pass through changes to Flash anymore
    oldChild._setUnattached();
    
    // tell Flash about the newly inserted child
    if (this._attached) {
      var xmlString = FlashHandler._encodeFlashData(this._toXML(newChild));
      this._handler.sendToFlash({ type: 'invoke', 
                                  method: 'addChildAt',
                                  childXML: xmlString,
                                  parentGUID: this._guid,
                                  position: position });
    }
    
    // track this removed node so we can clean it up on page unload
    svgweb._removedNodes.push(oldChild._getProxyNode());
    
    return oldChild._getProxyNode();
  },
  
  removeChild: function(child /* _Node or DOM Node */) {
    //console.log('removeChild, child='+child.nodeName+', this='+this.nodeName);
    if (this.nodeType != _Node.ELEMENT_NODE) {
      throw new _DOMException(_DOMException.NOT_SUPPORTED_ERR);
    }
    
    // the child could be a DOM node; turn it into something we can
    // work with, such as a _Node or _Element
    child = this._getFakeNode(child);

    // remove child from our list of XML
    var findResults = this._findChild(child);
    if (findResults === null) {
      // TODO: Throw the correct DOM error instead
      throw new Error('Invalid child passed to removeChild');
    }
    var position = findResults.position;
    
    this._nodeXML.removeChild(findResults.nodeXML);

    // remove from our nodeById lookup table
    if (child.nodeType == _Node.ELEMENT_NODE) {
      var childID = child._getId();
      if (childID && this._attached) {
        this._handler.document._nodeById['_' + childID] = undefined;
      }
    }
    
    // TODO: FIXME: Note that we don't remove the node from the GUID lookup
    // table; this is because developers might still be working with the
    // node while detached, and we want object equality to hold. This means
    // that memory will grow over time however. Find a good solution to this
    // issue without having to have the complex unattached child node structure
    // we had before.    
    //svgweb._guidLookup['_' + child._guid] = undefined;
    
    // persist event listeners if this node is later reattached
    child._persistEventListeners();
    
    // remove the getter/setter for this childNode for non-IE browsers
    if (!isIE) {
      // just remove the last getter/setter, since they all resolve
      // to a dynamic function anyway
      delete this._childNodes[this._childNodes.length - 1];
      this._childNodes.length--;
    } else {
      // for IE, remove from _childNodes data structure
      this._childNodes.splice(position, 1);
    }
    
    // inform Flash about the change
    if (this._attached && this._passThrough) {
      this._handler.sendToFlash({ type: 'invoke', 
                                  method: 'removeChild',
                                  elementGUID: child._guid,
                                  nodeType: child.nodeType });
    }
    
    // recursively set the removed node to be unattached and to not
    // pass through changes to Flash anymore
    child._setUnattached();
    
    // track this removed node so we can clean it up on page unload
    svgweb._removedNodes.push(child._getProxyNode());
    
    return child._getProxyNode();  
  },
  
  /** Appends the given child. The child can either be _Node, an
      actual DOM Node, or a Text DOM node created through 
      document.createTextNode. We return either a _Node or an HTC reference
      depending on the browser. */
  appendChild: function(child /* _Node or DOM Node */) {
    // console.log('appendChild, child='+child.nodeName+', this.nodeName='+this.nodeName);
    if (this.nodeType != _Node.ELEMENT_NODE) {
      throw new _DOMException(_DOMException.NOT_SUPPORTED_ERR);
    }
    
    // the child could be a DOM node; turn it into something we can
    // work with, such as a _Node or _Element
    child = this._getFakeNode(child);
    
    // add the child's XML to our own
    this._importNode(child);
    
    if (isIE) {
      // _childNodes is a realy array on IE rather than an object literal
      // like other browsers
      this._childNodes.push(child._htcNode);
    } else {
      // _childNodes is an object literal instead of an array
      // to support getter/setter magic for Safari
      this._defineChildNodeAccessor(this._childNodes.length);
      this._childNodes.length++;
    }
  
    // process the children (add IDs, add a handler, etc.)
    this._processAppendedChildren(child, this, this._attached, 
                                  this._passThrough);
    
    return child._getProxyNode();
  },
  
  hasChildNodes: function() /* Boolean */ {
    return (this._getChildNodes().length > 0);
  },
  
  // Note: cloneNode and normalize not supported
  
  isSupported: function(feature /* String */, version /* String */) {
    if (version == '2.0') {
      if (feature == 'Core') {
        // FIXME: There are a number of things we don't yet support in Core,
        // but we support the bulk of it
        return true;
      } else if (feature == 'Events' || feature == 'UIEvents'
                 || feature == 'MouseEvents') {
        // FIXME: We plan on supporting most of these interfaces, but not
        // all of them
        return true;
      }
    } else {
      return false;
    }
  },
  
  hasAttributes: function() /* Boolean */ {
    if (this.nodeType == _Node.ELEMENT_NODE) {
      for (var i in this._attributes) {
        // if this is an XMLNS declaration, don't consider it a valid
        // attribute for hasAttributes
        if (/^_xmlns/i.test(i)) {
          continue;
        }
        
        // if there is an ID attribute, but it's one of our randomly generated
        // ones, then don't consider this a valid attribute for hasAttributes
        if (i == '_id' && /^__svg__random__/.test(this._attributes[i])) {
          continue;
        }
        
        // ignore our internal __guid and __fakeTextNode attributes;
        // note that we have an extra _ before our attribute name when we
        // store it internally, so __guid becomes ___guid
        if (i == '___guid' && /^__guid/.test(this._attributes[i])) {
          continue;
        }
        if (i == '___fakeTextNode' 
            && /^__fakeTextNode/.test(this._attributes[i])) {
          continue;
        }
        
        // our attributes start with an underscore
        if (/^_.*/.test(i) && this._attributes.hasOwnProperty(i)) {
          return true;
        }
      }
      
      return false;
    } else {
      return false;
    }
  },
  
  /*
    DOM Level 2 EventTarget interface methods.
  
    Note: dispatchEvent not supported. Technically as well this interface
    should not appear on SVG elements that don't have any event dispatching,
    such as the SVG DESC element, but in our implementation they still appear.
    We also don't support the useCapture feature for addEventListener and
    removeEventListener.
  */
  
  /* @param _adding Internal boolean flag used when we are adding this node
     to a real DOM, so that we can replay and send our addEventListener 
     request over to Flash. */
  addEventListener: function(type, listener /* Function */, useCapture, 
                             _adding /* Internal -- Boolean */) {
    //console.log('addEventListener, type='+type+', listener='+listener+', useCapture='+useCapture+', _adding='+_adding);
    // Note: capturing not supported
    
    if (!_adding && !this._attached) {
      // add to a list of event listeners that will get truly registered when
      // we get attached in _Node._processAppendedChildren()
      this._detachedListeners.push({ type: type, listener: listener, 
                                     useCapture: useCapture });
      return;
    }
    
    // add to our list of event listeners
    if (this._listeners[type] === undefined) {
      this._listeners[type] = [];
    }
    this._listeners[type].push({ type: type, listener: listener, 
                                 useCapture: useCapture });
    this._listeners[type]['_' + listener.toString() + ':' + useCapture] = listener;
                                        
    if (type == 'keydown') {
      // TODO: Be able to handle key events on individual SVG graphics 
      // (g, rect, etc.) that might have focus
      // TODO: FIXME: do we want to be adding this listener to 'document'
      // when dealing with SVG OBJECTs?
      
      // prevent closure by using an inline method
      var wrappedListener = (function(listener) {
                                return function(evt) {
                                  // shim in preventDefault function for IE
                                  if (!evt.preventDefault) {
                                    evt.preventDefault = function() {
                                      this.returnValue = false;
                                      evt = null;
                                    }
                                  }
                                  // call the developer's listener now
                                  listener(evt);
                                }
                              })(listener);
      // save keyboard listeners for later so we can clean them up
      // later if the parent SVG document is removed from the DOM
      this._handler._keyboardListeners.push(wrappedListener);
      
      // now actually subscribe to the event
      this._addEvent(document, type, wrappedListener);
      return;
    }

    this._handler.sendToFlash({ type: 'invoke', 
                                method: 'addEventListener',
                                elementGUID: this._guid,
                                eventType: type });
  },
  
  removeEventListener: function(type, listener /* Function */, useCapture) {
    // Note: capturing not supported
    // TODO: Implement
  },
  
  toString: function() {
    if (this.namespaceURI == svgns) {
      return '[_SVG' + this.localName.charAt(0).toUpperCase()
             + this.localName.substring(1) + ']';
    } else if (this.prefix) {
      return '[' + this.prefix + ':' + this.localName + ']';
    } else {
      return '[' + this.localName + ']';
    }
  },
  
  /** Adds an event cross platform. 
  
      @param obj Obj to add event to.
      @param type String type of event.
      @param fn Function to execute when event happens. */
  _addEvent: function(obj, type, fn) {
    if (obj.addEventListener) {
      obj.addEventListener(type, fn, false);
    }
    else if (obj.attachEvent) { // IE
      obj['e'+type+fn] = fn;
      // do a trick to prevent closure over ourselves, which can lead to
      // IE memory leaks
      obj[type+fn] = (function(obj, type, fn) { 
        return function(){ obj['e'+type+fn](window.event) }; 
      })(obj, type, fn);
      obj.attachEvent('on'+type, obj[type+fn]);
    }
  },
  
  // NOTE: technically the following attributes should be read-only, 
  // raising _DOMExceptions if set, but for simplicity we make them 
  // simple JS properties instead. If set nothing will happen.
  nodeName: null,
  nodeType: null,
  ownerDocument: null, /* Document or _Document depending on context. */
  namespaceURI: null,
  localName: null,
  prefix: null, /* Note: in the DOM 2 spec this is settable but not for us */
  
  // getter/setter attribute methods
  
  // nodeValue defined as getter/setter
  // textContent and data defined as getters/setters for TEXT_NODES
  // childNodes defined as getter/setter
  
  _getParentNode: function() {
    if (this.nodeType == _Node.DOCUMENT_NODE) {
      return null;
    }
    
    // are we the root SVG node when being embedded by an SVG SCRIPT?
    if (this.nodeName == 'svg' && this._handler.type == 'script') {
      if (this._htcNode) { // IE
        // we stored the realParentNode in the _SVGSVGElement constructor
        // when we created the SVG root
        return this._htcNode._realParentNode;
      } else { // other browsers
        return this._handler.flash;
      }
    } else if (this.nodeName == 'svg' && this._handler.type == 'object') {
      // if we are the root SVG node and are embedded by an SVG OBJECT, then
      // our parent is a #document object
      return this._handler.document;
    }
    
    var parentXML = this._nodeXML.parentNode;
    // unattached nodes might have an XML document as their parentNode
    if (parentXML === null || parentXML.nodeType == _Node.DOCUMENT_NODE) {
      return null;
    }
    
    var node = FlashHandler._getNode(parentXML, this._handler);
    
    return node;
  },
  
  _getFirstChild: function() {
    if (this.nodeType == _Node.TEXT_NODE) {
      return null;
    }
    
    var childXML = this._nodeXML.firstChild;
    if (childXML === null) {
      return null;
    }
    
    var node = FlashHandler._getNode(childXML, this._handler);
    this._getFakeNode(node)._passThrough = this._passThrough;
        
    return node;
  },
  
  _getLastChild: function() {
    if (this.nodeType == _Node.TEXT_NODE) {
      return null;
    }
    
    var childXML = this._nodeXML.lastChild;
    if (childXML === null) {
      return null;
    }
    
    var node = FlashHandler._getNode(childXML, this._handler);
    this._getFakeNode(node)._passThrough = this._passThrough;
    
    return node;
  },
  
  _getPreviousSibling: function() {
    if (this.nodeType == _Node.DOCUMENT_NODE) {
      return null;
    }
    
    // are we the root SVG object when being embedded by an SVG SCRIPT?
    if (this.nodeName == 'svg' && this._handler.type == 'script') {
      if (this._htcNode) { // IE
        // we stored the realPreviousSibling in the _SVGSVGElement constructor
        // when we created the SVG root, otherwise this._htcNode.previousSibling
        // will recursively call ourselves infinitely!
        return this._htcNode._realPreviousSibling;
      } else { // other browsers
        return this._handler.flash.previousSibling;
      }
    }
    
    var siblingXML = this._nodeXML.previousSibling;
    // unattached nodes will sometimes have an XML Processing Instruction
    // as their previous node (type=7)
    if (siblingXML === null || siblingXML.nodeType == 7) {
      return null;
    }
    
    var node = FlashHandler._getNode(siblingXML, this._handler);
    this._getFakeNode(node)._passThrough = this._passThrough;
    
    return node;
  },
  
  _getNextSibling: function() {
    if (this.nodeType == _Node.DOCUMENT_NODE) {
      return null;
    }
      
    // are we the root SVG object when being embedded by an SVG SCRIPT?
    if (this.nodeName == 'svg' && this._handler.type == 'script') {
      if (this._htcNode) { // IE
        // we stored the realNextSibling in the _SVGSVGElement constructor
        // when we created the SVG root, otherwise this._htcNode.nextSibling
        // will recursively call ourselves infinitely!
        return this._htcNode._realNextSibling;
      } else { // other browsers
        return this._handler.flash.nextSibling;
      }
    }
    
    var siblingXML = this._nodeXML.nextSibling;
    if (siblingXML === null) {
      return null;
    }
    
    var node = FlashHandler._getNode(siblingXML, this._handler);
    this._getFakeNode(node)._passThrough = this._passThrough;

    return node;
  },
  
  // Note: 'attributes' property not supported since we don't support
  // Attribute DOM Node types
  
  // TODO: It would be nice to support the ElementTraversal spec here as well
  // since it cuts down on code size:
  // http://www.w3.org/TR/ElementTraversal/
  
  /** The passthrough flag controls whether we 'pass through' any changes
      to this object to the underlying Flash viewer. For example, if a
      Node has been created but is not yet attached to the document, any 
      changes to its attributes should not pass through to the Flash viewer,
      and this flag would therefore be false. After the Node is attached
      through appendChild(), passThrough would become true and everything
      would get passed through to Flash for rendering. */
  _passThrough: false,
  
  /** The attached flag indicates whether this node is attached to a live
      DOM yet. For example, if you call createElementNS, you can set
      values on this node before actually appending it using appendChild
      to a node that is connected to the actual visible DOM, ready to
      be rendered. */
  _attached: true,
  
  /** A flag we put on our _Nodes and _Elements to indicate they are fake;
      useful if someone wants to 'break' the abstraction and see if a node
      is a real DOM node or not (which won't have this flag). */
  _fake: true,
  
  /** Do the getter/setter magic for our attributes for non-IE browsers. */
  _defineNodeAccessors: function() {
    // readonly properties
    this.__defineGetter__('parentNode', hitch(this, this._getParentNode));
    this.__defineGetter__('firstChild', hitch(this, this._getFirstChild));
    this.__defineGetter__('lastChild', hitch(this, this._getLastChild));
    this.__defineGetter__('previousSibling', 
                          hitch(this, this._getPreviousSibling));
    this.__defineGetter__('nextSibling', hitch(this, this._getNextSibling));
    
    // childNodes array -- define and execute an inline function so that we 
    // only get closure over the 'self' variable rather than all the 
    // __defineGetter__ calls above. Note that we are forced to have our
    // childNodes variable be an object literal rather than array, since this
    // is the only way we can do getter/setter magic on each indexed position
    // for Safari.
    this.__defineGetter__('childNodes', (function(self) {
      return function() { return self._childNodes; };
    })(this));
    
    // We represent Text nodes internally using XML Element nodes in order
    // to support tracking; just set our child nodes to be zero to simulate
    // Text nodes having no children
    if (this.nodeName == '#text') {
      this._childNodes.length = 0;
    } else {    
      var children = this._nodeXML.childNodes;
      this._childNodes.length = children.length; 
      for (var i = 0; i < children.length; i++) {
        // do the defineGetter in a different method so the closure gets
        // formed correctly (closures can be tricky in loops if you are not
        // careful); we also need the defineChildNodeAccessor method anyway
        // since we need the ability to individually define new accessors
        // at a later point (such as in insertBefore(), for example).
        this._defineChildNodeAccessor(i);
      }
    }
    
    // read/write properties
    if (this.nodeType == _Node.TEXT_NODE) {
      this.__defineGetter__('data', (function(self) { 
        return function() { return self._nodeValue; };
      })(this));
      this.__defineSetter__('data', (function(self) {
        return function(newValue) { return self._setNodeValue(newValue); };
      })(this));
      
      this.__defineGetter__('textContent', (function(self) {
        return function() { return self._nodeValue; }; 
      })(this));
      this.__defineSetter__('textContent', (function(self) {
        return function(newValue) { return self._setNodeValue(newValue); };
      })(this));
    } else { // ELEMENT and DOCUMENT nodes
      // Firefox and Safari return '' for textContent for non-text nodes;
      // mimic this behavior
      this.__defineGetter__('textContent', (function() {
        return function() { return ''; };
      })());
    }
    
    this.__defineGetter__('nodeValue', (function(self) {
      return function() { return self._nodeValue; };
    })(this));
    this.__defineSetter__('nodeValue', (function(self) {
      return function(newValue) { return self._setNodeValue(newValue); };
    })(this));
  },
  
  /** Creates a getter/setter for a childNode at the given index position.
      We define each one in a separate function so that we don't pull
      the wrong things into our closure. See _defineNodeAccessors() for
      details. */
  _defineChildNodeAccessor: function(i) {
    var self = this;
    
    this._childNodes.__defineGetter__(i, function() {
      var childXML = self._nodeXML.childNodes[i];
      var node = FlashHandler._getNode(childXML, self._handler);
      node._passThrough = self._passThrough;
      return node;
    });
  },
  
  /** For IE we have to do some tricks that are a bit different than
      the other browsers; we can't know when a particular
      indexed member is called, such as childNodes[1], so instead we
      return the entire _childNodes array; what is nice is that IE applies
      the indexed lookup _after_ we've returned things, so this works. This
      requires us to instantiate all the children, however, when childNodes
      is called. This method is called by the HTC file. 
      
      @returns An array of either the HTC proxies for our nodes if IE,
      or an array of _Element and _Nodes for other browsers. */
  _getChildNodes: function() {
    if (!isIE) {
      return this._childNodes;
    }
    
    // NOTE: for IE we return a real full Array, while for other browsers
    // our _childNodes array is an object literal in order to do
    // our __defineGetter__ magic in _defineNodeAccessors. It turns out
    // that on IE a full array can be returned from the getter, and _then_
    // the index can get applied (i.e. our array is returned, and then 
    // [2] might get applied to that array).
    var results = createNodeList();
    
    // We represent our text nodes using an XML Element node instead of an
    // XML Text node in order to do tracking; we store our actual text value
    // as a further XML Text node child. Don't return this though.
    if (this.nodeName == '#text') {
      return results;
    }
    
    if (this._nodeXML.childNodes.length == this._childNodes.length) {
      // we've already processed our childNodes before
      return this._childNodes;
    } else {
      for (var i = 0; i < this._nodeXML.childNodes.length; i++) {
        var childXML = this._nodeXML.childNodes[i];
        var node = FlashHandler._getNode(childXML, this._handler);
        node._fakeNode._passThrough = this._passThrough;
        results.push(node);
      }
      
      this._childNodes = results;
      return results;
    }
  },
  
  // if we are IE, we must use a behavior in order to get onpropertychange
  // and override core DOM methods
  _createHTC: function() {
    // we store our HTC nodes into a hidden container located in the
    // HEAD of the document; either get it now or create one on demand
    if (!this._htcContainer) {
      this._htcContainer = document.getElementById('__htc_container');
      if (!this._htcContainer) {
        // strangely, onpropertychange does _not_ fire for HTC elements
        // that are in the HEAD of the document, which is where we used
        // to put the htc_container. Instead, we have to put it into the BODY
        // of the document and position it offscreen.
        var body = document.getElementsByTagName('body')[0];
        var c = document.createElement('div');
        c.id = '__htc_container';
        // NOTE: style.display = 'none' does not work
        c.style.position = 'absolute';
        c.style.top = '-5000px';
        c.style.left = '-5000px';
        body.appendChild(c);
        this._htcContainer = c;
      }
    }
    
    // now store our HTC UI node into this container; we will intercept
    // all calls through the HTC, and implement all the real behavior
    // inside ourselves (inside _Element)
    // Note: we do svg: even if we are dealing with a non-SVG node on IE,
    // such as sodipodi:namedview; this is necessary so that our svg.htc
    // file gets invoked for all these nodes, which is bound to the 
    // svg: namespace
    var htcNode = document.createElement('svg:' + this.nodeName);
    htcNode._fakeNode = this;
    htcNode._handler = this._handler;
    this._htcContainer.appendChild(htcNode);
    this._htcNode = htcNode;
  },
  
  _setNodeValue: function(newValue) {
    //console.log('setNodeValue, newValue='+newValue);
    if (this.nodeType != _Node.TEXT_NODE) {
      // FIXME: Is this correct? Can other kinds of nodes other than
      // text nodes have a nodeValue?
      return newValue;
    }
    
    this._nodeValue = newValue;
    
    // we store the real text value as a child of our fake text node,
    // which is actually a DOM Element so that we can do tracking
    this._nodeXML.firstChild.nodeValue = newValue;
    
    if (this._attached && this._passThrough) {
      var flashStr = FlashHandler._encodeFlashData(newValue);
      var parentGUID = this._nodeXML.parentNode.getAttribute('__guid');
      this._handler.sendToFlash({ type: 'invoke', 
                                  method: 'setText',
                                  parentGUID: parentGUID,
                                  elementGUID: this._guid,
                                  text: flashStr });
    }

    return newValue;
  },
  
  /** For functions like appendChild, insertBefore, removeChild, etc.
      outside callers can pass in DOM nodes, etc. This function turns
      this into something we can work with, such as a _Node or _Element. */
  _getFakeNode: function(child) {
    // Was an HTC node passed in for IE? If so, get its _Node
    if (isIE && child._fakeNode) {
      child = child._fakeNode;
    }
    
    return child;
  },
  
  /** We do a bunch of work in this method in order to append a child to
      ourselves, including: Walking over the child and all of it's children; 
      setting it's handler; setting that it is both attached and
      can pass through it's values; informing Flash about the newly
      created element; and updating our list of namespaces if there is a node
      with a new namespace in the appended children. This method gets called 
      recursively for the child and all of it's children.
      
      @param child _Node to work with.
      @param parent The parent of this child.
      @param attached Boolean on whether we are attached or not yet.
      @param passThrough Boolean on whether to pass values through
      to Flash or not. */
  _processAppendedChildren: function(child, parent, attached, passThrough) {
    //console.log('processAppendedChildren, this.nodeName='+this.nodeName+', child.nodeName='+child.nodeName+', attached='+attached+', passThrough='+passThrough);
    start('processAppendedChildren', 'board');
    
    // serialize this node and all its children into an XML string and
    // send that over to Flash
    if (attached) {
      start('sending appendChild flash', 'board');
      var xmlString = FlashHandler._encodeFlashData(this._toXML(child));
      this._handler.sendToFlash({ type: 'invoke', 
                                  method: 'appendChild',
                                  parentGUID: parent._guid, 
                                  childXML: xmlString });
      end('sending appendChild flash', 'board');
    }

    // walk the DOM from the child using an iterative algorithm, which was 
    // found to be faster than a recursive one; for each node visited we will
    // store some important reference information
    start('total walk', 'board');
    var current = child;
    while (current) {
      // visit this node
      var currentXML = current._nodeXML;

      // set its handler
      current._handler = this._handler;
      
      // store a reference to our node so we can return it in the future
      var id = currentXML.getAttribute('id');
      if (attached && current.nodeType == _Node.ELEMENT_NODE && id) {
        this._handler.document._nodeById['_' + id] = current;
      }
      
      // set the ownerDocument based on how we were embedded
      if (attached) {
        if (this._handler.type == 'script') {
          current.ownerDocument = document;
        } else if (this._handler.type == 'object') {
          current.ownerDocument = this._handler.document;
        }
      }
    
      if (attached) {
        // register and send over any event listeners that were added while
        // this node was detached
        for (var i = 0; i < current._detachedListeners.length; i++) {
          var addMe = current._detachedListeners[i];
          current.addEventListener(addMe.type, addMe.listener, 
                                   addMe.useCapture, true);
        }
        current._detachedListeners = [];
      }
          
      // now continue visiting other nodes
      var lastVisited = current;
      var children = current._getChildNodes();
      var next = (children && children.length > 0) ? children[0] : null;
      if (next) {
        current = next;
        if (isIE) {
          current = current._fakeNode;
        }
      }
      
      while (!next && current) {
        if (current != child) {
          next = current._getNextSibling();
          if (next) {
            current = next;
            if (isIE) {
              current = current._fakeNode;
            }
            break;
          }
        }

        if (current == child) {
          current = null;
        } else {
          current = current._getParentNode();
          if (current && isIE) {
            current = current._fakeNode;
          }

          if (current && 
                  (current.nodeType != 1 || 
                   current.nodeName.toUpperCase() == 'SVG')) {
            current = null;
          }
        }
      }
      
      // set our attached information
      lastVisited._attached = attached;
      lastVisited._passThrough = passThrough;
    }
    end('total walk', 'board');

    end('processAppendedChildren', 'board');
  },
  
  /** Transforms the given node and all of its children into an XML string,
      suitable for us to send over to Flash for adding to the document. 
      
      @param node The _Element or _Node to transform into XML. 
      
      @returns XML String suitable for sending to Flash. */
  _toXML: function(node) {
    var nodeXML = node._nodeXML;
    var xml;
    
    if (typeof XMLSerializer != 'undefined') { // non-IE browsers
      xml = (new XMLSerializer().serializeToString(nodeXML));
    } else {
      xml = nodeXML.xml;
    }
    
    // Firefox and Safari will incorrectly turn our internal parsed XML
    // for the Flash Handler into actual SVG nodes, causing issues. We added
    // a fake SVG namespace earlier to prevent this from happening; remove that
    // now
    xml = xml.replace(/urn\:__fake__internal__namespace/g, svgns);
    
    // add our namespace declarations; having repeats is ok if some are
    // already there
    var nsString = 'xmlns="' + svgns + '" ';
    for (var i = 0; i < this._handler.document._namespaces.length; i++) {
      var uri = this._handler.document._namespaces[i];
      var prefix = this._handler.document._namespaces['_' + uri];
      
      // ignore our fake SVG namespace string
      if (uri == svgnsFake) {
        uri = svgns;
      }
      
      if (prefix != 'xmlns') {
        nsString += 'xmlns:' + prefix + '="' + uri + '" ';
      } else {
        nsString += 'xmlns' + '="' + uri + '" ';
      }
    }

    xml = xml.replace(/<([^ ]+)/, '<$1 ' + nsString + ' ');
    
    return xml;
  },
  
  /** Imports the given child and all it's children's XML into our XML. 
  
      @param child _Node to import.
      @param doAppend Optional. Boolean on whether to actually append
      the child once it is imported. Useful for functions such as
      replaceChild that want to do this manually. Defaults to true if not
      specified.
      
      @returns The imported node. */
  _importNode: function(child, doAppend) {
    //console.log('importNode, child='+child.nodeName+', doAppend='+doAppend);
    if (typeof doAppend == 'undefined') {
      doAppend = true;
    }
    
    // try to import the node into our _Document's XML object
    var doc;
    if (this._attached) {
      doc = this._handler.document._xml;
    } else {
      doc = this._nodeXML.ownerDocument;
    }

    // IE does not support document.importNode, even on XML documents, 
    // so we have to define it ourselves.
    // Adapted from ALA article:
    // http://www.alistapart.com/articles/crossbrowserscripting
    var importedNode;
    if (typeof doc.importNode == 'undefined') {
      // import the node for IE
      importedNode = document._importNodeFunc(doc, child._nodeXML, true);
    } else { // non-IE browsers
      importedNode = doc.importNode(child._nodeXML, true);
    }

    // complete the import into ourselves
    if (doAppend) {
      this._nodeXML.appendChild(importedNode);
    }
    
    // replace all of the children's XML with our copy of it now that it 
    // is imported
    child._importChildXML(importedNode);

    return importedNode;
  },
  
  /** Recursively replaces the XML inside of our children with the given
      new XML to ensure that each node's reference to it's own internal
      _nodeXML pointer all points to the same tree, but in different
      locations. Called after we are importing a node into ourselves with 
      appendChild. */
  _importChildXML: function(newXML) {
    this._nodeXML = newXML;
    var children = this._getChildNodes();
    for (var i = 0; i < children.length; i++) {
      var currentChild = children[i];
      if (isIE && currentChild._fakeNode) { // IE
        currentChild = currentChild._fakeNode;
      } 
      
      currentChild._nodeXML = this._nodeXML.childNodes[i];
      currentChild._importChildXML(this._nodeXML.childNodes[i]);
    }
  },
  
  /** Tries to find the given child in our list of child nodes.
      
      @param child A _Node or _Element to search for in our list of
      childNodes. 
      @param ignoreTextNodes Optional, defaults to false. If true, then we
      ignore any text nodes when looking for the child, as if all we have
      are element nodes.
      
      @returns Null if nothing found, otherwise an object literal with 2 values:
         position The index position of where the child is located.
         nodeXML The found XML node.
         
      If the child is not found then null is returned instead. */
  _findChild: function(child, ignoreTextNodes) {
    //console.log('findChild, child='+child.nodeName);
    if (ignoreTextNodes === undefined) {
      ignoreTextNodes = false;
    }
    
    var results = {};

    var elementIndex = 0;
    for (var i = 0; i < this._nodeXML.childNodes.length; i++) {
      var currentXML = this._nodeXML.childNodes[i];
      if (currentXML.nodeType != _Node.ELEMENT_NODE 
          && currentXML.nodeType != _Node.TEXT_NODE) {
        // FIXME: What about CDATA nodes?
        // FIXME: If there are other kinds of nodes, how does this impact
        // our elementIndex variable?
        continue;
      }
      
      // skip text nodes?
      if (ignoreTextNodes
                    && (currentXML.getAttribute('__fakeTextNode')
                        || currentXML.nodeType == _Node.TEXT_NODE)) {
        continue;
      }

      if (currentXML.nodeType == _Node.ELEMENT_NODE) {
        elementIndex++;
      }
            
      if (currentXML.nodeType == _Node.ELEMENT_NODE
          && currentXML.getAttribute('__guid') == child._guid) {
        results.position = (ignoreTextNodes) ? elementIndex : i;
        results.nodeXML = currentXML;
        return results;
      }
    }
    
    return null;
  },
  
  /** After a node is unattached, such as through a removeChild, this method
      recursively sets _attached and _passThrough to false on this node
      and all of its children.  */
  _setUnattached: function() {   
    // set each child to be unattached
    var children = this._getChildNodes();
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (isIE) {
        child = child._fakeNode;
      }
      child._setUnattached();
    }
    this._attached = false;
    this._passThrough = false;
    this._handler = null;
  },
  
  /** When we return results to external callers, such as appendChild,
      we can return one of our fake _Node or _Elements. However, for IE,
      we have to return the HTC 'proxy' through which callers manipulate
      things. The HTC is what allows us to override core DOM methods and
      know when property and style changes have happened, for example. */
  _getProxyNode: function() {
    if (!isIE) {
      return this;
    } else {
      // for IE, the developer will manipulate things through the UI/HTC
      // proxy facade so that we can know about property changes, etc.
      return this._htcNode;
    }
  },
  
  /** Creates our childNodes data structure in a different way for different
      browsers. We have this in a separate method so that we avoid forming
      a closure of elements that could lead to a memory leak in IE. */
  _createChildNodes: function() {
    var childNodes;
    
    if (!isIE) {
      // NOTE: we make _childNodes an object literal instead of an Array; if
      // it is an array we can't do __defineGetter__ on each index position on
      // Safari
      childNodes = {};
      
      // add the item() method from NodeList to our childNodes instance
      childNodes.item = function(index) {
        if (index >= this.length) {
          return null; // DOM Level 2 spec says return null
        } else {
          return this[index];
        }
      };
    } else { // IE
      childNodes = createNodeList();
    }
    
    return childNodes;
  },
  
  // the following getters and setters for textContent and data are called
  // by the HTC; we put them here to minimize the size of the HTC which
  // has a very strong correlation with performance
  
  _getTextContent: function() {
    if (this.nodeType == _Node.TEXT_NODE) {
      return this._nodeValue;
    } else {
      return ''; // Firefox and Safari return empty strings for .textContent
    }
  },
  
  _setTextContent: function(newValue) {
    if (this.nodeType == _Node.TEXT_NODE) { 
      return this._setNodeValue(newValue);
    } else {
      return ''; // Firefox and Safari return empty strings for .textContent
    }
  },
  
  _getData: function() {
    if (this.nodeType == _Node.TEXT_NODE) {
      return this._nodeValue;
    } else {
      return undefined;
    }
  },
  
  _setData: function(newValue) {
    if (this.nodeType == _Node.TEXT_NODE) {
      return this._setNodeValue(newValue);
    } else {
      return undefined;
    }
  },
  
  /** For Internet Explorer, the length of the script in our HTC is a major
      determinant in the amount of time it takes to create a new HTC element.
      In order to minimize the size of this code, we have many 'no-op'
      implementations of some methods so that we can just safely call
      them from the HTC without checking the type of the node. */
  _createEmptyMethods: function() {
    if (this.nodeType == _Node.TEXT_NODE) {
      this.getAttribute 
          = this.setAttribute 
          = this.setAttributeNS
          = this._getId
          = this._setId
          = this._getX
          = this._getY
          = this._getWidth
          = this._getHeight
          = function() { return undefined; };
    }
  },
  
  /** When a node is removed from the DOM, we make sure that all of its 
      event listener information (and all of the event info for its children)
      is persisted if it is later reattached to the DOM. */
  _persistEventListeners: function() {
    // persist all the listeners for ourselves
    for (var eventType in this._listeners) {
      for (var i = 0; i < this._listeners[eventType].length; i++) {
        var l = this._listeners[eventType][i];
        this._detachedListeners.push({ type: l.type, 
                                       listener: l.listener, 
                                       useCapture: l.useCapture });
      }
    }
    this._listeners = [];
    
    // visit each of our children
    var children = this._getChildNodes();
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (c._fakeNode) { // IE
        c = c._fakeNode;
      }
      c._persistEventListeners();
    }
  }
});


/** Our DOM Element for each SVG node.

    @param nodeName The node name, such as 'rect' or 'sodipodi:namedview'.
    @param prefix The namespace prefix, such as 'svg' or 'sodipodi'.
    @param namespaceURI The namespace URI. If undefined, defaults to null.
    @param nodeXML The parsed XML DOM node for this element.
    @param handler The FlashHandler rendering this node. 
    @param passThrough Optional boolean on whether any changes to this
    element 'pass through' and cause changes in the Flash renderer. */                 
function _Element(nodeName, prefix, namespaceURI, nodeXML, handler, 
                  passThrough) {
  if (nodeName === undefined && namespaceURI === undefined 
      && nodeXML === undefined && handler === undefined) {
    // prototype subclassing
    return;
  }
  
  // superclass constructor
  _Node.apply(this, [nodeName, _Node.ELEMENT_NODE, prefix, namespaceURI, 
                     nodeXML, handler, passThrough]);
                     
  // setup our attributes
  this._attributes = {};
  this._attributes['_id'] = ''; // default id is empty string on FF and Safari
  this._importAttributes(this, this._nodeXML);
  
  // define our accessors if we are not IE; IE does this by using the HTC
  // file rather than doing it here
  if (!isIE) {
    this._defineAccessors();
  }
  
  if (this.namespaceURI == svgns) {
    // track .style changes; 
    if (isIE 
        && this._attached 
        && this._handler.type == 'script' 
        && this.nodeName == 'svg') {
      // do nothing now -- if we are IE and are being embedded with an
      // SVG SCRIPT tag, don't setup the style object for the SVG root now; we
      // do that later in _SVGSVGElement
    } else {
      this.style = new _Style(this);
    }
    
    // handle style changes for HTCs
    if (isIE 
        && this._attached
        && this._handler.type == 'script' 
        && this.nodeName == 'svg') {
      // do nothing now - if we are IE we delay creating the style property
      // until later in _SVGSVGElement
    } else if (isIE) {
      this.style._ignoreStyleChanges = false;
    }
  }
}

// subclasses _Node
_Element.prototype = new _Node;

extend(_Element, {
  getAttribute: function(attrName) /* String */ {
    //console.log('getAttribute, attrName='+attrName+', this.nodeName='+this.nodeName);

    var value;
    
    // ignore internal __guid property
    if (attrName == '__guid') {
      return null;
    }
    
    if (this._attached && this._passThrough) {
      var msg = this._handler.sendToFlash({ type: 'invoke', 
                                            method: 'getAttribute',
                                            elementGUID: this._guid, 
                                            attrName: attrName });
      if (msg) {
        value = msg.attrValue;
      }
    } else {
      value = this._nodeXML.getAttribute(attrName);

      // id property is special; we return empty string instead of null
      // to mimic native behavior on Firefox and Safari
      if (attrName == 'id' && !value) {
        return '';
      }
    }
    
    if (value === undefined || value === null || /^[ ]*$/.test(value)) {
      return null;
    }
    
    return value;
  },
  
  setAttribute: function(attrName, attrValue /* String */) /* void */ {
    //console.log('setAttribute, attrName='+attrName+', attrValue='+attrValue);
    this.setAttributeNS(null, attrName, attrValue);
  },
  
  removeAttribute: function(name) /* void */ {
    /* throws _DOMException */
    // TODO: Implement
  },

  getAttributeNS: function(ns, localName) /* String */ {
    // TODO: Implement
  },

  setAttributeNS: function(ns, qName, attrValue /* String */) /* void */ {
    //console.log('setAttributeNS, ns='+ns+', qName='+qName+', attrValue='+attrValue+', this.nodeName='+this.nodeName);
    // TODO: Confirm that calling setAttributeNS with arbitrary namespaces
    // works
    
    var elementId = this._nodeXML.getAttribute('id');
    
    // parse out local name of attribute
    var localName = qName;
    if (qName.indexOf(':') != -1) {
      localName = qName.split(':')[1];
    }

    // if id then change node lookup table (only if we are attached to
    // the DOM however)
    if (this._attached && qName == 'id') {
      var doc = this._handler.document;

      // old lookup
      doc._nodeById['_' + elementId] = undefined;
      // new lookup
      doc._nodeById['_' + attrValue] = this;
    }
    
    /* Safari has a wild bug; If you have an element inside of a clipPath with
       a style string:
    
       <clipPath id="clipPath11119">
          <rect width="36.416" height="36.416" ry="0" x="247" y="-157"
                style="opacity:1;fill:#6b6b6b;"
                id="rect11121" />
        </clipPath>
        
       Then calling setAttribute('style', '') on our nodeXML causes the
       browser to crash! The workaround is to temporarily remove nodes
       that have a clipPath parent, set their style, then
       reattach them (!) */
    if (isSafari
        && localName == 'style'
        && this._nodeXML.parentNode !== null 
        && this._nodeXML.parentNode.nodeName == 'clipPath') {
      // save our XML position information for later re-inserting
      var addBeforeXML = this._nodeXML.nextSibling;
      var origParent = this._nodeXML.parentNode;
      // remove the node and set style; doing this prevents crash when 
      // setting style string      
      this._nodeXML.parentNode.removeChild(this._nodeXML);
      this._nodeXML.setAttribute('style', attrValue);
      // re-attach ourselves before our old sibling
      if (addBeforeXML) {
        origParent.insertBefore(this._nodeXML, addBeforeXML);
      } else { // node was at end originally
        origParent.appendChild(this._nodeXML);
      }
    } else { // we are an attrname other than style, or on a non-Safari browser
      // update our XML; we store the full qname (i.e. xlink:href) since
      // IE has no native setAttributeNS support
      this._nodeXML.setAttribute(qName, attrValue);
    }

    // update our internal set of attributes
    this._attributes['_' + qName] = attrValue;

    // send to Flash
    if (this._attached && this._passThrough) {
      this._handler.sendToFlash(
                       { type: 'invoke', 
                         method: 'setAttribute',
                         elementGUID: this._guid,
                         attrNamespace: ns,
                         attrName: localName, 
                         attrValue: FlashHandler._encodeFlashData(attrValue) });
    }
  },
  
  removeAttributeNS: function(ns, localName) /* void */ {
      /* throws _DOMException */
    // TODO: Implement
  },
  
  getElementsByTagNameNS: function(ns, localName) /* _NodeList */ {
    // TODO: Implement
  },

  hasAttributeNS: function(ns, localName) /* Boolean */ {
    // TODO: Implement
  }, 

  /*
    Note: DOM Level 2 getAttributeNode, setAttributeNode, removeAttributeNode,
    getElementsByTagName, getAttributeNodeNS, setAttributeNodeNS not supported
  */
  
  // SVGStylable interface
  style: null, /** Note: technically should be read only; _Style instance */
  
  _setClassName: function(className) {
    // TODO: Implement
  },
  
  // Note: we return a normal String instead of an SVGAnimatedString
  // as dictated by the SVG 1.1 standard
  _getClassName: function() {
    // TODO: Implement
  },
  
  // Note: getPresentationAttribute not supported
  
  // SVGTransformable; takes an _SVGTransform
  _setTransform: function(transform) {
    // TODO: Implement
  },
  
  // Note: we return a JS Array of _SVGTransforms instead of an 
  // SVGAnimatedTransformList as dictated by the SVG 1.1 standard
  _getTransform: function() /* readonly; returns Array */ {
    // TODO: Implement
  },
  
  // SVGFitToViewBox
  // Note: only supported for root SVG element for now
  _getViewBox: function() { /* readonly; SVGRect */
    // Note: We return an _SVGRect instead of an SVGAnimatedRect as dictated
    // by the SVG 1.1 standard
    // TODO: Implement
  },
  
  // SVGElement
  _getId: function() {
    // note: all attribute names are prefixed with _ to prevent attribute names
    // starting numbers from being interpreted as array indexes
    if (this._attributes['_id']) {
      return this._attributes['_id'];
    } else {
      // id property is special; we return empty string instead of null
      // to mimic native behavior on Firefox and Safari
      return '';
    }
  },
  
  _setId: function(id) {
    return this.setAttribute('id', id);
  },
  
  ownerSVGElement: null, /* Note: technically readonly */
  
  // not supported: xmlbase, viewportElement
  
  // SVGSVGElement and SVGUseElement readonly
  
  _getX: function() { /* SVGAnimatedLength */
    var value = this._trimMeasurement(this.getAttribute('x'));
    return new _SVGAnimatedLength(new _SVGLength(new Number(value)));
  },
  
  _getY: function() { /* SVGAnimatedLength */
    var value = this._trimMeasurement(this.getAttribute('y'));
    return new _SVGAnimatedLength(new _SVGLength(new Number(value)));
  },
  
  _getWidth: function() { /* SVGAnimatedLength */
    var value = this._trimMeasurement(this.getAttribute('width'));
    return new _SVGAnimatedLength(new _SVGLength(new Number(value)));
  },
  
  _getHeight: function() { /* SVGAnimatedLength */
    var value = this._trimMeasurement(this.getAttribute('height'));
    return new _SVGAnimatedLength(new _SVGLength(new Number(value)));
  },
  
  /** Extracts the unit value and trims off the measurement type. For example, 
      if you pass in 14px, this method will return 14. Null will return null. */
  _trimMeasurement: function(value) {
    if (value !== null) {
      value = value.replace(/[a-z]/gi, '');
    }
    return value;
  },
  
  // many attributes and methods from these two interfaces not here
  
  // defacto non-standard attributes
  
  _getInnerHTML: function() {
    // TODO: Implement; NativeHandler will require this as well, since 
    // innerHTML not natively supported there
  },
  
  _setInnerHTML: function(newValue) {
    // TODO: Implement; NativeHandler will require this as well, since 
    // innerHTML not natively supported there
  },
  
  // SVG 1.1 inline event attributes:
  // http://www.w3.org/TR/SVG/script.html#EventAttributes
  // Note: Technically not all elements have all these events; also
  // technically the SVG spec requires us to support the DOM Mutation
  // Events, which we do not.
  // We use this array to build up our getters and setters .
  // TODO: Gauge the performance impact of making this dynamic
  _allEvents: [
    'onfocusin', 'onfocusout', 'onactivate', 'onclick', 'onmousedown',
    'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout', 'onload',
    'onunload', 'onabort', 'onerror', 'onresize', 'onscroll', 'onzoom',
    'onbegin', 'onend', 'onrepeat'
  ],
  
  _handleEvent: function(evt) {
    // called from the IE HTC when an event is fired, as well as from
    // one of our getter/setters for non-IE browsers
  },
  
  _prepareEvents: function() {
    // for non-IE browsers, make the getter/setter magic using the
    // _allEvents array
  },
  
  // SVGTests, SVGLangSpace, SVGExternalResourcesRequired
  // not supported
  
  // contains any attribute set with setAttribute; object literal of
  // name/value pairs
  _attributes: null,
  
  // copies the attributes from the XML DOM node into target
  _importAttributes: function(target, nodeXML) {
    for (var i = 0; i < nodeXML.attributes.length; i++) {
      var attr = nodeXML.attributes[i];
      this._attributes['_' + attr.nodeName] = attr.nodeValue;
    }
  },
  
  /** Does all the getter/setter magic for attributes, so that external
      callers can do something like myElement.innerHTML = 'foobar' or
      myElement.id = 'test' and our getters and setters will intercept
      these to do the correct behavior with the Flash viewer.*/
  _defineAccessors: function() {
    var props;
    var self = this;
    
    // innerHTML
    /* // TODO: Not implemented yet
    this.__defineGetter__('innerHTML', function() {
      return self._getInnerHTML();
    });
    this.__defineSetter__('innerHTML', function(newValue) {
      return self._setInnerHTML(newValue);
    });
    */
    
    // SVGSVGElement and SVGUseElement readyonly props
    if (this.nodeName == 'svg' || this.nodeName == 'use') {
      this.__defineGetter__('x', function() { return self._getX(); });
      this.__defineGetter__('y', function() { return self._getY(); });
      this.__defineGetter__('width', function() { return self._getWidth(); });
      this.__defineGetter__('height', function() { return self._getHeight(); });
    }
    
    // id property
    this.__defineGetter__('id', hitch(this, this._getId));
    this.__defineSetter__('id', hitch(this, this._setId));
  },
  
  /** @param prop String property name, such as 'x'.
      @param readWrite Boolean on whether the property is both read and write;
      if false then read only. */
  _defineAccessor: function(prop, readWrite) {
    var self = this;
    
    var getMethod = function() {
      return self.getAttribute(prop);
    };
  
    this.__defineGetter__(prop, getMethod);
    
    if (readWrite) {
      var setMethod = function(newValue) {
        return self.setAttribute(prop, newValue);
      };
      
      this.__defineSetter__(prop, setMethod);
    }
  }
});


/** Not an official DOM interface; used so that we can track changes to
    the CSS style property of an Element
    @param element The _Element that this Style is attached to. */
function _Style(element) {
  this._element = element;
  this._setup();
}

// we use this array to build up getters and setters to watch any changes for
// any of these styles. Note: Technically we shouldn't have all of these for
// every element, since some SVG elements won't have specific kinds of
// style properties, like the DESC element having a font-size.
// TODO: Gauge the performance impact of making this dynamic
_Style._allStyles = [
  'font', 'fontFamily', 'fontSize', 'fontSizeAdjust', 'fontStretch', 'fontStyle',
  'fontVariant', 'fontWeight', 'direction', 'letterSpacing', 'textDecoration',
  'unicodeBidi', 'wordSpacing', 'clip', 'color', 'cursor', 'display', 'overflow',
  'visibility', 'clipPath', 'clipRule', 'mask', 'opacity', 'enableBackground',
  'filter', 'floodColor', 'floodOpacity', 'lightingColor', 'stopColor',
  'stopOpacity', 'pointerEvents', 'colorInterpolation',
  'colorInterpolationFilters', 'colorProfile', 'colorRendering', 'fill',
  'fillOpacity', 'fillRule', 'imageRendering', 'marker', 'markerEnd',
  'markerMid', 'markerStart', 'shapeRendering', 'stroke', 'strokeDasharray',
  'strokeDashoffset', 'strokeLinecap', 'strokeLinejoin', 'strokeMiterlimit',
  'strokeOpacity', 'strokeWidth', 'textRendering', 'alignmentBaseline', 
  'baselineShift', 'dominantBaseline', 'glyphOrientationHorizontal',
  'glyphOrientationVertical', 'kerning', 'textAnchor',
  'writingMode'
];

extend(_Style, {
  /** Flag that indicates that the HTC should ignore any property changes
      due to style changes. Used when we are internally making style changes. */
  _ignoreStyleChanges: true,
  
  /** Initializes our magic getters and setters for non-IE browsers. For IE
      we set our initial style values on the HTC. */
  _setup: function() {
    // Handle an edge-condition: the SVG spec requires us to support
    // style="" strings that might have uppercase style names, measurements,
    // etc. Normalize these here before continuing.
    this._normalizeStyle();
    
    // now handle browser-specific initialization
    if (!isIE) {
      // setup getter/setter magic for non-IE browsers
      for (var i = 0; i < _Style._allStyles.length; i++) {
        var styleName = _Style._allStyles[i];
        this._defineAccessor(styleName);
      }
      
      // CSSStyleDeclaration properties
      this.__defineGetter__('length', hitch(this, this._getLength));
    } else { // Internet Explorer setup
      var htcStyle = this._element._htcNode.style;
      
      // parse style string
      var parsedStyle = this._fromStyleString();
      
      // loop through each one, setting it on our HTC's style object
      for (var i = 0; i < parsedStyle.length; i++) {
        var styleName = this._toCamelCase(parsedStyle[i].styleName);
        var styleValue = parsedStyle[i].styleValue;
        htcStyle[styleName] = styleValue;
      }
      
      // set initial values for style.length
      htcStyle.length = 0;
      
      // expose .length property on our custom _Style object to aid it 
      // being used internally
      this.length = 0;
      
      // set CSSStyleDeclaration methods to our implementation
      htcStyle.item = hitch(this, this.item);
      htcStyle.setProperty = hitch(this, this.setProperty);
      htcStyle.getPropertyValue = hitch(this, this.getPropertyValue);
      
      // start paying attention to style change events on the HTC node
      this._changeListener = hitch(this, this._onPropertyChange);
      this._element._htcNode.attachEvent('onpropertychange', 
                                         this._changeListener);
    }
  },
  
  /** Defines the getter and setter for a single style, such as 'display'. */
  _defineAccessor: function(styleName) {
    var self = this;
    
    this.__defineGetter__(styleName, function() {
      return self._getStyleAttribute(styleName);
    });
    
    this.__defineSetter__(styleName, function(styleValue) {
      return self._setStyleAttribute(styleName, styleValue);
    });
  },
  
  _setStyleAttribute: function(styleName, styleValue) {
    //console.log('setStyleAttribute, styleName='+styleName+', styleValue='+styleValue);
    // Note: .style values and XML attributes have separate values. The XML
    // attributes always have precedence over any style values.
    
    // convert camel casing (i.e. strokeWidth becomes stroke-width)
    var stylePropName = this._fromCamelCase(styleName);
    
    // change our XML style string value
    
    // parse style string first
    var parsedStyle = this._fromStyleString();
    
    // is our style name there?
    var foundStyle = false;
    for (var i = 0; i < parsedStyle.length; i++) {
      if (parsedStyle[i].styleName === stylePropName) {
        parsedStyle[i].styleValue = styleValue;
        foundStyle = true;
        break;
      }
    }
    
    // if we didn't find it above add it
    if (!foundStyle) {
      parsedStyle.push({ styleName: stylePropName, styleValue: styleValue });
    }
    
    // now turn the style back into a string and set it on our XML and
    // internal list of attribute values
    var styleString = this._toStyleString(parsedStyle);
    this._element._nodeXML.setAttribute('style', styleString);
    this._element._attributes['_style'] = styleString;
    
    // for IE, update our HTC style object; we can't do magic getters for 
    // those so have to update and cache the values
    if (isIE) {
      var htcStyle = this._element._htcNode.style;
      
      // never seen before; bump our style length
      if (!foundStyle) {
        htcStyle.length++;
        this.length++;
      }
      
      // update style value on HTC node so that when the value is fetched
      // it is correct; ignoreStyleChanges during this or we will get into
      // an infinite loop
      this._ignoreStyleChanges = true;
      htcStyle[styleName] = styleValue;
      this._ignoreStyleChanges = false;
    }
    
    // tell Flash about the change
    if (this._element._attached && this._element._passThrough) {
      var flashStr = FlashHandler._encodeFlashData(styleValue);
      this._element._handler.sendToFlash({ 
                                          type: 'invoke', 
                                          method: 'setAttribute',
                                          elementGUID: this._element._guid,
                                          applyToStyle: true,
                                          attrName: stylePropName, 
                                          attrValue: flashStr });
    }
  },
  
  _getStyleAttribute: function(styleName) {
    //console.log('getStyleAttribute, styleName='+styleName);
    // convert camel casing (i.e. strokeWidth becomes stroke-width)
    var stylePropName = this._fromCamelCase(styleName);
    
    if (this._element._attached && this._element._passThrough) {
      var returnMsg = this._element._handler.sendToFlash({ 
                                              type: 'invoke', 
                                              method: 'getAttribute',
                                              elementGUID: this._element._guid,
                                              getFromStyle: true,
                                              attrName: stylePropName });
      if (!returnMsg) {
         return null;
      }

      return returnMsg.attrValue;
    } else {
      // not attached yet; have to parse it from our local value
      var parsedStyle = this._fromStyleString();

      for (var i = 0; i < parsedStyle.length; i++) {
        if (parsedStyle[i].styleName === stylePropName) {
          return parsedStyle[i].styleValue;
        }
      }
      
      return null;
    }
  },
  
  /** Parses our style string into an array, where each array entry is an
      object literal with the 'styleName' and 'styleValue', such as:
      
      results[0].styleName
      results[0].styleValue
      etc. 
      
      If there are no results an empty array is returned. */
  _fromStyleString: function() {
    var styleValue = this._element._nodeXML.getAttribute('style');
    
    if (styleValue === null || styleValue === undefined) {
      return [];
    }
    
    var baseStyles;
    if (styleValue.indexOf(';') == -1) {
      // only one style value given, with no trailing semicolon
      baseStyles = [ styleValue ];
    } else {
      baseStyles = styleValue.split(/\s*;\s*/);
      // last style is empty due to split()
      if (!baseStyles[baseStyles.length - 1]) {
        baseStyles = baseStyles.slice(0, baseStyles.length - 1);
      }
    }
    
    var results = [];
    for (var i = 0; i < baseStyles.length; i++) {
      var style = baseStyles[i];
      var styleSet = style.split(':');
      if (styleSet.length == 2) {
        var attrName = styleSet[0];
        var attrValue = styleSet[1];
        
        // trim leading whitespace
        attrName = attrName.replace(/^\s+/, '');
        attrValue = attrValue.replace(/^\s+/, '');
        
        var entry = { styleName: attrName, styleValue: attrValue };
        results.push(entry);
      }
    }
    
    return results;
  },
  
  /** Turns a parsed style into a string.
  
      @param parsedStyle An array where each entry is an object literal
      with two values, 'styleName' and 'styleValue'. Uses same data structure
      returned from fromStyleString() method above. */
  _toStyleString: function(parsedStyle) {
    var results = '';
    for (var i = 0; i < parsedStyle.length; i++) {
      results += parsedStyle[i].styleName + ': ';
      results += parsedStyle[i].styleValue + ';';
      if (i != (parsedStyle.length - 1)) {
        results += ' ';
      }
    }
    
    return results;
  },
  
  /** Transforms a camel case style name, such as strokeWidth, into it's
      dash equivalent, such as stroke-width. */
  _fromCamelCase: function(styleName) {
    return styleName.replace(/([A-Z])/g, '-$1').toLowerCase();
  },
  
  /** Transforms a dash style name, such as stroke-width, into it's 
      camel case equivalent, such as strokeWidth. */
  _toCamelCase: function(stylePropName) {
    if (stylePropName.indexOf('-') == -1) {
      return stylePropName;
    }
    
    var results = '';
    var sections = stylePropName.split('-');
    results += sections[0];
    for (var i = 1; i < sections.length; i++) {
      results += sections[i].charAt(0).toUpperCase() + sections[i].substring(1);
    }
    
    return results;
  },
  
  // CSSStyleDeclaration interface methods and properties
  
  // TODO: removeProperty not supported yet
  
  setProperty: function(stylePropName, styleValue, priority) {
    // TODO: priority not supported for now; not sure if it even makes
    // sense in this context
    
    // convert from dash style to camel casing (i.e. stroke-width becomes
    // strokeWidth
    var styleName = this._toCamelCase(stylePropName);
    
    this._setStyleAttribute(styleName, styleValue);
    return styleValue;
  },
  
  getPropertyValue: function(stylePropName) {
    // convert from dash style to camel casing (i.e. stroke-width becomes
    // strokeWidth
    var styleName = this._toCamelCase(stylePropName);
    
    return this._getStyleAttribute(styleName);
  },
  
  item: function(index) {
    // parse style string
    var parsedStyle = this._fromStyleString();
    
    // TODO: Throw exception if index is greater than length of style rules
    
    return parsedStyle[index].styleName;
  },
  
  // NOTE: We don't support cssText for now. The reason why is that
  // IE has a style.cssText property already on our HTC nodes. This
  // property incorrectly includes some of our custom internal code,
  // such as 'length' as well as both versions of certain camel cased
  // properties (like stroke-width and strokeWidth). There is no way 
  // currently known to work around this. The property is not that important
  // anyway so it won't currently be supported.
  
  _getLength: function() {
    // parse style string
    var parsedStyle = this._fromStyleString();
    return parsedStyle.length;
  },
  
  /** Handles an edge-condition: the SVG spec requires us to support
      style="" strings that might have uppercase style names, measurements,
      etc. We normalize these to lower-case in this method. */
  _normalizeStyle: function() {
    // style="" attribute?
    // NOTE: IE doesn't support nodeXML.hasAttribute()
    if (!this._element._nodeXML.getAttribute('style')) {
      return;
    }
    
    // no uppercase letters?
    if (!/[A-Z]/.test(this._element._nodeXML.getAttribute('style'))) {
      return;
    }
    
    // parse style into it's components
    var parsedStyle = this._fromStyleString();
    for (var i = 0; i < parsedStyle.length; i++) {
      parsedStyle[i].styleName = parsedStyle[i].styleName.toLowerCase();
      
      // don't lowercase url() values
      if (parsedStyle[i].styleValue.indexOf('url(') == -1) {
        parsedStyle[i].styleValue = parsedStyle[i].styleValue.toLowerCase();
      }
    }
    
    // turn back into a string
    var results = '';
    for (var i = 0; i < parsedStyle.length; i++) {
      results += parsedStyle[i].styleName + ': ' 
                 + parsedStyle[i].styleValue + '; ';
    }
    
    // remove trailing space
    if (results.charAt(results.length - 1) == ' ') {
      results = results.substring(0, results.length - 1);
    }
    
    // change our style value; however, don't pass this through to Flash
    // because Flash might not even know about our existence yet, because we
    // are still being run from the _Element constructor
    var origPassThrough = this._element._passThrough;
    this._element._passThrough = false;
    this._element.setAttribute('style', results);
    this._element._passThrough = origPassThrough;
  },
  
  /** For Internet Explorer, this method is called whenever a
      propertychange event fires on the HTC. */
  _onPropertyChange: function() {
    // watch to see when anyone changes a 'style' property so we
    // can mirror it in the Flash control
    
    if (this._ignoreStyleChanges) {
      return;
    }
    
    var prop = window.event.propertyName;

    if (prop && /^style\./.test(prop) && prop != 'style.length') {        
      // extract the style name and value
      var styleName = prop.match(/^style\.(.*)$/)[1];
      var styleValue = this._element._htcNode.style[styleName];
      
      // tell Flash and our fake node about our style change
      this._setStyleAttribute(styleName, styleValue);
    }
  }
});


/** An OBJECT tag that is embedding an SVG element. This class encapsulates
    how we actually do the work of embedding this into the page (such as 
    internally transforming the SVG OBJECT into a Flash one).
    
    @param svgNode The SVG OBJECT node to work with.
    @param handler The FlashHandler that owns us. */
function _SVGObject(svgNode, handler) {
  this._handler = handler;
  this._svgNode = svgNode;
  this._scriptsToExec = [];
  
  // handle any onload event listeners that might be present for
  // dynamically created OBJECT tags; this._svgNode._listeners is an array 
  // we expose through our custom document.createElement('object', true) -- 
  // the 'true' actually flags us to do things like this
  for (var i = 0; this._svgNode._listeners 
                  && i < this._svgNode._listeners.length; i++) {
    // wrap each of the listeners so that its 'this' object
    // correctly refers to the Flash OBJECT if used inside the listener
    // function; we use an outer function to prevent closure from 
    // incorrectly happening, and then return an inner function inside
    // of this that correctly makes the 'this' object be our Flash
    // OBJECT rather than the global window object
    var wrappedListener = (function(handler, listener) {
      return function() {
        listener.apply(handler.flash);
      };
    })(this._handler, this._svgNode._listeners[i]); // pass values into function
    svgweb.addOnLoad(wrappedListener);
  }
  
  // fetch the SVG URL now and start processing.
  // Note: unfortunately we must use the 'src' attribute instead of the 
  // standard 'data' attribute for IE. On certain installations of IE
  // with some security patches IE will display a gold security bar indicating
  // that some URLs were blocked; on others IE will attempt to download the
  // file pointed to by the 'data' attribute. Note that using the 'src'
  // attribute is a divergence from the standard, but it solves both issues.
  this.url = this._svgNode.getAttribute('src');
  if (!this.url) {
    this.url = this._svgNode.getAttribute('data');
  }
  
  this._fetchURL(this.url, 
    // success function
    hitch(this, function(svgStr) {
      // clean up and parse our SVG
      var results = svgweb._cleanSVG(svgStr, false, false);
      this._svgString = results.svg;
      this._xml = results.xml;

      // create our document objects
      this.document = new _Document(this._xml, this._handler);

      // insert our Flash and replace the SVG OBJECT tag
      var nodeXML = this._xml.documentElement;
      
      // save any custom PARAM tags that might be nested inside our SVG OBJECT
      this._savedParams = this._getPARAMs(this._svgNode);
      
      // now insert the Flash
      var inserter = new FlashInserter('object', document, 
                                       this._xml.documentElement,
                                       this._svgNode, this._handler);

      // wait for Flash to finish loading; see _onFlashLoaded() in this class
      // for further execution after the Flash asynchronous process is done
    }),
    // failure function
    hitch(this, this.fallback)
  );
}

extend(_SVGObject, {
  /** An array of strings, where each string is an SVG SCRIPT tag embedded
      in an external SVG file. This is when SVG is embedded with an OBJECT. */
  _scriptsToExec: null,
  
  _fetchURL: function(url, onSuccess, onFailure) {
    var req = xhrObj();
    
    // bust the cache for IE since IE's XHR GET requests are wonky
    if (isIE) {
      url += (url.indexOf('?') == -1) ? '?' : '&';
      url += new Date().getTime();
    }
    
    req.onreadystatechange = function() {
      if (req.readyState == 4) {
        if (req.status == 200) { // done
          onSuccess(req.responseText);
        } else { // error
          onFailure(req.status + ': ' + req.statusText);
        }
        
        req = null;
      }
    };
    
    req.open('GET', url, true);
    req.send(null);
  },
  
  _fallback: function(error) {
    console.log('onError (fallback), error='+error);
    // TODO!!!
  },
    
  _onFlashLoaded: function(msg) {
    //console.log('_SVGObject, onFlashLoaded, msg='+this._handler.debugMsg(msg));
    
    // store a reference to our Flash object
    this._handler.flash = document.getElementById(this._handler.flashID);

    // copy any custom developer PARAM tags on the original SVG OBJECT 
    // over to the Flash element so that SVG scripts can programmatically 
    // access them; we saved these earlier in the _SVGObject constructor
    if (this._savedParams.length) {
      for (var i = 0; i < this._savedParams.length; i++) {
        var param = this._savedParams[i];
        this._handler.flash.appendChild(param);
        param = null;
      }
      
      this._savedParams = null;
    }
    
    // expose top and parent attributes on Flash OBJECT
    this._handler.flash.top = this._handler.flash.parent = window;
    
    // if not IE, send the SVG string over to Flash
    if (!isIE) {
      this._handler.sendToFlash({ type: 'load', 
                                  sourceType: 'string',
                                  svgString: this._svgString,
                                  objectURL: this._getRelativeTo('object'),
                                  pageURL: this._getRelativeTo('page'),
                                  objectWidth: this._handler._explicitWidth,
                                  objectHeight: this._handler._explicitHeight,
                                  ignoreWhiteSpace: false });
    } else {
      // if IE, force the HTC file to asynchronously load with a dummy element;
      // we want to do the async operation now so that external API users don't 
      // get hit with the async nature of the HTC file first loading when they
      // make a sync call; we will send the SVG over to the Flash _after_ the
      // HTC file is done loading.
      this._dummyNode = document.createElement('svg:__force__load');
      this._dummyNode._handler = this._handler;
      
      // find out when the content is ready
      // NOTE: we do this here instead of inside the HTC file using an
      // internal oncontentready event in order to make the HTC file faster
      // and use less memory. Note also that 'oncontentready' is not available 
      // outside HTC files, only 'onreadystatechange' is available.
      this._readyStateListener = hitch(this, this._onHTCLoaded); // cleanup later
      this._dummyNode.attachEvent('onreadystatechange', 
                                  this._readyStateListener);
      
      var head = document.getElementsByTagName('head')[0];
      // NOTE: as _soon_ as we append the dummy element the HTC file will
      // get called, branching control, so code after this call will not
      // get run in the sequence expected
      head.appendChild(this._dummyNode);
    }
  },
  
  _onHTCLoaded: function() {
    //console.log('_SVGObject, onHTCLoaded');
    // can't use htcNode.parentNode to get the parent and remove the child
    // since we override that inside svg.htc
    var head = document.getElementsByTagName('head')[0];
    head.removeChild(this._dummyNode);
    
    // cleanup our event handler
    this._dummyNode.detachEvent('onreadystatechange', this._readyStateListener);
    
    // prevent IE memory leaks
    this._dummyNode = null;
    head = null;
    
    // send the SVG string over to Flash
    this._handler.sendToFlash({ type: 'load', 
                                sourceType: 'string',
                                svgString: this._svgString,
                                objectURL: this._getRelativeTo('object'),
                                pageURL: this._getRelativeTo('page'),
                                objectWidth: this._handler._explicitWidth,
                                objectHeight: this._handler._explicitHeight,
                                ignoreWhiteSpace: false });
  },
  
  _onRenderingFinished: function(msg) {
    //console.log('_SVGObject, onRenderingFinished, id='+this._handler.id
    //            + ', msg='+this._handler.debugMsg(msg));

    // we made the SVG hidden before to avoid scrollbars on IE; make visible
    // now
    this._handler.flash.style.visibility = 'visible';

    // create the document object
    this._handler.document = new _Document(this._xml, this._handler);

    // create the documentElement and rootElement and set them to our SVG 
    // root element
    var rootXML = this._xml.documentElement;
    var rootID = rootXML.getAttribute('id');
    var root = new _SVGSVGElement(rootXML, null, null, this._handler);
    var doc = this._handler.document;
    doc.documentElement = root._getProxyNode();
    doc.rootElement = root._getProxyNode();
    // add to our lookup tables so that fetching this node in the future works
    doc._nodeById['_' + rootID] = root;

    // add our contentDocument property
    this._handler.flash.contentDocument = doc;
    
    // FIXME: NOTE: unfortunately we can't support the getSVGDocument() method; 
    // Firefox throws an error when we try to override it:
    // 'Trying to add unsupported property on scriptable plugin object!'
    // this._handler.flash.getSVGDocument = function() {
    //   return this.contentDocument;
    // };
    
    // create a pseudo window element
    this._handler.window = new _SVGWindow(this._handler);
    
    // our fake document object should point to our fake window object
    doc.defaultView = this._handler.window;
    
    // add our onload handler to the list of scripts to execute at the
    // beginning
    var onload = root.getAttribute('onload');
    if (onload) {
      // we want 'this' inside of the onload handler to point to our
      // SVG root; the 'document.documentElement' will get rewritten later by
      // the _executeScript() method to point to our fake SVG root instead
      onload = '(function(){' + onload + '}).apply(document.documentElement);';
      this._scriptsToExec.push(onload);
    }
    
    // now execute any scripts embedded into the SVG file; we turn all
    // the scripts into one giant block and run them together so that 
    // global functions can 'see' and call each other
    var finalScript = '';
    for (var i = 0; i < this._scriptsToExec.length; i++) {
      finalScript += this._scriptsToExec[i] + '\n';
    }
    this._executeScript(finalScript);
    
    // indicate that we are done
    this._handler._loaded = true;
    this._handler.fireOnLoad(this._handler.id, 'object');
  },
  
  /** Relative URLs inside of SVG need to expand against something (i.e.
      such as having an SVG Audio tag with a relative URL). This method
      figures out what that relative URL should be. We send this over to
      Flash when rendering things so Flash knows what to expand against. 
      
      @param toWhat - String that controls what we use for the relative URL.
      If "object" given, we use the URL to the SVG OBJECT; if "page" given,
      we determine things relative to the page itself. */
  _getRelativeTo: function(toWhat) {
    var results = '';
    if (toWhat == 'object') {
      // strip off scheme and hostname, then match just path portion
      var pathname = this.url.replace(/[^:]*:\/\/[^\/]*/).match(/\/?[^\?\#]*/)[0];
      if (pathname && pathname.length > 0 && pathname.indexOf('/') != -1) {
        // snip off any filename after a final slash
        results = pathname.replace(/\/([^/]*)$/, '/');
      }
    } else {
      var pathname = window.location.pathname.toString();
      if (pathname && pathname.length > 0 && pathname.indexOf('/') != -1) {
        // snip off any filename after a final slash
        results = pathname.replace(/\/([^/]*)$/, '/');
      }
    }

    return results;
  },
  
  /** Executes a SCRIPT block inside of an SVG file. We essentially rewrite
      the references in this script to point to our Flash Handler instead, 
      create an invisible iframe that will act as the 'global' object, and then
      write the script into the iframe as a new SCRIPT block.
      
      @param script String with script to execute. */
  _executeScript: function(script) {
    // expose the handler as a global object at the top of the script; 
    // expose the svgns and xlinkns variables; and override the setTimeout
    // and setInterval functions for the iframe where we will execute things
    // so we can clear out all timing functions if the SVG OBJECT is later
    // removed with a call to svgweb.removeChild
    var addToTop = 'var __svgHandler = top.svgweb.handlers["' 
                  + this._handler.id + '"];\n'
                  + 'window.svgns = "' + svgns + '";\n'
                  + 'window.xlinkns = "' + xlinkns + '";\n';
                  
    var timeoutOverride = 
                    'window._timeoutIDs = [];\n'
                  + 'window._setTimeout = window.setTimeout;\n'
                  + 'window.setTimeout = \n'
                  + '       (function() {\n'
                  + '          return function(f, ms) {\n'
                  + '            var timeID = window._setTimeout(f, ms);\n'
                  + '            window._timeoutIDs.push(timeID);\n'
                  + '            return timeID;\n'
                  + '          };\n'
                  + '        })();\n'; 
                  
    var intervalOverride = 
                    'window._intervalIDs = [];\n'
                  + 'window._setInterval = window.setInterval;\n'
                  + 'window.setInterval = \n'
                  + '       (function() {\n'
                  + '          return function(f, ms) {\n'
                  + '            var timeID = window._setInterval(f, ms);\n'
                  + '            window._intervalIDs.push(timeID);\n'
                  + '            return timeID;\n'
                  + '          };\n'
                  + '        })();\n';
                  
    script = addToTop + timeoutOverride + intervalOverride  + '\n\n' + script;
    
    // change any calls to top.document or top.window, to a temporary different 
    // string to avoid collisions when we transform next
    script = script.replace(/top\.document/g, 'top.DOCUMENT');
    script = script.replace(/top\.window/g, 'top.WINDOW');
    
    // intercept any calls to 'document.' or 'window.' inside of a string;
    // transform to this to a different temporary token so we can handle
    // it differently (i.e. we will put backslashes around certain portions:
    // top.svgweb.handlers[\"svg2\"].document for example)
    
    // change any calls to the document object to point to our Flash Handler
    // instead; avoid variable names that have the word document in them,
    // and pick up document* used with different endings
    script = script.replace(/(^|[^A-Za-z0-9_])document(\.|'|"|\,| |\))/g, 
                            '$1__svgHandler.document$2');
    
    // change some calls to the window object to point to our fake window
    // object instead
    script = script.replace(/window\.(location|addEventListener|onload|frameElement)/g, 
                            '__svgHandler.window.$1');
                            
    // change back any of our top.document or top.window calls to be
    // their original lower case (we uppercased them earlier so that we
    // wouldn't incorrectly transform them)
    script = script.replace(/top\.DOCUMENT/g, 'top.document');
    script = script.replace(/top\.WINDOW/g, 'top.window');
                
    // Now create an iframe that we will use to 'silo' and execute our
    // code, which will act as a place for globals to be defined without
    // clobbering globals on the HTML document's window or from other
    // embedded SVG files. This is necessary so that setTimeouts and
    // setIntervals will work later on, for example.
                
    // create an iframe and attach it offscreen
    var iframe = document.createElement('iframe');
    iframe.setAttribute('src', 'about:blank');
    iframe.style.position = 'absolute';
    iframe.style.top = '-1000px';
    iframe.style.left = '-1000px';
    var body = document.getElementsByTagName('body')[0];
    body.appendChild(iframe);
    
    // get the iframes document object; IE differs on how to get this
    var iframeDoc = (iframe.contentDocument) ? 
                iframe.contentDocument : iframe.contentWindow.document;

    // set the document.defaultView to the iframe's real Window object;
    // note that IE doesn't support defaultView
    var iframeWin = iframe.contentWindow;
    this._handler.document.defaultView = iframeWin;

    // now insert the script into the iframe to execute it in a siloed way
    iframeDoc.write('<script>' + script + '</script>');
    iframeDoc.close();
    
    // execute any addEventListener(onloads) that might have been
    // registered
    this._handler.window._fireOnload();
  },
  
  /** Developers can nest custom PARAM tags inside our SVG OBJECT in order
      to pass parameters into their SVG file. This function gets these,
      and makes a clone of them suitable for us to re-attach and use in the
      future.
      
      @param svgNode The SVG OBJECT DOM node.
      
      @returns An array of cloned PARAM objects. If none, then the array has
      zero length. */
  _getPARAMs: function(svgNode) {
    var params = [];
    
    for (var i = 0; i < svgNode.childNodes.length; i++) {
      var child = svgNode.childNodes[i];
      if (child.nodeName.toUpperCase() == 'PARAM') {
        params.push(child.cloneNode(false));
      }
    }
    
    return params;
  }
});


/** A fake window object that we provide for SVG files to use internally. 
    
    @param handler The Flash Handler assigned to this fake window object. */
function _SVGWindow(handler) {
  this._handler = handler;
  this.fake = true; // helps to detect fake abstraction
  
  this.frameElement = this._handler.flash;
  this.location = this._createLocation();
  this.alert = window.alert;
  this.top = this.parent = window;
  
  this._onloadListeners = [];
}

extend(_SVGWindow, {
  addEventListener: function(type, listener, capture) {
    if (type == 'load' || type == 'SVGLoad') {
      this._onloadListeners.push(listener);
    }
  },
  
  _fireOnload: function() {
    for (var i = 0; i < this._onloadListeners.length; i++) {
      try {
        this._onloadListeners[i]();
      } catch (exp) {
        console.log('The following exception occurred from an SVG onload '
                    + 'listener: ' + (exp.message || exp));
      }
    }
    
    // if there is an inline window.onload execute that now
    if (this.onload) {
      try {
        this.onload();
      } catch (exp) {
        console.log('The following exception occurred from an SVG onload '
                    + 'listener: ' + (exp.message || exp));
      }
    }
  },
  
  /** Creates a fake window.location object. 
  
      @param fakeLocation A full window.location object (i.e. it has .port,
      .hash, etc.) used for testing purposes to give a fake value
      to the containing HTML page's window.location value. */
  _createLocation: function(fakeLocation) {
    var loc = {};
    var url = this._handler._svgObject.url;
    var windowLocation;
    if (fakeLocation) {
      windowLocation = fakeLocation;
    } else {
      windowLocation = window.location;
    }
    
    // expand URL
    
    // first, see if this url is fully expanded already
    if (/^http/.test(url)) {
      // nothing to do
    } else if (url.charAt(0) == '/') { // ex: /embed1.svg
      url = windowLocation.protocol + '//' + windowLocation.host + url;
    } else { // fully relative, such as embed1.svg
      // get the pathname of the page we are on, clearing out everything after
      // the last slash
      if (windowLocation.pathname.indexOf('/') == -1) {
        url = windowLocation.protocol + '//' + windowLocation.host + '/' + url;
      } else {
        var relativeTo = windowLocation.pathname;

        // walk the string in reverse removing characters until we hit a slash
        for (var i = relativeTo.length - 1; i >= 0; i--) {
          if (relativeTo.charAt(i) == '/') {
            break;
          }
          
          relativeTo = relativeTo.substring(0, i);
        }
        
        url = windowLocation.protocol + '//' + windowLocation.host
              + relativeTo + url;
      }
    }
        
    // parse URL
    
    // FIXME: NOTE: href, search, and pathname should be URL-encoded; the others
    // should be URL-decoded
    
    // match 1 - protocol
    // match 2 - hostname
    // match 3 - port
    // match 4 - pathname
    // match 5 - search
    // match 6 - hash

    var results = 
          url.match(/^(https?:)\/\/([^\/:]*):?([0-9]*)([^\?#]*)([^#]*)(#.*)?$/);
          
    loc.protocol = (results[1]) ? results[1] : windowLocation.href;
    if (loc.protocol.charAt(loc.protocol.length - 1) != ':') {
      loc.protocol += ':';
    }
    loc.hostname = results[2];
        
    // NOTE: browsers natively drop the port if its not explicitly specified
    loc.port = '';
    if (results[3]) {
      loc.port = results[3];
    }
        
    // is the URL and the containing page at different domains?
    var sameDomain = true;
    if (loc.protocol != windowLocation.protocol
        || loc.hostname != windowLocation.hostname
        || (loc.port && loc.port != windowLocation.port)) {
      sameDomain = false;
    }
        
    if (sameDomain && !loc.port) {
      loc.port = windowLocation.port;
    }
        
    if (loc.port) {
      loc.host = loc.hostname + ':' + loc.port;
    } else {
      loc.host = loc.hostname;
    }
    
    loc.pathname = (results[4]) ? results[4] : '';
    loc.search = (results[5]) ? results[5] : '';
    loc.hash = (results[6]) ? results[6] : '';
    
    loc.href = loc.protocol + '//' + loc.host + loc.pathname + loc.search
               + loc.hash;
    
    loc.toString = function() {
      return this.protocol + '//' + this.host + this.pathname + this.search
             + this.hash;
    };
    
    return loc;
  }
});


/** Utility helper class that will generate the correct HTML for a Flash
    OBJECT and embed it into a page. Broken out so that both _SVGObject
    and _SVGSVGElement can use it in different contexts (i.e. _SVGObject
    will directly embed the Flash onto a page to simulate and SVG OBJECT tag,
    while _SVGSVGElement will do various tricks to emulate the SVG being
    directly embedded into HTML markup.
    
    @param embedType Either the string 'script' when embedding SVG into
    a page using the SCRIPT tag or 'object' if embedding SVG into a page
    using the OBJECT tag.
    @param doc The document object to use. Used for embedType of 'script' so
    that we can embed either into the actual page or into an HTC element's
    shadow DOM (see _insertFlash() method inside of svg.htc for details).
    @param nodeXML The parsed XML for the root SVG element, used for sizing,
    background, color, etc.
    @param replaceMe If embedType is 'script', this is the SCRIPT node to
    replace. If embedType is 'object', then this is the SVG OBJECT node.
    @param handler The FlashHandler that will be associated with this Flash
    object.
    @param htcNode Optional. If present, this is the HTC node for Internet
    Explorer pointing to the SVG root element. Used when embedType is 'script'.
  */
function FlashInserter(embedType, doc, nodeXML, replaceMe, handler, htcNode) {
  this._embedType = embedType;
  this._nodeXML = nodeXML;
  this._replaceMe = replaceMe;
  this._handler = handler;
  
  this._setupFlash(doc, htcNode);
}

extend(FlashInserter, {
  _setupFlash: function(doc, htcNode) {
    // determine various information we need to display this object
    var size = this._determineSize();  
    var background = this._determineBackground();
    var style = this._determineStyle();
    var className = this._determineClassName();
    
    // setup our ID; if we are embedded with a SCRIPT tag, we use the ID from 
    // the SVG ROOT tag; if we are embedded with an OBJECT tag, then we 
    // simply make the Flash have the exact same ID as the OBJECT we are 
    // replacing
    var elementID;
    if (this._embedType == 'script') {
      elementID = this._nodeXML.getAttribute('id');
      this._handler.flashID = elementID + '_flash';
    } else if (this._embedType == 'object') {
      elementID = this._replaceMe.getAttribute('id');
      this._handler.flashID = elementID;
    }
    
    // get a Flash object and insert it into our document
    var flash = this._createFlash(size, elementID, background, style, 
                                  className, doc);
    if (isIE) {
      this._insertFlashIE(flash, size, background, style, className, htcNode,
                          doc);
    } else {
      this._insertFlash(flash);
    }
    
    // wait for the Flash file to finish loading
  },
  
  /** Inserts the Flash object into the page for all non-IE browsers.
  
      @param flash Flash HTML string.
      
      @returns The Flash DOM object. */
  _insertFlash: function(flash) {
    // do a trick to turn the Flash HTML string into an actual DOM object
    // unfortunately this doesn't work on IE; on IE the Flash is immediately
    // loaded when we do div.innerHTML even though we aren't attached
    // to the document!
    var div = document.createElement('div');
    div.innerHTML = flash;
    var flashObj = div.childNodes[0];
    div.removeChild(flashObj);
    
    // at this point we have the OBJECT tag; ExternalInterface communication
    // won't work on Firefox unless we get the EMBED tag itself
    for (var i = 0; i < flashObj.childNodes.length; i++) {
      var check = flashObj.childNodes[i];
      if (check.nodeName.toUpperCase() == 'EMBED') {
        flashObj = check;
        break;
      }
    }
    // now insert the EMBED tag into the document
    this._replaceMe.parentNode.replaceChild(flashObj, this._replaceMe);
    
    return flashObj;
  },
  
  /** For SVG OBJECTs, we have to replace the OBJECT with a Flash one. We
      have to do this on IE differently than for other browsers primarily
      because as _soon_ as we call innerHTML or outerHTML with our Flash
      string control immediately leaves us and asynchronously starts 
      initializing the Flash control, so we have to do the outerHTML
      assignment last. */
  _insertFlashIE: function(flash, size, background, style, className, htcNode,
                           htcDoc) {
    if (this._embedType == 'object') {
      // Note: as _soon_ as we make this call the Flash will load, even
      // before the rest of this method has finished. The Flash can
      // therefore finish loading before anything after the next statement
      // has run, so be careful of timing bugs.
      this._replaceMe.outerHTML = flash;
    } else if (this._embedType == 'script') {
      // apply width and height
      htcNode.style.width = size.width;
      htcNode.style.height = size.height;
      
      // apply our style to the HTC node
      var rules = style.split(';');
      for (var i = 0; i < rules.length; i++) {
        var rule = rules[i].split(':');
        if (!rules[i] || rules[i].indexOf(':') == -1) {
          continue;
        }
        var propName = rule[0].replace(/^\s*|\s*$/, '');
        var propValue = rule[1].replace(/^\s*|\s*$/, '');
        htcNode.style[propName] = propValue;
      }

      // apply our class name to the HTC node
      if (className) {
        htcNode.className = className;
      }
      
      /**
        Now insert the Flash.

        We use a Behavior ViewLink trick to 'hide' this shadow content from 
        the external page, so that we don't see the Flash object in the 
        external DOM. For more details on ViewLinks: 

        http://msdn.microsoft.com/en-us/library/ms531428(VS.85).aspx

        Note, though, that we want to keep almost all of our SVG elements
        'lightWeight' (see the lightWeight attribute on the
        'component' tag at the top of the HTC file) because
        non-lightWeight components have performance and caching issues.
        LightWeight HTC components however can not use View Links or have
        shadow content.

        As a trick, we 'convert' our HTC into having a shadow DOM
        just for the SVG root tag by manually creating an HTML document below,
        then storing this document inside the HTC file for later retrieval.
        For the trick to work we also have to set some 'defaults'
        above at the top of the HTC file.

        This approach successfully keeps the performance benefits of
        lightWeight HTCs while being able to have shadow content that
        doesn't show up in the external DOM.
      */
      var html = htcDoc.createElement('html');
      var body = htcDoc.createElement('body');
      var div = htcDoc.createElement('div');
      body.appendChild(div);
      html.appendChild(body);
      var defaults = htcNode._getHTCDefaults();
      defaults.viewLink = html.document; // ViewLink magic
      // store doc reference for use later in _SVGSVGElement._onHTCLoaded
      // so that we can get a reference to the actual created Flash object
      this._shadowDoc = html.document;

      // if we want to allow the background of the Flash movie to be transparent
      // and 'show through' HTML elements underneath, then we need to make our
      // inner shadow document also be transparent; the line below makes this
      // magic happen 
      if (background.transparent) {
        body.style.backgroundColor = 'transparent';
      }
      
      // IE memory leaks
      html = null;
      body = null;

      // We have to use a DIV container for the Flash object; since we don't
      // want this DIV to stay around, acting almost like a DocumentFragment,
      // we use div.outerHTML on it to have the Flash control go into it and
      // have the DIV 'disappear' in a poof of smoke

      // outerHTML must be set _after_ DIV is added to DOM for
      // Flash ExternalInterface to work correctly

      // Note: as _soon_ as we make this call the Flash will load, even
      // before the rest of this method has finished. The Flash can
      // therefore finish loading before anything after the next statement
      // has run, so be careful of timing bugs. We do it on a slight
      // timeout; if we don't, the Flash will incorrectly start executing
      // immediately and the rest of our SVG on the page won't be rendered!
      // If we do it on a timeout this execution happens away from our 
      // primary program flow here.
      (function(div, flash) {
          window.setTimeout(function() {
            div.outerHTML = flash;
        
            // IE memory leaks
            div = null;
          }, 1);
      })(div, flash); // closure magic to prevent IE memory leaks
    }
  },
  
  /** Determines a width and height for the parsed SVG XML. Returns an
      object literal with two values, width and height. */
  _determineSize: function() {
    var width = '100%', height = '100%';
    
    // explicit sizing information on an SVG OBJECT overrides everything else
    if (this._embedType == 'object' && this._replaceMe.getAttribute('width')) {
      width = this._replaceMe.getAttribute('width');
      // store the explicit width to pass to Flash later to help with viewBox
      // sizing
      this._handler._explicitWidth = width;
    }
    if (this._embedType == 'object' && this._replaceMe.getAttribute('height')) {
      height = this._replaceMe.getAttribute('height');
      // store the explicit height to pass to Flash later to help with viewBox
      // sizing
      this._handler._explicitHeight = height;
    }
    
    if (width && width != '100%' && height && height != '100%') {
      return {width: width, height: height};
    }
    
    var xmlWidth = this._nodeXML.getAttribute('width');
    var xmlHeight = this._nodeXML.getAttribute('height');
    
    // explicit width and height set
    if (xmlWidth) {
      width = xmlWidth;
    }
    
    if (xmlHeight) {
      height = xmlHeight;
    }
    
    // both explicit width and height set; we are done
    if (xmlWidth && xmlWidth.indexOf('%') == -1
        && xmlHeight && xmlHeight.indexOf('%') == -1) {
      return {width: width, height: height};
    }
    
    // viewBox
    if (this._nodeXML.getAttribute('viewBox')) {
      var viewBox = this._nodeXML.getAttribute('viewBox').split(/\s+|,/);
      var boxX = viewBox[0];
      var boxY = viewBox[1];
      var boxWidth = viewBox[2];
      var boxHeight = viewBox[3];
      width = boxWidth - boxX;
      height = boxHeight - boxY;
    }

    return {width: width, height: height};      
  },
  
  /** Determines the background coloring. Returns an object literal with
      two values, 'color' with a color or null and 'transparent' with a 
      boolean. */
  _determineBackground: function() {
    var transparent = false;
    var color = null;
    
    // NOTE: CSS 2.1 spec says background does not get inherited, and we don't
    // support external CSS style rules for now; we also only support
    // 'background-color' property and not 'background' CSS property for
    // setting the background color.
    var style = this._nodeXML.getAttribute('style');
    if (style && style.indexOf('background-color') != -1) {
      var m = style.match(/background\-color:\s*([^;]*)/);
      if (m) {
        color = m[1];
      }
    }

    if (color === null) {
      // no background color specified
      transparent = true;
    }
    
    return {color: color, transparent: transparent};
  },
  
  /** Determines what the style should be on the SVG root element, copying
      over any styles the user has placed inline and defaulting certain
      styles. We will bring these over to the Flash object.
      
      @returns Style string ready to copy over to Flash object. */
  _determineStyle: function() {
    var style = this._nodeXML.getAttribute('style');
    if (!style) {
      style = '';
    }
    
    // SVG spec says default display value for SVG root element is 
    // inline
    if (this._embedType == 'script' && style.indexOf('display:') == -1) {
      style += 'display: inline;';
    }
    
    // SVG spec says SVG by default should have overflow: none
    if (this._embedType == 'script' && style.indexOf('overflow:') == -1) {
      style += 'overflow: hidden;';
    }
    
    return style;
  },
  
  /** Determines a class name for the Flash object; we simply copy over
      any class names on the SVG root object to aid in external styling.
      
      @returns Class name string. Returns '' if there is none. */
  _determineClassName: function() {
    var className = this._nodeXML.getAttribute('class');
    if (!className) {
      return 'embedssvg';
    } else {
      return className + ' embedssvg';
    }
  },
  
  /** Creates a Flash object that embeds the Flash SVG Viewer.

      @param size Object literal with width and height.
      @param elementID The ID of either the SVG ROOT object or of an
      SVG OBJECT.
      @param background Object literal with background color and 
      transparent boolean.
      @param style Style string to copy onto Flash object.
      @param className The class name to copy into the Flash object.
      @param doc Either 'document' or element.document if being called
      from the Microsoft Behavior HTC. 
      
      @returns Flash object as HTML string. */ 
  _createFlash: function(size, elementID, background, style, className, doc) {
    var flashVars = 
          'uniqueId=' + encodeURIComponent(elementID)
        + '&sourceType=string'
        + '&scaleMode=showAll_svg' // FIXME: is this the right scaleMode?
        + '&debug=true'
        + '&svgId=' + encodeURIComponent(elementID);
    var src = svgweb.libraryPath + 'svg.swf';
    var protocol = window.location.protocol;
    if (protocol.charAt(protocol.length - 1) == ':') {
      protocol = protocol.substring(0, protocol.length - 1);
    }

    var flash =
          '<object\n '
            + 'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"\n '
            + 'codebase="'
            + protocol
            + '://fpdownload.macromedia.com/pub/shockwave/cabs/flash/'
            + 'swflash.cab#version=9,0,0,0"\n '
            + 'width="' + size.width + '"\n '
            + 'height="' + size.height + '"\n '
            + 'id="' + this._handler.flashID + '"\n '
            + 'name="' + this._handler.flashID + '"\n '
            + 'style="' + style + '"\n '
            + 'class="' + className + '"\n '
            + '>\n '
            + '<param name="allowScriptAccess" value="always"></param>\n '
            + '<param name="movie" value="' + src + '"></param>\n '
            + '<param name="quality" value="high"></param>\n '
            + '<param name="FlashVars" value="' + flashVars + '"></param>\n '
            + (background.color ? '<param name="bgcolor" value="' 
                                    + background.color + '"></param>\n ' : '')
            + (background.transparent ? 
                                    '<param name="wmode" value="transparent">'
                                    + '</param>\n ' : '')
            + '<embed '
              + 'src="' + src + '" '
              + 'quality="high" '
              + (background.color ? 'bgcolor="' + background.color 
                                     + '" \n' : '')
              + (background.transparent ? 'wmode="transparent" \n' : '')
              + 'width="' + size.width + '" '
              + 'height="' + size.height + '" '
              + 'id="' + this._handler.flashID + '" '
              + 'name="' + this._handler.flashID + '" '
              + 'swLiveConnect="true" '
              + 'allowScriptAccess="always" '
              + 'type="application/x-shockwave-flash" '
              + 'FlashVars="' + flashVars + '" '
              + 'pluginspage="'
              + protocol
              + '://www.macromedia.com/go/getflashplayer" '
              + 'style="' + style + '"\n '
              + 'class="' + className + '"\n '
              + ' />'
          + '</object>';

    return flash;
  }
});


/** SVG Root element.

    @param nodeXML A parsed XML node object that is the SVG root node.
    @param svgString The full SVG as a string. Null if this SVG root
    element is being embedded by an SVG OBJECT.
    @param scriptNode The script node that contains this SVG. Null if this
    SVG root element is being embedded by an SVG OBJECT.
    @param handler The FlashHandler that we are a part of. */
function _SVGSVGElement(nodeXML, svgString, scriptNode, handler) {
  // superclass constructor
  _Element.apply(this, ['svg', null, svgns, nodeXML, handler, true]);
  
  this._nodeXML = nodeXML;
  this._svgString = svgString;
  this._scriptNode = scriptNode;
  
  // add to our nodeByID lookup table so that fetching this node in the
  // future works
  if (this._handler.type == 'script') {
    var rootID = this._nodeXML.getAttribute('id');
    var doc = this._handler.document;
    doc._nodeById['_' + rootID] = this;
  }
  
  // when being embedded by a SCRIPT element, the _SVGSVGElement class
  // takes over inserting the Flash and HTC elements so that we have 
  // something visible on the screen; when being embedded by an SVG OBJECT
  // we don't do this since the OBJECT tag itself is what is visible on the 
  // screen
  if (isIE && this._handler.type == 'script') {
    // for IE, replace the SCRIPT tag with our SVG root element; this is so
    // that we can kick off the HTC running so that it can insert our Flash
    // as a shadow DOM
    var svgDOM = document.createElement('svg:svg');
    svgDOM._fakeNode = this;
    svgDOM._handler = handler;
    
    // store the real parentNode and sibling info so we can return it; calling
    // svgDOM.parentNode, for example, would cause us to recursively call our
    // magic parentNode getter instead, so we store this
    svgDOM._realParentNode = scriptNode.parentNode;
    svgDOM._realPreviousSibling = scriptNode.previousSibling;
    svgDOM._realNextSibling = scriptNode.nextSibling;
    
    this._htcNode = svgDOM;
    
    // track .style changes
    this.style = new _Style(this);
    
    // find out when the content is ready
    // NOTE: we do this here instead of inside the HTC file using an
    // internal oncontentready event in order to make the HTC file faster
    // and use less memory. Note also that 'oncontentready' is not available 
    // outside HTC files, only 'onreadystatechange' is available.
    this._readyStateListener = hitch(this, this._onHTCLoaded); // cleanup later
    this._htcNode.attachEvent('onreadystatechange', this._readyStateListener);
    
    // now kick off replacing the SCRIPT node with a Flash object
    scriptNode.parentNode.replaceChild(svgDOM, scriptNode);
    
    // now wait for the HTC file to load for the SVG root element
  } else if (!isIE && this._handler.type == 'script') { 
    // non-IE browsers; immediately insert the Flash
    this._inserter = new FlashInserter('script', document, this._nodeXML,
                                       this._scriptNode, this._handler);
  }
}  

// subclasses _Element
_SVGSVGElement.prototype = new _Element;

extend(_SVGSVGElement, {
  // SVGSVGElement
  
  // NOTE: there are properties and methods from SVGSVGElement not defined 
  // or implemented here; see
  // http://www.w3.org/TR/SVG/struct.html#InterfaceSVGSVGElement
  // for full list
  
  // TODO: Implement the functions below
  
  suspendRedraw: function(max_wait_milliseconds /* unsigned long */) 
                                                        /* unsigned long */ {},
  unsuspendRedraw: function(suspend_handle_id /* unsigned long */) /* void */
                                                /* throws DOMException */ {},
  unsuspendRedrawAll: function() /* void */ {},
  forceRedraw: function() /* void */ {},
  
  // end SVGSVGElement
  
  // SVGLocatable
  
  // TODO: Implement the following properties
  
  nearestViewportElement: null, /* readonly SVGElement */
  farthestViewportElement: null, /* readonly SVGElement */
  
  // TODO: Implement the following methods
  
  getBBox: function() /* SVGRect */ {},
  getCTM: function() /* SVGMatrix */ {},
  getScreenCTM: function() /* SVGMatrix */ {},
  getTransformToElement: function(element /* SVGElement */) /* SVGMatrix */ {
    /* throws SVGException */
  },
  
  // end of SVGLocatable
  
  /** Called when the Microsoft Behavior HTC file is loaded. */
  _onHTCLoaded: function() {
    //console.log('onHTCLoaded');
    
    // cleanup our event handler
    this._htcNode.detachEvent('onreadystatechange', this._readyStateListener);

    // get the document object _inside_ the HTC
    var elemDoc = this._htcNode._getHTCDocument();
    
    // now insert our Flash
    this._inserter = new FlashInserter('script', elemDoc, this._nodeXML,
                                       this._scriptNode, this._handler,
                                       this._htcNode);
                           
    // pay attention to style changes now in the HTC
    this.style._ignoreStyleChanges = false;
    
    // TODO: we are not handling dynamically created nodes yet
  },
  
  /** Called when the Flash SWF file has been loaded. Note that this doesn't
      include the SVG being rendered -- at this point we haven't even
      sent the SVG to the Flash file for rendering yet. */
  _onFlashLoaded: function(msg) {
    // the Flash object is done loading
    //console.log('_onFlashLoaded');
    
    // store a reference to the Flash object so we can send it messages
    if (isIE) {
      // use the shadow document we created earlier 
      // in FlashInserter._insertFlashIE() to get a reference to our Flash
      this._handler.flash = 
                this._inserter._shadowDoc.getElementById(this._handler.flashID);
      
      // IE memory leaks
      this._inserter._shadowDoc = null;
      this._inserter = null;
      
      // now make the Flash callable
      this._makeFlashCallable(this._handler.flash);
    } else {
      this._handler.flash = document.getElementById(this._handler.flashID);
    }
    
    // send the SVG over to Flash now
    this._handler.sendToFlash({ type: 'load', 
                                sourceType: 'string',
                                svgString: this._svgString,
                                objectURL: this._getRelativeTo(),
                                pageURL: this._getRelativeTo(),
                                ignoreWhiteSpace: true });
  },
  
  /** The Flash is finished rendering. */
  _onRenderingFinished: function(msg) {
    //console.log('onRenderingFinished');
    
    if (!isIE && this._handler.type == 'script') {
      // expose the root SVG element as 'documentElement' on the EMBED tag
      // for SVG SCRIPT embed as a utility property for developers to descend
      // down into the SVG root tag
      // (see Known Issues and Errata for details)
      this._handler.flash.documentElement = this;
    }
    
    var elementId = this._nodeXML.getAttribute('id');
    this._handler.fireOnLoad(elementId, 'script');
  },
  
  /** For Internet Explorer; makes calling ExternalInterface functions on the 
      Flash object work. */
  _makeFlashCallable: function(flash) {
    // if we use the Behavior ViewLink trick to 'hide' the Flash object
    // from the external page's DOM (see FlashInserter._insertFlashIE for
    // the SCRIPT embedType), then Flash's ExternalInterface
    // doesn't work correctly. That's ok, we can fix this with some
    // tricks from Dojo Flash. More details on these
    // hidden Flash methods here:
    // http://codinginparadise.org/weblog/2006/02/how-to-speed-up-flash-8s.html
    flash.sendToFlash = (function() {
      return function() {
        return eval(this.CallFunction(
                      "<invoke name=\"sendToFlash\" returntype=\"javascript\">" 
                      + __flash__argumentsToXML(arguments, 0) + "</invoke>"));
      };
    })(); // IE memory leaks
  },
  
  /** Relative URLs inside of SVG need to expand against something (i.e.
      such as having an SVG Audio tag with a relative URL). This method
      figures out what that relative URL should be. We send this over to
      Flash when rendering things so Flash knows what to expand against. */
  _getRelativeTo: function() {
    var results = '';
    var pathname = window.location.pathname.toString();
    if (pathname && pathname.length > 0 && pathname.indexOf('/') != -1) {
      // snip off any filename after a final slash
      results = pathname.replace(/\/([^/]*)$/, '/');
    }
    
    return results;
  }
});


/** Represent a Document object for manipulating the SVG document.

    @param xml Parsed XML for the SVG.
    @param handler The FlashHandler this document is a part of. */
function _Document(xml, handler) {
  // superclass constructor
  _Node.apply(this, ['#document', _Node.DOCUMENT_NODE, null, null, 
                     xml, handler], svgns);
  this._xml = xml;
  this._handler = handler;
  this._nodeById = {};
  this._namespaces = this._getNamespaces();
  this.implementation = new _DOMImplementation();
  if (this._handler.type == 'script') {
    this.defaultView = window;
  } else if (this._handler.type == 'object') {
    // we set the document.defaultView in _SVGObject._executeScript() once
    // we create the iframe that we execute our script into
  }
}

// subclasses _Node
_Document.prototype = new _Node;

extend(_Document, {
  /** Stores a lookup from a node's ID to it's _Element or _Node 
      representation. An object literal. */
  _nodeById: null,
  
  /*
    Note: technically these 2 properties should be read-only and throw 
    a _DOMException when set. For simplicity we make them simple JS
    properties; if set, nothing will happen. Also note that we don't
    support the 'doctype' property.
  */
  implementation: null,
  documentElement: null,
  
  createElementNS: function(ns, qname) /* _Element */ {
    var prefix = this._namespaces['_' + ns];
    
    if (prefix == 'xmlns' || !prefix) { // default SVG namespace
      prefix = null;
    }

    var node = new _Element(qname, prefix, ns);
    
    return node._getProxyNode();
  },
  
  createTextNode: function(data /* DOM Text Node */) /* _Node */ {
    // We create a DOM Element node to represent this text node. We do this
    // so that we can track the text node over time to register changes to
    // it and so on. We must use a DOM Element node so that we have access
    // to the setAttribute method in order to store data on the XML DOM node.
    // This is due to a limitation on Internet Explorer where you can not
    // store 'expandos' on XML node objects (i.e. you can't add custom
    // properties). We store the actual data as a DOM Text Node of our DOM
    // Element. Note that since we have no handler yet we simply use a default
    // XML document object (_unattachedDoc) to create things for now.
    var doc = FlashHandler._unattachedDoc;
    var nodeXML;
    if (isIE) { // no createElementNS available
      nodeXML = doc.createElement('__text');
    } else {
      nodeXML = doc.createElementNS(svgnsFake, '__text');
    }
    nodeXML.appendChild(doc.createTextNode(data));
    var textNode = new _Node('#text', _Node.TEXT_NODE, null, null, nodeXML,
                             this._handler);
    textNode._nodeValue = data;
    textNode.ownerDocument = this;
    
    return textNode._getProxyNode();
  },
  
  getElementById: function(id) /* _Element */ {
    // XML parser does not have getElementById, due to id mapping in XML
    // issues; use XPath instead
    var results = xpath(this._xml, null, '//*[@id="' + id + '"]');

    var nodeXML, node;
    
    if (results.length) {
      nodeXML = results[0];
    } else {
      return null;
    }
    
    // create or get an _Element for this XML DOM node for node
    node = FlashHandler._getNode(nodeXML, this._handler);
    node._passThrough = true;
    return node;
  },
  
  /** NOTE: on IE we don't support calls like the following:
      getElementsByTagNameNS(*, 'someTag');
      
      We do support:
      getElementsByTagNameNS('*', '*');
      getElementsByTagNameNS('someNameSpace', '*');
      getElementsByTagNameNS(null, 'someTag');
  */
  getElementsByTagNameNS: function(ns, localName) /* _NodeList of _Elements */ {
    //console.log('document.getElementsByTagNameNS, ns='+ns+', localName='+localName);
    var results = createNodeList();
    var matches;
    // DOM Level 2 spec details:
    // if ns is null or '', return elements that have no namespace
    // if ns is '*', match all namespaces
    // if localName is '*', match all tags in the given namespace
    if (ns == '') {
      ns = null;
    }
    
    // we internally have to mess with the SVG namespace a bit to avoid
    // an issue with Firefox and Safari
    if (ns == svgns) {
      ns = svgnsFake;
    }

    // get DOM nodes with the given tag name
    if (this._xml.getElementsByTagNameNS) { // non-IE browsers
      results = this._xml.getElementsByTagNameNS(ns, localName);
    } else { // IE
      // we use XPath instead of xml.getElementsByTagName because some versions
      // of MSXML have namespace glitches with xml.getElementsByTagName
      // (Issue 183: http://code.google.com/p/svgweb/issues/detail?id=183)
      
      // figure out prefix
      var prefix = 'xmlns';
      if (ns && ns != '*') {
        prefix = this._namespaces['_' + ns];
        
        if (prefix === undefined) {
          return createNodeList(); // empty []
        }
      }
      
      // determine correct xpath query
      var query;
      if (ns == '*' && localName == '*') {
        query = '//*';
      } else if (ns == '*') {
        query = "//*[namespace-uri()='*' and local-name()='" + localName + "']";
      } else if (localName == '*') {
        query = "//*[namespace-uri()='" + ns + "']";
      } else {
        // Wonderful IE bug: some versions of MSXML don't seem to 'see'
        // the default XML namespace with XPath, forcing you to pretend like 
        // an element has no namespace: //circle
        // _Other_ versions of MSXML won't work like this, and _do_ see the
        // default namespace, forcing you to fully specify it:
        // //*[namespace-uri()='http://my-namespace' and local-name()='circle']
        // To accomodate these we run both and use an XPath Union Operator
        // to combine the results
        query = "//" + localName 
                + " | //*[namespace-uri()='" + ns + "' and local-name()='" 
                + localName + "']";
      }

      matches = xpath(this._xml, null, query, this._namespaces);
      if (matches !== null && matches !== undefined && matches.length > 0) {
        for (var i = 0; i < matches.length; i++) {
          results.push(matches[i]);
        }
      }
    }
    
    // now create or fetch _Elements representing these DOM nodes
    var nodes = createNodeList();
    for (var i = 0; i < results.length; i++) {
      var elem = FlashHandler._getNode(results[i], this._handler);
      elem._passThrough = true;
      nodes.push(elem);
    }
    
    return nodes;
  },
  
  // Note: createDocumentFragment, createComment, createCDATASection,
  // createProcessingInstruction, createAttribute, createEntityReference,
  // importNode, createElement, getElementsByTagName,
  // createAttributeNS not supported
  
  /** Extracts any namespaces we might have, creating a prefix/namespaceURI
      lookup table.
      
      NOTE: We only support namespace declarations on the root SVG node
      for now.
      
      @returns An object that associates prefix to namespaceURI, and vice
      versa. */
  _getNamespaces: function() {
    var results = [];
    var attrs = this._xml.documentElement.attributes;
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      if (/^xmlns:?(.*)$/.test(attr.nodeName)) {
        var m = attr.nodeName.match(/^xmlns:?(.*)$/);
        var prefix = (m[1] ? m[1] : 'xmlns');
        var namespaceURI = attr.nodeValue;
                
        // don't add duplicates
        if (!results['_' + prefix]) {
          results['_' + prefix] = namespaceURI;
          results['_' + namespaceURI] = prefix;
          results.push(namespaceURI);
        }
      }
    }
    
    return results;
  }
});


// We don't create a NodeList class due to the complexity of subclassing
// the Array object cross browser. Instead, we simply patch in the item()
// method to a normal Array object
function createNodeList() {
  var results = [];
  results.item = function(i) {
    if (i >= this.length) {
      return null; // DOM Level 2 spec says return null
    } else {
      return this[i];
    }
  }
  
  return results;
}


// We don't have an actual DOM CharacterData type for now. We just return
// a String object with the 'data' property patched in, since that is what
// is most commonly accessed
function createCharacterData(data) {
  var results = (data !== undefined) ? new String(data) : new String();
  results.data = results.toString();
  return results;
}

// End DOM Level 2 Core/Events support

// SVG DOM interfaces

// Note: where the spec returns an SVGNumber or SVGString we just return
// the JavaScript base type instead. Note that in general also instead of
// returning the many SVG List types, such as SVGPointList, we just
// return standard JavaScript Arrays. For SVGAngle we also
// just return a JS Number for now.

function _SVGMatrix(a /** All Numbers */, b, c, d, e, f) {
  this.a = a; this.b = b; this.c = c; this.d = d; this.e = e; this.f = f;
}

extend(_SVGMatrix, {
  // all functions return _SVGMatrix

  // TODO: Implement the following methods
  
  multiply: function(secondMatrix /* _SVGMatrix */ ) {},
  inverse: function() {},
  translate: function(x /* Number */, y /* Number */) {},
  scale: function(scaleFactor /* Number */) {},
  scaleNonUniform: function(scaleFactorX /* Number */, scaleFactorY /* Number */) {},
  rotate: function(angle /* Number */) {},
  rotateFromVector: function(x, y) {},
  flipX: function() {},
  flipY: function() {},
  skewX: function(angle) {},
  skewY: function(angle) {}
});


// Note: Most of the functions on SVGLength not supported for now
function _SVGLength(/* Number */ value) {
  this.value = value;
}


// Note: We only support _SVGAnimatedLength because that is what Firefox
// and Safari return, and we want to have parity. Only baseVal works for now
function _SVGAnimatedLength(/* _SVGLength */ value) {
  this.baseVal = value;
  this.animVal = undefined; // not supported for now
}


function _SVGTransform(type, matrix, angle) {
  this.type = type;
  this.matrix = matrix;
  this.angle = angle;
}

mixin(_SVGTransform, {
  SVG_TRANSFORM_UNKNOWN: 0, SVG_TRANSFORM_MATRIX: 1, SVG_TRANSFORM_TRANSLATE: 2,
  SVG_TRANSFORM_SCALE: 3, SVG_TRANSFORM_ROTATE: 4, SVG_TRANSFORM_SKEWX: 5,
  SVG_TRANSFORM_SKEWY: 6
});

extend(_SVGTransform, {
  // Note: the following 3 should technically be readonly
  type: null, /* one of the constants above */
  matrix: null, /* _SVGMatrix */
  angle: null, /* float */
  
  // TODO: Implement the following methods
  
  setMatrix: function(matrix /* SVGMatrix */) {},
  setTranslate: function(tx /* float */, ty /* float */) {},
  setScale: function(sx /* float */, sy /* float */) {},
  setRotate: function(angle /* float */, cx /* float */, cy /* float */) {},
  setSkewX: function(angle /* float */) {},
  setSkewY: function(angle /* float */) {}  
});


// the following just return object literals or other basic
// JS types for simplicity instead of having full classes

// SVGRect
function createSVGRect(x /* float */, y /* float */, width /* float */, 
                     height /* float */) {
  return {x: parseFloat(x), y: parseFloat(y), 
          width: parseFloat(width), height: parseFloat(height)};
}


// SVGPoint
function createSVGPoint(x /* Number */, y /* Number */) { 
  return {x: Number(x), y: Number(y)};
  
  // Note: matrixTransform method not supported
}

// end SVG DOM interfaces

/* 
  Other DOM interfaces specified by SVG 1.1:
  
  * SVG 1.1 spec requires DOM 2 Views support, which we do not implement:
    http://www.w3.org/TR/DOM-Level-2-Views/

  * SVG 1.1 spec has the DOM traversal and range APIs as optional; these are
    not supported

  * Technically we need to support certain DOM Level 2 CSS interfaces:
    http://www.w3.org/TR/DOM-Level-2-Style/css.html
    We support some (anything that should be on an SVG Element), 
    but the following interfaces are not supported:
    CSSStyleSheet, CSSRuleList, CSSRule, CSSStyleRule, CSSMediaRule,
    CSSFontFaceRule, CSSPageRule, CSSImportRule, CSSCharsetRule,
    CSSUnknownRule, CSSStyleDeclaration, CSSValue, CSSPrimitiveValue,
    CSSValueList, RGBColor, Rect, Counter, ViewCSS (getComputedStyle),
    DocumentCSS, DOMImplementationCSS, none of the CSS 2 Extended Interfaces
    
  * There are many SVG DOM interfaces we don't support
*/

window.svgweb = new SVGWeb(); // kicks things off

// hide internal implementation details inside of a closure
})();