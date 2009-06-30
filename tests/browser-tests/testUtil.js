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