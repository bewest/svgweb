// TODO: replace these with JSUnit's assert functions

function assertEquals(comment, expected, actual) {
  // halt if a Flash error has occurred asynchronously
  if (_flashError) {
    throw new Error('Halting due to Flash error');
  }
  
  if (printAsserts) {
    console.log("assertEquals('" + comment + "', " + expected + ", "
                + actual + ")");
  }
  
  if (expected != actual) {    
    var msg = 'assertEquals Failed: ' + comment 
              + '\n(expected: ' + expected
              + ', actual: ' + actual + ')';
    console.log(msg);
    throw new Error(msg);
  }
}

/** Tests the 'actual' value to see if it matches any of the values
    provided by the expectedArray. Only one is needed for the assertion
    to pass. */
function assertEqualsAny(comment, expectedArray, actual) {
  // halt if a Flash error has occurred asynchronously
  if (_flashError) {
    throw new Error('Halting due to Flash error');
  }
  
  var expected = expectedArray.join(' or ');
  
  if (printAsserts) {
    console.log("assertEquals('" + comment + "', " + expected + ", "
                + actual + ")");
  }
  
  var matches = false;
  for (var i = 0; i < expectedArray.length; i++) {
    if (expectedArray[i] == actual) {
      matches = true;
      break;
    }
  }
  
  if (!matches) {
    var msg = 'assertEquals Failed: ' + comment 
              + '\n(expected: ' + expected
              + ', actual: ' + actual + ')';
    console.log(msg);
    throw new Error(msg);
  }
}

function assertExists(comment, actual) {
  // halt if a Flash error has occurred asynchronously
  if (_flashError) {
    throw new Error('Halting due to Flash error');
  }
  
  if (printAsserts) {
    console.log("assertExists('" + comment + "', " + actual + ")");
  }
  
  if (actual === null || actual === undefined) {
    var msg = 'assertExists failed: ' + comment 
              + '\n(actual: ' + actual + ')';
    console.log(msg);
    throw new Error(msg);
  }
}

function assertNotExists(comment, actual) {
  // halt if a Flash error has occurred asynchronously
  if (_flashError) {
    throw new Error('Halting due to Flash error');
  }
  
  if (printAsserts) {
    console.log("assertNotExists('" + comment + "', " + actual + ")");
  }
  
  if (!actual === null && !actual === undefined) {
    var msg = 'assertNotExists failed: ' + comment 
              + '\n(actual: ' + actual + ')';
    console.log(msg);
    throw new Error(msg);
  }
}

function assertNull(comment, actual) {
  // halt if a Flash error has occurred asynchronously
  if (_flashError) {
    throw new Error('Halting due to Flash error');
  }
  
  if (printAsserts) {
    console.log("assertNull('" + comment + "', " + actual + ")");
  }
  
  if (actual !== null) {
    var msg = 'assertNull failed: ' + comment 
              + '\n(actual: ' + actual + ')';
    console.log(msg);
    throw new Error(msg);
  }
}

function assertUndefined(comment, actual) {
  // halt if a Flash error has occurred asynchronously
  if (_flashError) {
    throw new Error('Halting due to Flash error');
  }
  
  if (printAsserts) {
    console.log("assertUndefined('" + comment + "', " + actual + ")");
  }
  
  if (actual !== undefined) {
    var msg = 'assertUndefined failed: ' + comment 
              + '\n(actual: ' + actual + ')';
    console.log(msg);
    throw new Error(msg);
  }
}

function assertFailed(msg) {
  console.log('assertFailed: ' + msg);
  throw new Error(msg);
}

function assertTrue(comment, expression) {
  // halt if a Flash error has occurred asynchronously
  if (_flashError) {
    throw new Error('Halting due to Flash error');
  }
  
  if (printAsserts) {
    console.log("assertTrue('" + comment + "', " + expression + ")");
  }
  
  if (expression === false) {    
    var msg = 'assertTrue Failed: ' + comment 
              + '\n(expression value: ' + expression + ')';
    console.log(msg);
    throw new Error(msg);
  }
}

function assertFalse(comment, expression) {
  // halt if a Flash error has occurred asynchronously
  if (_flashError) {
    throw new Error('Halting due to Flash error');
  }
  
  if (printAsserts) {
    console.log("assertFalse('" + comment + "', " + expression + ")");
  }
  
  if (expression === true) {    
    var msg = 'assertFalse Failed: ' + comment 
              + '\n(expression value: ' + expression + ')';
    console.log(msg);
    throw new Error(msg);
  }
}

/** Gets a document object using the given ID. Useful so that we can
    test our functions across either the standard global document object
    or the document object inside of an SVG file embedded using OBJECT tag.
    
    @param ID The ID of either the SVG root element or the SVG OBJECT tag.
    We make these the same to ease testing. */
function getDoc(id) {
  if (_hasObjects) {
    return document.getElementById(id).contentDocument;
  } else {
    return document;
  }
}

/** Gets the root document element using the given ID. Useful so that we can
    test our functions across either the standard global document object
    or the document object inside of an SVG file embedded using OBJECT tag.
    
    @param ID The ID of either the SVG root element or the SVG OBJECT tag.
    We make these the same to ease testing. */
function getRoot(id) {
  if (_hasObjects) {
    return getDoc(id).documentElement;
  } else {
    return document.getElementById(id);
  }
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

/** Fetches the given URL using a synchronous XHR request.

    @param url The URL to grab.
    @param returnText Boolean flag. If true, we return text. If false, we
    return the responseXML value from the XHR object. Defaults to true if
    left off. */
function fetchURL(url, returnText) {
  if (returnText === undefined) {
    returnText = true;
  }
  var req = xhrObj();
  
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
  
  // do things synchronously to simplify testing
  req.open('GET', url, false);
  req.send(null);
  
  return (returnText) ? req.responseText : req.responseXML;
}

/** Parses the given XML string and returns the document object.

    @param xml XML String to parse.
    
    @returns XML DOM document node.
*/
function parseXML(xml) {  
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
      xmlDoc.preserveWhiteSpace = true;
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