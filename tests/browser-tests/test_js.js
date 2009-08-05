// if true, we print out each assertion as we run them; helps with
// identifying where an assertion failed by printing the ones before it
var printAsserts = false;

// used to record whether a Flash error has occurred asynchronously
// so we can halt testing and report the failure
var _flashError = false;

// if true, the page has SVG OBJECTs; if false then there are none and all
// the SVG is directly embedded into the page using SCRIPT blocks
var _hasObjects = false;

// add a hook so we can ensure that our SVG OBJECT tags truly load
var objectLoaded = [false, false, false];
svgweb._objectLoaded = function(position) {
  objectLoaded[position] = true;
};

// a variable that embed2.svg accesses to make sure that multiple onload
// listeners added in different ways run in the right order
svgweb._embedOnloads = [];

// a method that embed2.svg calls after all of its onloads have fired to
// make sure things ran correctly
svgweb._validateOnloadsCalled = false;
svgweb._validateOnloads = function() {
  // make sure that the 4 onload listeners in embed2.svg got called
  // and in the right order
  assertEquals('embeds2.svg should have had 4 onload functions fire',
               4, svgweb._embedOnloads.length);
  assertEquals('1st onload in embeds2.svg should be "1"', 1, 
               svgweb._embedOnloads[0]);
  assertEquals('2nd onload in embeds2.svg should be "2"', 2,
               svgweb._embedOnloads[1]);
  assertEquals('3rd onload in embeds2.svg should be "3"', 3,
               svgweb._embedOnloads[2]);
  assertEquals('4th onload in embeds2.svg should be "4"', 4,
               svgweb._embedOnloads[3]);
               
  // make sure that embeded objects' onload listeners get called before us;
  // at this point, window._objectsLoadedFirst should have been set to _true_
  // by one of the embed*.svg files
  assertTrue('window._objectsLoadedFirst == false', window._objectsLoadedFirst);
               
  svgweb._validateOnloadsCalled = true;
};

// a variable that we use to make sure that the different ways we listen
// for the onload event when dynamically creating SVG OBJECT tags works
svgweb._dynamicObjOnloads = 0;

// a global variable that we set to ensure we don't incorrectly see it
// over in embed2; checked in testScope() inside of embed2.svg
var shouldNotClash = 'set globally in test_js.js';

// a global function we define to ensure that it doesn't clash with local
// functions in our SVG files; checked in testScope() inside of embed2.svg
var globalFunction = function() { return 'returned from test_js.js'; };

// a flag we set on our window object; we compare this inside of our embed2.svg
// tests to ensure we have a separate, independent window object 
// inside testScope()
window._outerWindow = true;

// A variable that the embed1.svg, embed2.svg, etc. files try to set from
// their onload listeners. The correct order is that embeded's objects should 
// onload first, followed by the page-level onload.
window._objectsLoadedFirst = false;

// two flags we create so that testIncorrectConversions() inside of 
// of embed2.svg can make sure that we can correctly access this top-level
// document and window
document._topLevel = true;
window._topLevel = true;

// we store a reference to the outer window and document objects to help
// with testing inside of embed2.svg inside of testHostObjects()
window._topWindow = window;
window._topDocument = document;

// a data structure that we use to test making sure that adding event listeners
// for the onload event fires in the correct order
window._pageLoadedListeners = [];

var sodipodi_ns = 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd';
var dc_ns = "http://purl.org/dc/elements/1.1/";
var rdf_ns = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
var cc_ns = "http://web.resource.org/cc/";

var myRect, mySVG, rects, sodipodi, rdf, div, dc, bad, root, rect, 
    path, gradient, group, group2, child, whitespaceAreNodes, metadata,
    cc, svg, svgText, textNode, text, desc, title, format, type,
    className, htmlTitle, head, circle, lengthBefore, matches, temp,
    stop, defs, parent, textNode2, renderer,
    origText, exp, html, ns, nextToLast, paths, styleStr,
    image, images, line, doTests, styleReturned, use, regExp, split, doc,
    orig, rect1, rect2, obj1, obj2, obj3, handler, elem, suspendID1,
    suspendID2, i, anim;
    
var allStyles = [
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

function runTests(embedTypes) {
  // TODO: Refactor this to use JSUnit instead of our own custom assertion 
  // methods
  
  // did we embed any of the SVG using OBJECTs?
  if (embedTypes['mySVG'] == 'object' || embedTypes['svg2'] == 'object'
      || embedTypes['svg11242'] == 'object') {
    _hasObjects = true;
  }
  
  // override svgweb._fireFlashError so we can know when errors
  // have occurred
  svgweb._fireFlashError = function(logMessage) {
    _flashError = true;
    assertFailed(logMessage);
  };
  
  // make sure renderer string gets set
  renderer = svgweb.getHandlerType();
  assertTrue('renderer == native || flash',
              renderer == 'native' 
              || renderer == 'flash');
              
  console.log('Running suite of page-level tests');
              
  if (_hasObjects) {
    testScope();
  }
  
  testContentDocument();
  testGetElementById();  
  testGetElementsByTagNameNS();
  testSVGSVGElementProperties();
  testSVGUseElementProperties();
  testGetAttribute();
  testSetAttribute();
  testChildNodes();
  testOwnerDocument();
  testTextNodes();
  testDOMHierarchyAccessors();
  testAppendChild();
  testRemoveChild();
  testReplaceChild();
  testInsertBefore();
  testHasChildNodes();       
  testIsSupported();
  testStyle();
  testCreateSVGObject();
  testRedraw();
  testBugFixes();
  
  // TODO: Test setAttributeNS, hasChildNodes, removeAttribute
  
  // TODO: Create tests for svgweb.removeChild for removing SVG OBJECTs
  
  // TODO: Test dynamically creating an SVG root
  
  // TODO: Test having a dynamically created SVG root that is nested
  // in some dynamically created HTML, such as a DIV
  
  // TODO: Test doing removeChild that removes an SVG root
                                         
  // TODO: Test every one of the SVG element types, perhaps
  // creating them dynamically and building up an image; probably
  // in another file     
  
  // TODO: Do all these tests again, but have some SVG that we
  // namespace with svg: inside of our SVG SCRIPT block  
  
  // TODO: Rename the ID of nodes (including the SVG root) and make sure
  // things propagate correctly
  
  // TODO: Create two adjacent text nodes then test text node
  // equality for nextSibling and previousSibling, which I believe
  // will currently break and is a known issue
  // (i.e. textNode1.nextSibling == textNode2.previousSibling)
  
  // TODO: Put all of this into a separate JavaScript file, then include
  // it to test it on an XHTML page, a quirks doctype, a standards
  // doctype, none, etc.; have one page with an HTML TITLE in the 
  // markup
  
  // TODO: Have some performance tests with a performance threshold
  
  // TODO: Have tests where we pass in various kinds of invalid values:
  // Have tests where we pass in null, undefined, and non-DOM
  // or internal _Node or _Element values into our DOM methods; should
  // throw an explicit exception. Also test trying to append HTML
  // DOM nodes into an SVG document, which should throw an exception.
  // Also test trying to attach a node that is already appended, or
  // calling one of the replaceChild methods with an already appended
  // node. Test calling removeChild with a node that is not a member
  // of the given parent node. Have tests where we pass in bad values
  // to setAttribute. Append children into places they don't belong,
  // such as trying to insert a METADATA node into a GROUP. Make sure
  // insertBefore throws an exception if either node is a text node
  // for now. Throw error if childNodes index is accessed that doesn't
  // exist. Throw an exception if you call getElementsByTagNameNS
  // with a prefix in the node name (i.e. 
  // getElementsByTagNameNS(rdf_ns, 'rdf:RDF') should throw an exception
  // as the correct usage is getElementsByTagNameNS(rdf_ns, 'RDF') ).
  // For unimplemented methods, add stubs that throw the DOM
  // not implemented exception. Call getElementById with IDs that
  // are known not to exist, and call getElementsByTagNameNS with
  // invalid values. Set null property names and values with set
  // and getAttribute. Repeatedly delete an element, repeatedly
  // append an element as well as using the other ways to 
  // append (replaceChild and insertBefore). Try to append a text
  // node created incorrectly with document.createTextNode to an SVG
  // node, which should throw an exception. Insert nodes that aren't
  // allowed structurally (i.e. more than one metadata element, 
  // metadata at the end, etc.). Remove children that were never
  // actually children. Throw exception if SVG root added or deleted.
  // Throw DOM exception if unknown style name passed to getProperty
  // on a style object, or if item() is called with an unknown index.
  
  // TODO: I'm not sure if we are correctly handling what should
  // happen if you pass in null, undefined, or an empty string
  // into setAttribute; I believe it should clear out that attribute
  // as if you were deleting it
  
  // TODO: Add a test where we dynamically add a new namespace onto
  // an SVG root node, and then be able to use this namespace on a node
  
  // TODO: Add robust tests for USE element with the different
  // configurations possible
  
  // TODO: It looks like the Flash XML parser parses XML comments
  // into the XML DOM. Add some inline ones below in our SVG XML and 
  // make sure we don't barf on them. Filter them out for now.
  
  // TODO: Add a test with negative coordinate values. It appears the
  // Flash renderer can't handle those for now, and ensure that something
  // doesn't barf on the JS side. Include a test with a negative
  // value plus coordinate type, such as '-50px'.
  
  // TODO: Add a bunch of tests around A hyperlink elements, including
  // working with existing ones, creating new ones, etc.
  
  // TODO: Have tests around CSS inherited styles, as well as forcing
  // inheritance using 'inherit' keyword. Make sure things show up
  // visually correctly
  
  // TODO: Have a test where we 'open' the DTD inside of an SVG file, like
  // in preserveAspectRatio.svg, and have custom entities that are actually
  // SVG markup. Then, make sure these actually show up in the DOM across
  // browsers and can be fetched with getElementById, childNodes,
  // getElementsByTagNameNS, etc.
  
  testUnload();
  
  // our SVG OBJECTs located in the page source itself should have loaded by now
  if (_hasObjects) {
    console.log('Testing SVG OBJECT onload listeners...');
    
    for (var i = 0; i < 3; i++) {
      assertTrue('SVG file embed' + (i + 1) + '.svg should have its onload() '
                 + 'method called', objectLoaded[i]);
    }
  }
  
  console.log('Waiting for final setTimeout check to run and ensure '
              + 'everything passes (10 seconds)...');
  
  // set a timeout before reporting success in case a flash
  // error occurred; our various onloads in embed2.svg can also run after
  // our main function has finished (on Firefox, for example, but not Safari).
  // also make sure that the timing functions in embed2.svg inside
  // testTimingFunctions have completed successfuly.
  window.setTimeout(function() {
    if (_hasObjects) {
      // make sure that embed2.svg called our _validateOnloads() method
      assertTrue('_validateOnloads should have been called', 
                 svgweb._validateOnloadsCalled);
    }
    
    // make sure that when we dynamically created our SVG OBJECTs that
    // the different ways we subscribed to the onload events worked;
    // NOTE: this must be in the final dynamically created SVG OBJECT's
    // onload function that we want to check for
    assertEquals('onload should have fired for our 3 listeners for dynamic '
                 + 'objects', 3, svgweb._dynamicObjOnloads);
       
    if (_hasObjects) {
      // make sure that all of our timing functions inside of embed2.svg
      // in testTimingFunctions() ran
      assertExists('window._timingFuncsCalled should exist',
                   window._timingFuncsCalled);
      assertEquals('12 timing functions should have run in embed2.svg '
                   + 'inside testTimingFunctions()', 12,
                   window._timingFuncsCalled.length);
    }
    
    // make sure that we don't end up with any _undefined names in the
    // _nodeById or GUID lookup tables
    if (svgweb.getHandlerType() == 'flash') {
      temp = svgweb._guidLookup['_undefined'];
      assertUndefined('_guidLookup["_undefined"] should be undefined');
      for (var i = 0; i < svgweb.handlers.length; i++) {
        handler = svgweb.handlers[i];
        temp = handler.document._nodeById['_undefined'];
        assertUndefined('svgweb.handlers[' + i 
                        + '].document._nodeById["_undefined"] should be '
                        + 'undefined');
      }
    }
    
    // make sure our window.onload listeners fired in the correct order
    if (isIE && !_hasObjects) {
      // window.onload and attachEvent
      assertEquals('2 page onload handlers should have fired', 2,
                   window._pageLoadedListeners.length);
      assertEquals('1st page onload handler == windowOnLoad', 'windowOnLoad',
                   window._pageLoadedListeners[0]);
      assertEquals('2nd page onload handler == attachEvent', 'attachEvent',
                   window._pageLoadedListeners[1]);
    } else if (isIE && _hasObjects) {
      // bodyOnLoad and attachEvent
      assertEquals('2 page onload handlers should have fired', 2,
                   window._pageLoadedListeners.length);
      assertEquals('1st page onload handler == bodyOnLoad', 'bodyOnLoad',
                   window._pageLoadedListeners[0]);
      assertEquals('2nd page onload handler == attachEvent', 'attachEvent',
                   window._pageLoadedListeners[1]);
    } else if (!_hasObjects) {
      // window.onload, 'addEventListener, useCapture=false',
      // and 'addEventListener, useCapture=true'
      assertEquals('3 page onload handlers should have fired', 3,
                   window._pageLoadedListeners.length);
      assertEquals('1st page onload handler == '
                   + '"addEventListener, useCapture=false"',
                   'addEventListener, useCapture=false',
                   window._pageLoadedListeners[0]);
      assertEquals('2nd page onload handler == '
                   + '"addEventListener, useCapture=true"',
                   'addEventListener, useCapture=true',
                   window._pageLoadedListeners[1]);
      assertEquals('3rd page onload handler == windowOnLoad', 'windowOnLoad',
                   window._pageLoadedListeners[2]);
    } else if (_hasObjects) {
      // bodyOnLoad, 'addEventListener, useCapture=false',
      // and 'addEventListener, useCapture=true'
      assertEquals('3 page onload handlers should have fired', 3,
                   window._pageLoadedListeners.length);
      assertEquals('1st page onload handler == '
                   + '"addEventListener, useCapture=false"',
                   'addEventListener, useCapture=false',
                   window._pageLoadedListeners[0]);
      assertEquals('2nd page onload handler == '
                   + '"addEventListener, useCapture=true"',
                   'addEventListener, useCapture=true',
                   window._pageLoadedListeners[1]);
      assertEquals('3rd page onload handler == bodyOnLoad', 'bodyOnLoad',
                   window._pageLoadedListeners[2]);
    }
    
    // check for any Flash errors           
    if (!_flashError) {
      console.log('All tests passed');
    }
  }, 10000);
}

function testScope() {
  console.log('Testing scope...');
  
  // various tests to make sure that the scope in the global containing
  // document doesn't collide with the scope inside our embedded SVG files
  
  // make sure variables don't clash
  assertEquals('shouldNotClash == set globally in test_js.js',
               'set globally in test_js.js', shouldNotClash);
                   
  // make sure functions don't clash
  assertEquals('globalFunction() == returned from test_js.js',
               'returned from test_js.js', globalFunction());
               
  // make sure that the objects's onload listeners fired _before_ the page
  assertTrue('window._objectsLoadedFirst == true', window._objectsLoadedFirst);
}

function testContentDocument() {
  // contentDocument, contentDocument.rootElement, and 
  // contentDocument.documentElement
  if (_hasObjects) {
    console.log('Testing contentDocument, rootElement, and documentElement...');
    svg = document.getElementById('mySVG');
    assertExists('OBJECT with ID "svg" should exist', svg);
    assertExists('svg.contentDocument should exist', svg.contentDocument);
    assertExists('svg.contentDocument.rootElement should exist',
                 svg.contentDocument.rootElement);
    assertExists('svg.contentDocument.documentElement should exist',
                 svg.contentDocument.documentElement);
    assertExists('svg.contentDocument.rootElement should exist',
                 svg.contentDocument.rootElement);
    assertExists('svg.contentDocument.documentElement should exist',
                 svg.contentDocument.documentElement);
    assertEquals('svg.contentDocument.rootElement.getAttribute(id) == mySVG',
                 'mySVG', svg.contentDocument.rootElement.getAttribute('id'));
    assertEquals('svg.contentDocument.rootElement.id == mySVG',
                 'mySVG', svg.contentDocument.rootElement.id);
    assertEquals('svg.contentDocument.documentElement.getAttribute(id) == mySVG',
                 'mySVG', svg.contentDocument.rootElement.getAttribute('id'));
    assertEquals('svg.contentDocument.documentElement.id == mySVG',
                 'mySVG', svg.contentDocument.rootElement.id);
    assertEquals('svg.contentDocument.rootElement.nodeName == svg',
                 'svg', svg.contentDocument.rootElement.nodeName);
  }
}

function testGetElementById() {
  // getElementById
  console.log('Testing getElementById...');
  
  if (!_hasObjects) {
    myRect = document.getElementById('myRect');
    assertExists('Getting myRect first time', myRect);
    assertEquals('myRect.id should be myRect', 'myRect', myRect.id);
  
    myRect = document.getElementById('myRect');
    assertExists('Getting myRect second time', myRect);
    assertEquals('Getting myRect second time, myRect.id should be myRect', 
                 'myRect', myRect.id);
  }
  
  mySVG = getRoot('mySVG');
  assertExists('mySVG root should exist', mySVG);
  assertEquals('mySVG.id should be mySVG', mySVG.id, 'mySVG');
  
  if (_hasObjects) {
    // make sure getElementById works inside of nested SVG OBJECT document
    doc = document.getElementById('mySVG').contentDocument;
    svg = doc.getElementById('mySVG');
    assertExists('Getting mySVG from contentDocument should exist', svg);
    rect = doc.getElementById('myRect');
    assertExists('Getting myRect from contentDocument should exist', rect);
  }
  
  // get non-SVG node
  cc = getDoc('svg2').getElementById('myCCWork');
  assertExists('myCCWork should exist', cc);
  assertEquals('myCCWork.getAttribute(id) == myCCWork', 'myCCWork',
               cc.getAttribute('id'));
  assertEquals('g.id == myCCWork', 'myCCWork',
               cc.id);
  
  // test getElementById on normal HTML content to ensure it
  // still works
  html = document.getElementById('htmlH2');
  assertExists('H2 element with ID htmlH2 should exist', html);
  assertEquals('H2.firstChild.nodeValue == This is an HTML H2',
               'This is an HTML H2', html.firstChild.nodeValue);
               
  // make sure you can have the same IDs within different SVG files embedded
  // with the OBJECT tag and they don't collide
  if (_hasObjects) {
    // create first element with same ID
    rect1 = getDoc('mySVG').createElementNS(svgns, 'rect');
    rect1.setAttribute('id', 'dontCollide');
    rect1.style.fill = 'red';
    group = getDoc('mySVG').getElementById('myGroup');
    group.appendChild(rect1);
    // create second element with same ID
    rect2 = getDoc('svg2').createElementNS(svgns, 'rect');
    rect2.setAttribute('id', 'dontCollide');
    rect2.style.fill = 'green';
    group = getDoc('svg2').getElementById('layer1');
    group.appendChild(rect2);
    // make sure they are present and don't collide
    rect1 = getDoc('mySVG').getElementById('dontCollide');
    assertExists('mySVG.doc.getElementById(dontCollide) should exist', rect1);
    assertEqualsAny('rect1.style.fill == red or #FF0000 or #ff0000', 
                    ['red', '#FF0000', '#ff0000'], rect1.style.fill);
    rect2 = getDoc('svg2').getElementById('dontCollide');
    assertExists('svg2.doc.getElementById(dontCollide) should exist', rect2);
    assertEqualsAny('rect2.style.fill == green or #008000', ['green', 
                    '#008000'], rect2.style.fill);
    assertTrue('rect1 !== rect2', (rect1 !== rect2));
    // delete and make sure they disappear
    rect1.parentNode.removeChild(rect1);
    rect2.parentNode.removeChild(rect2);
    rect1 = getDoc('mySVG').getElementById('dontCollide');
    assertNotExists('mySVG.doc.getElementById(dontCollide) should not exist', 
                    rect1);
    rect2 = getDoc('svg2').getElementById('dontCollide');
    assertNotExists('svg2.doc.getElementById(dontCollide) should not exist', 
                    rect2);
  }
  
  // element.id syntax
  console.log('Testing element.id...');
  
  group = getDoc('svg11242').getElementById('g4743');
  assertExists('SVG g element with ID g4743 should exist', group);
  assertEquals('group.nodeName == g', 'g', group.nodeName);
  assertEquals('group.id == g4743', 'g4743', group.id);
  
  gradient = getDoc('svg11242').getElementsByTagNameNS(svgns, 'linearGradient');
  assertExists('There should be gradient tags', gradient);
  gradient = gradient[0];
  assertExists('gradient with ID linearGradient2361 should exist',
               gradient);
  assertEquals('gradient.nodeName == linearGradient', 'linearGradient',
               gradient.nodeName);
  assertEquals('gradient.id == linearGradient2361', 'linearGradient2361',
               gradient.id);
               
  if (!_hasObjects) {
    svg = document.getElementsByTagNameNS(svgns, 'svg');
    assertExists("document.body.getElementsByTagNameNS(svgns, 'svg') "
                 + "should exist", svg);
    assertEquals("document.body.getElementsByTagNameNS(svgns, 'svg').length "
                 + " == 3", 3, svg.length);
    svg = svg[2];
    assertExists('SVG root with svg11242 should exist', svg);
  } else {
    svg = getRoot('svg11242');
  }
  assertEquals('svg.id == svg11242', 'svg11242', svg.id);
  
  // change the ID and make sure getElementById still sees it
  path = getDoc('svg2').getElementById('path3180');
  path.id = 'path3180_changed';
  assertExists('document.getElementById(path3180_changed) should exist',
               getDoc('svg2').getElementById('path3180_changed'));
  assertNull('document.getElementById(path3180) == null',
             getDoc('svg2').getElementById('path3180'));
             
  // change the ID through setAttribute and make sure getElementById
  // still sees it
  path = getDoc('svg2').getElementById('path3180_changed');
  path.setAttribute('id', 'path3180_changed_again');
  assertExists('document.getElementById(path3180_changed_again) should '
               + 'exist',
               getDoc('svg2').getElementById('path3180_changed_again'));
  assertNull('document.getElementById(path3180_changed) == null',
             getDoc('svg2').getElementById('path3180_changed'));
             
  // change the ID and make sure getElementById still sees it for a
  // non-SVG, non-HTML element
  cc = getDoc('svg2').getElementById('myCCWork');
  cc.id = 'myCCWork_changed';
  assertExists('document.getElementById(myCCWork_changed) should exist',
               getDoc('svg2').getElementById('myCCWork_changed'));
  assertNull('document.getElementById(myCCWork) == null',
             getDoc('svg2').getElementById('myCCWork'));
  
  // change the ID through setAttribute and make sure getElementById
  // still sees it for a non-SVG, non-HTML element
  cc = getDoc('svg2').getElementById('myCCWork_changed');
  cc.setAttribute('id', 'myCCWork_changed_again');
  assertExists('document.getElementById(myCCWork_changed_again) should '
               + 'exist',
               getDoc('svg2').getElementById('myCCWork_changed_again'));
  assertNull('document.getElementById(myCCWork_changed) == null',
             getDoc('svg2').getElementById('myCCWork_changed'));
  cc.id = 'myCCWork';
  assertExists('document.getElementById(myCCWork) should exist',
               getDoc('svg2').getElementById('myCCWork'));
}

function testGetElementsByTagNameNS() {
  // getElementsByTagNameNS
  console.log('Testing getElementsByTagNameNS...');
  
  rects = document.getElementsByTagNameNS(svgns, 'rect');
  assertExists("document.getElementsByTagNameNS(svgns, 'rect')", rects);
  // should be 0 if objects are embedded on page
  if (_hasObjects) {
    assertEquals("document.getElementsByTagNameNS(svgns, 'rect').length "
               + "should be 0", 0, rects.length);
    
    // test inside of SVG OBJECT element
    rects = getDoc('svg2').getElementsByTagNameNS(svgns, 'rect');
    assertExists("svg2.contentDocument.getElementsByTagNameNS('rect')", rects);
    // 2 rects were added by tests inside of embed2.svg
    assertEquals("svg2.contentDocument.getElementsByTagNameNS(rect).length "
                 + "should be 7", 7, rects.length);
  } else {
    assertEquals("document.getElementsByTagNameNS(svgns, 'rect').length "
                + "should be 14", 14, rects.length);
  }
  
  sodipodi = document.getElementsByTagNameNS(sodipodi_ns, '*');
  assertExists("document.getElementsByTagNameNS(sodipodi_ns, '*')", 
               sodipodi);
  // should be 0 if objects are embedded on page
  if (_hasObjects) {
    // test inside of SVG OBJECT element
    sodipodi = getDoc('svg2').getElementsByTagNameNS(sodipodi_ns, '*');
    assertExists("svg2.contentDocument.getElementsByTagNameNS(sodipodi_ns, '*')", 
                 sodipodi);
    assertEquals("svg2.contentDocument.getElementsByTagNameNS(sodipodi_ns, "
                 + "'*').length should be 1", 1, sodipodi.length);
  } else {
    assertEquals("document.getElementsByTagNameNS(sodipodi_ns, '*').length "
                + "should be 1", 1, sodipodi.length);
  }
  
  sodipodi = getDoc('svg2').getElementsByTagNameNS(sodipodi_ns, 'namedview');
  assertExists("doc.getElementsByTagNameNS(sodipodi_ns, 'namedview')",
               sodipodi);
  assertEquals("doc.getElementsByTagNameNS(sodipodi_ns, 'namedview') "
               + "length should be 1", 1, sodipodi.length);
  assertEquals("doc.getElementsByTagNameNS(sodipodi_ns, 'namedview')"
               + "[0].nodeName == namedview", 'sodipodi:namedview',
               sodipodi[0].nodeName);
  assertEquals("doc.getElementsByTagNameNS(sodipodi_ns, 'namedview')"
              + "[0].localName == namedview", 'namedview',
              sodipodi[0].localName);
  assertEquals("doc.getElementsByTagNameNS(sodipodi_ns, 'namedview')"
              + "[0].prefix == sodipodi", 'sodipodi',
              sodipodi[0].prefix);
  assertEquals("doc.getElementsByTagNameNS(sodipodi_ns, 'namedview')"
               + "[0].namespaceURI == sodipodi_ns", sodipodi_ns,
               sodipodi[0].namespaceURI);
  assertEquals("doc.getElementsByTagNameNS(sodipodi_ns, 'namedview')"
              + "[0].nodeType == 1", 1, sodipodi[0].nodeType);
  assertEquals("doc.getElementsByTagNameNS(sodipodi_ns, 'namedview')"
              + "[0].getAttribute('gridtolerance') == 10000", 10000,
              sodipodi[0].getAttribute('gridtolerance'));
  sodipodi[0].setAttribute('gridtolerance', 20000);
  assertEquals("doc.getElementsByTagNameNS(sodipodi_ns, 'namedview')"
              + "[0].getAttribute('gridtolerance') should now be 20000", 
              20000,
              sodipodi[0].getAttribute('gridtolerance'));
              
  rdf = getDoc('svg2').getElementsByTagNameNS(
                      'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                      'RDF');
  assertExists('RDF elements should exist', rdf);
  assertEquals('# of RDF elements == 1', 1, rdf.length);
  rdf = rdf[0];
  assertExists('RDF element', rdf);
  assertEquals('rdf.childNodes.length == 1', 1, rdf.childNodes.length);
  assertEquals('rdf.nodeName == rdf:RDF', 'rdf:RDF', rdf.nodeName);
  assertEquals('rdf.prefix == rdf', 'rdf', rdf.prefix);
  assertEquals('rdf.namespaceURI == '
               + 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
               'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
               rdf.namespaceURI);
  assertEquals('rdf.localName == RDF', 'RDF', rdf.localName);
  assertEquals('rdf.nodeType == 1', 1, rdf.nodeType);
  
  rdf = getDoc('svg2').getElementsByTagNameNS(
                      'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                      'badName');
  assertEquals('rdf.length == 0', 0, rdf.length);
               
  dc = getDoc('svg2').getElementsByTagNameNS(dc_ns, 'format');
  assertExists("doc.getElementsByTagNameNS(dc_ns, 'format')", dc);
  assertEquals("doc.getElementsByTagNameNS(dc_ns, 'format').length "
               + "== 1", 1, dc.length);
  dc = dc[0];
  assertEquals('dc.childNodes.length == 1', 1, dc.childNodes.length);
  assertExists('dc.firstChild should exist', dc.firstChild);
  assertEquals('dc.firstChild.nodeType == 3', 3, dc.firstChild.nodeType);
  child = dc.firstChild;
  assertEquals("dc.firstChild.nodeValue == image/svg+xml", 
               'image/svg+xml', child.nodeValue);
  assertEquals("dc.firstChild.nodeName == #text", '#text',
              child.nodeName);
  child.nodeValue = 'foobar/changed';
  assertEquals("dc.firstChild.nodeValue == foobar/changed", 
              'foobar/changed', child.nodeValue);
  assertEquals("dc.firstChild.data == foobar/changed", 'foobar/changed',
              child.data);
  assertEquals("dc.firstChild.textContent == foobar/changed", 
              'foobar/changed', child.textContent);
  child.data = 'foobar/changed2';
  assertEquals("dc.firstChild.nodeValue == foobar/changed2", 
              'foobar/changed2', child.nodeValue);
  assertEquals("dc.firstChild.data == foobar/changed2", 'foobar/changed2',
              child.data);
  assertEquals("dc.firstChild.textContent == foobar/changed2", 
              'foobar/changed2', child.textContent);
  child.textContent = 'foobar/changed3';
  assertEquals("dc.firstChild.nodeValue == foobar/changed3", 
              'foobar/changed3', child.nodeValue);
  assertEquals("dc.firstChild.data == foobar/changed3", 'foobar/changed3',
              child.data);
  assertEquals("dc.firstChild.textContent == foobar/changed3", 
              'foobar/changed3', child.textContent);
  child.nodeValue = 'image/svg+xml';
  
  bad = getDoc('svg2').getElementsByTagNameNS('http://bad-namespace.com',
                                              'rect');
  assertExists("doc.getElementsByTagNameNS('http://bad-namespace.com', "
               + "'rect')", bad);
  assertEquals("doc.getElementsByTagNameNS('http://bad-namespace.com', "
               + "'rect') length should be 0", 0, bad.length);
               
  bad = getDoc('svg2').getElementsByTagNameNS('http://bad-namespace.com', '*');
  assertExists("doc.getElementsByTagNameNS('http://bad-namespace.com', "
              + "'*')", bad);
  assertEquals("doc.getElementsByTagNameNS('http://bad-namespace.com', "
               + "'*') length should be 0", 0, bad.length);
  
  rects = getDoc('mySVG').getElementsByTagNameNS(null, 'rect');
  assertExists("doc.getElementsByTagNameNS(null, 'rect')", rects);
  assertEquals("doc.getElementsByTagNameNS(null, 'rect').length "
               + "should be 0", 0, rects.length);
  
  // TODO: FIXME: uncomment these when we support contextual node finding            
  // test contextual getElementsByTagNameNS to find SVG nodes
  //group = getDoc('svg2').getElementById('layer1');
  //matches = group.getElementsByTagNameNS(svgns, 'rect');
  //assertExists("group.getElementsByTagNameNS(svgns, 'rect') should "
  //             + "return results", matches);
  //assertEquals("group.getElementsByTagNameNS(svgns, 'rect').length == 1", 
  //             1, matches.length);
  //rect = matches[0];
  //assertEquals('rect.nodeName == rect', 'rect', rect.nodeName);
  //assertEquals('rect.id == rect3926', 'rect3926', rect.id);
  // test contextual getElementsByTagNameNS on a node with children but with
  // a tag that should have no results
  //matches = group.getElementsByTagNameNS(svgns, 'text');
  //assertEquals("group.getElementsByTagNameNS(svgns, 'text').length == 0", 0, 
  //             matches.length);
  
  // test contextual getElementsByTagNameNS on node with no children
  //path = getDoc('svg2').getElementById('path3913');
  //matches = path.getElementsByTagNameNS(svgns, 'rect');
  //assertEquals("path.getElementsByTagNameNS(svgns, 'rect').length == 0", 0, 
  //             matches.length);
  
  // test contextual getElementsByTagNameNS on node with only textual children
  //text = getDoc('mySVG').getElementById('testText5');
  //matches = text.getElementsByTagNameNS(svgns, 'path');
  //assertEquals("text.getElementsByTagNameNS(svgns, 'path').length == 0", 0, 
  //             matches.length);
  
  // text contextual getElementsByTagNameNS to get a non-SVG node
  //metadata = getDoc('svg2').getElementById('metadata7');
  //matches = metadata.getElementsByTagNameNS(cc_ns, 'Work');
  //assertExists('getElementsByTagNameNS(cc:Work) should return something',
  //             matches);
  //assertEquals('getElementsByTagNameNS(cc:Work).length == 1', 1, 
  //             matches.length);
  //cc = matches[0];
  //assertExists('myCCWork from contentDocument should exist', cc);
  //assertEquals('myCCWork.getAttribute(id) == myCCWork', 'myCCWork',
  //             cc.getAttribute('id'));
               
  // test getElementsByTagNameNS on normal HTML content to
  // ensure it still works
  // Note: Safari forces all HTML elements into XHTML namespace, while
  // Firefox doesn't
  if (!isIE) { // IE doesn't have native getElementsByTagNameNS
    ns = document.getElementsByTagName('head')[0].namespaceURI;
    html = document.getElementsByTagNameNS(ns, 'head');
    assertEquals('There should be one HEAD element after calling '
                 + 'getElementsByTagNameNS', 1, html.length);
  }
}

function testSVGSVGElementProperties() {
  // SVGSVGElement.x, .y, .width, .height
  console.log('Testing SVGSVGElement.x, .y, .width, and .height...');
  
  root = getRoot('mySVG');
  assertEquals("mySVG.x.baseVal.value should be 0", 0, 
               root.x.baseVal.value);
  assertEquals("mySVG.y.baseVal.value should be 0", 0, 
               root.y.baseVal.value);
  assertEquals("mySVG.width.baseVal.value should be 500", 500, 
               root.width.baseVal.value);
  assertEquals("mySVG.height.baseVal.value should be 500", 500, 
               root.height.baseVal.value);
               
  root = getRoot('svg2');
  assertEquals("svg2.x.baseVal.value should be 0", 0, 
               root.x.baseVal.value);
  assertEquals("svg2.y.baseVal.value should be 0", 0, 
               root.y.baseVal.value);
  assertEquals("svg2.width.baseVal.value should be 450", 450, 
               root.width.baseVal.value);
  assertEquals("svg2.height.baseVal.value should be 450", 450, 
               root.height.baseVal.value);
               
  root = getRoot('svg11242');
  assertEquals("svg11242.x.baseVal.value should be 100", 100, 
              root.x.baseVal.value);
  assertEquals("svg11242.y.baseVal.value should be 100", 100, 
              root.y.baseVal.value);
  assertEquals("svg11242.width.baseVal.value should be 466.11172",
              466.11172, root.width.baseVal.value.toPrecision(8));
  assertEquals("svg11242.height.baseVal.value should be 265.35126",
              265.35126, root.height.baseVal.value.toPrecision(8));
}

function testSVGUseElementProperties() {
  // SVGUseElement.x, .y, .width, .height
  //console.log('Testing SVGUseElement.x, .y, .width, and .height...');
  // TODO
}

function testGetAttribute() {
  // getAttribute
  console.log('Testing getAttribute...');
  if (_hasObjects) {
    // Firefox and Safari transform our OBJECT tags into EMBEDs beyond our
    // control when they are using the Flash Handler
    if (isIE || renderer == 'native') {
      matches = document.getElementsByTagName('object');
      root = matches[0].contentDocument.documentElement;
    } else {
      matches = document.getElementsByTagName('embed');
      root = matches[0].contentDocument.documentElement;
    }
    
    root = matches[0].contentDocument.documentElement;
    
  } else {
    root = document.getElementsByTagNameNS(svgns, 'svg');
    assertExists("document.getElementsByTagNameNS(svgns, 'svg')", root);
    root = root[0];
  }
  assertExists("mySVG root should exist", root);
  assertEquals("root.getAttribute(width) == 500", 500,
                root.getAttribute('width'));
  assertEquals("root.getAttribute(height) == 500", 500,
                root.getAttribute('height')); 
  assertNull("root.getAttribute(badproperty) == null",
             root.getAttribute('badproperty'));
  
  rect = getDoc('mySVG').getElementById('myRect');
  assertEquals("rect.getAttribute(width) == 36.416", 36.416,
                rect.getAttribute('width'));      
  assertEquals("rect.getAttribute(height) == 36.416", 36.416,
                rect.getAttribute('height')); 
  assertEquals("rect.getAttribute(x) == 50", 50,
                rect.getAttribute('x')); 
  assertEquals("rect.getAttribute(y) == 50", 50,
                rect.getAttribute('y')); 
  assertEquals("rect.getAttribute(fill) == red", 'red',
                rect.getAttribute('fill')); 
             
  path = getDoc('svg11242').getElementById('path3327');
  assertExists('path3327', path);
  assertEquals("path.getAttribute('id') == path3327", 'path3327',
                path.getAttribute('id'));
  assertEquals("path.getAttribute(d)", 
               'M 142.36876,165.39221 L 130.68164,163.08268 '
               + 'L 141.15363,231.4999 L 121.92367,164.90725 '
               + 'L 112.13114,171.69172 L 114.44068,160.0046 '
               + 'L 45.393496,171.10654 L 112.6161,151.24663 '
               + 'L 105.83164,141.4541 L 117.51875,143.76364 '
               + 'L 107.67672,77.866207 L 126.27672,141.93906 '
               + 'L 136.06925,135.1546 L 133.75972,146.84171 '
               + 'L 201.54699,140.14944 L 135.58429,155.59968 '
               + 'L 142.36876,165.39221 z ',
                path.getAttribute('d'));
  assertNull("path.getAttribute('fill') == null", 
              path.getAttribute('fill'));
              
  gradient = getDoc('svg11242').getElementById('linearGradient4485');
  assertEquals("gradient.getAttribute('gradientUnits') == userSpaceOnUse", 
                'userSpaceOnUse',
                gradient.getAttribute('gradientUnits'));
  assertEquals("gradient.getAttribute('x1') == 394.93762", 
                '394.93762',
                gradient.getAttribute('x1'));
                
  sodipodi = getDoc('svg2').getElementById('base');
  assertExists("document.getElementById('base')", sodipodi);
  assertEquals("sodipodi.getAttribute('objecttolerance') == 10", 
                '10',
                sodipodi.getAttribute('objecttolerance'));
                
  // make sure internal __guid attribute doesn't show up
  rect = getDoc('mySVG').getElementById('myRect');
  assertNull('rect.getAttribute(__guid) == null',
             rect.getAttribute('__guid'));
                  
  // TODO: when we support the attributes property make sure that the 
  // __guid property doesn't show up in there
}

function testSetAttribute() {
  // setAttribute
  console.log('Testing setAttribute...');
  
  rect = getDoc('mySVG').getElementById('myRect');
  rect.setAttribute('fill', 'yellow');
  assertEquals("rect.getAttribute('fill') == yellow", 'yellow',
                rect.getAttribute('fill'));
  rect.setAttribute('stroke', 'rgb(0,0,0)');
  assertEquals("rect.getAttribute('stroke') == rgb(0,0,0)", 'rgb(0,0,0)',
                rect.getAttribute('stroke'));              
  rect.setAttribute('width', 400);
  assertEquals("rect.getAttribute('width') == 400", '400',
                rect.getAttribute('width'));   
  rect.setAttribute('width', '450');
  assertEquals("rect.getAttribute('width') == 450", '450',
                rect.getAttribute('width'));   
  rect.setAttribute('height', 400);
  assertEquals("rect.getAttribute('height') == 400", '400',
                rect.getAttribute('height'));   
  rect.setAttribute('height', '450');
  assertEquals("rect.getAttribute('height') == 450", '450',
                rect.getAttribute('height')); 
  rect.setAttribute('stroke-width', '5px');
  assertEquals("rect.getAttribute('stroke-width') == 5px", '5px',
                rect.getAttribute('stroke-width'));
  rect.setAttribute('stroke', 'pink');
  assertEquals("rect.getAttribute('stroke') == pink", 'pink',
                rect.getAttribute('stroke')); 
  rect.setAttribute('fill-opacity', '0.3');
  assertEquals("rect.getAttribute('fill-opacity') == 0.3", '0.3',
                rect.getAttribute('fill-opacity')); 
                                      
  sodipodi = getDoc('svg2').getElementById('base');
  assertExists("document.getElementById('base')", sodipodi);
  sodipodi.setAttribute('pagecolor', '#0f0f0f');
  assertEquals("sodipodi.getAttribute('pagecolor') == #0f0f0f", '#0f0f0f',
                sodipodi.getAttribute('pagecolor'));
  sodipodi.setAttribute('newAttribute', 'hello world');
  assertEquals("sodipodi.getAttribute('newAttribute') == hello world", 
                'hello world',
                sodipodi.getAttribute('newAttribute'));
}

function testChildNodes() {
  // childNodes
  console.log('Testing childNodes...');
  
  // whitespace inside the XML inside an SVG file is whitespace when embedded
  // with OBJECT tag
  div = document.getElementById('test_container');
  whitespaceAreNodes = false;
  if (_hasObjects) {
    whitespaceAreNodes = true;
  } else if (div.childNodes[0].nodeType == 3) {
    whitespaceAreNodes = true;
  }
  
  // test the child nodes of an SVG group element
  group = getDoc('mySVG').getElementById('myGroup');
  assertExists("group.childNodes", group.childNodes);
  assertEquals("group.length == 6", 6, group.childNodes.length);
  child = group.childNodes[0];
  assertExists("group.childNodes[first element]", child);
  assertEquals("child.childNodes[first element].id", 'myRect', child.id);
  assertEquals("child.childNodes[first element].nodeName", 'rect', 
               child.nodeName);
  assertEquals("child.childNodes[first element].nodeType", 1, child.nodeType);
  assertUndefined("child.childNodes[first element].data == undefined", 
                  child.data);
  assertEquals("child.childNodes[first element].textContent == ''", '', 
               child.textContent);
  assertNull("child.childNodes[first element].nodeValue == null", 
             child.nodeValue);
  assertExists("child.childNodes", child.childNodes);
  assertEquals("child.childNodes.length == 0", 0, 
               child.childNodes.length);
  if (whitespaceAreNodes) {
    assertUndefined("group.childNodes[13] == undefined", group.childNodes[13]);
  } else {     
    assertUndefined("group.childNodes[6] == undefined", group.childNodes[6]);
  }
  for (var i = 0; i < group.childNodes.length; i++) {
    assertExists('looping through childNodes, i=' + i, 
                 group.childNodes[i]);
    assertExists('looping through childNodes, .nodeName for i=' + i,
                 group.childNodes[i].nodeName);
  }
  
  // test the child nodes navigating to our SVG OBJECT or embedding SCRIPT
  // elements from the test_container.
  // 11 child nodes of the div on non-IE browsers due to whitespace 
  // handling, 5 on IE
  if (whitespaceAreNodes && !isIE) {
    if (_hasObjects) {
      assertEquals('div.childNodes.length == 23 (non-IE browsers)', 23, 
                   div.childNodes.length);
    } else {
      assertEquals('div.childNodes.length == 11 (non-IE browsers)', 11, 
                   div.childNodes.length);
    }
  } else {
    assertEquals('div.childNodes.length == 5 (Internet Explorer only)', 
                 5, div.childNodes.length);
  }
  // get the children in different ways due to whitespacing handling
  // first SVG root element
  if (whitespaceAreNodes && !isIE) {
    if (_hasObjects) {
      child = div.childNodes[7];
    } else {
      child = div.childNodes[3];
    }
  } else {
    child = div.childNodes[1]; 
  } 
  if (_hasObjects) {
    child = child.contentDocument.documentElement;
  } else if (!isIE && String(child.className).indexOf('embedssvg') != -1) {
    child = child.documentElement;
  }
  assertExists('First SVG root element', child);
  assertEquals('first SVG root element.nodeName == svg', 'svg', 
               child.nodeName);
  assertEquals('first SVG root element.nodeType == 1', 1, child.nodeType);
  assertNull('first SVG root element.nodeValue == null', child.nodeValue);
  if (_hasObjects) {
    // Firefox and Safari differ by one
    assertEqualsAny('first SVG root element.childNodes.length == 7 or 8',
                 [7, 8], child.childNodes.length);
  } else {
    assertEquals('first SVG root element.childNodes.length == 2', 2, 
                child.childNodes.length);
  }
  assertNull('first SVG root element.prefix == null', child.prefix);
  assertEquals('first SVG root element.namespaceURI == svgns', svgns,
               child.namespaceURI);
  assertEquals('first SVG root element.getAttribute(id) == mySVG', 'mySVG',
               child.getAttribute('id'));
  // 2nd SVG root element
  if (whitespaceAreNodes && !isIE) {
    if (_hasObjects) {
      child = div.childNodes[13];
    } else {
      child = div.childNodes[5];
    }
  } else {
    child = div.childNodes[2]; 
  }
  if (_hasObjects) {
    child = child.contentDocument.documentElement;
  } else if (!isIE && String(child.className).indexOf('embedssvg') != -1) {
    child = child.documentElement;
  }
  assertExists('Second SVG root element', child);
  assertEquals('2nd SVG root element == svg', 'svg', 
               child.nodeName);
  assertEquals('2nd SVG root element.nodeType == 1', 1, child.nodeType);
  assertNull('2nd SVG root element.nodeValue == null', child.nodeValue);
  if (_hasObjects) {
    // Firefox and Safari differ by one
    assertEqualsAny('2nd SVG root element.childNodes.length == 44 or 45',
                [44, 45], child.childNodes.length);
  } else {
    assertEquals('2nd SVG root element.childNodes.length == 19', 19, 
                child.childNodes.length);
  }
  assertNull('2nd SVG root element.prefix == null', child.prefix);
  assertEquals('2nd SVG root element.namespaceURI == svgns', svgns,
               child.namespaceURI);
  assertEquals('2nd SVG root element.getAttribute(id) == svg2', 'svg2',
               child.getAttribute('id'));
  // 3rd SVG root element
  if (whitespaceAreNodes && !isIE) {
    if (_hasObjects) {
      child = div.childNodes[19];
    } else {
      child = div.childNodes[7];
    }
  } else {
    child = div.childNodes[3]; 
  }
  if (_hasObjects) {
    child = child.contentDocument.documentElement;
  } else if (!isIE && String(child.className).indexOf('embedssvg') != -1) {
    child = child.documentElement;
  }
  assertExists('Third SVG root element', child);
  assertEquals('3rd SVG root element.nodeName == svg', 'svg', 
               child.nodeName);
  assertEquals('3rd SVG root element.nodeType == 1', 1, child.nodeType);
  assertNull('3rd SVG root element.nodeValue == null', child.nodeValue);
  if (_hasObjects) {
    // Firefox and Safari differ by one
    assertEqualsAny('3rd SVG root element.childNodes.length == 3 or 4', [3, 4], 
                    child.childNodes.length);
  } else {
    assertEquals('3rd SVG root element.childNodes.length == 2', 2, 
                child.childNodes.length);
  }
  assertNull('3rd SVG root element.prefix == null', child.prefix);
  assertEquals('3rd SVG root element.namespaceURI == svgns', svgns,
               child.namespaceURI);
  assertEquals('3rd SVG root element.getAttribute(id) == svg11242', 
               'svg11242', child.getAttribute('id'));            

  root = child;
  if (_hasObjects) {
    // Firefox and Safari differ by one
    assertEqualsAny('root.childNodes.length == 3 or 4', [3, 4], 
                    root.childNodes.length);
  } else {
    assertEquals('root.childNodes.length == 2', 2, root.childNodes.length);  
  }
  child = root.childNodes[0];
  assertExists('root.childNodes[defs] exists', child);
  assertEquals('root.childNodes[defs].nodeName == defs', 'defs',
               child.nodeName);
  assertEquals('root.childNodes[defs].getAttribute(id) == defs3', 'defs3',
               child.getAttribute('id'));
  if (_hasObjects) {
    assertEquals('root.childNodes[defs].childNodes.length == 209', 209,
                 child.childNodes.length);
  } else {
    assertEquals('root.childNodes[defs].childNodes.length == 105', 105,
                child.childNodes.length);
  }
  assertEquals('root.childNodes[defs].childNodes[0].nodeName '
               + '== linearGradient', 'linearGradient',
               child.childNodes[0].nodeName);
  assertEquals('root.childNodes[defs].childNodes[0].childNodes[0].nodeName '
               + '== stop', 'stop', child.childNodes[0].childNodes[0].nodeName);
  assertEquals('root.childNodes[defs].childNodes[0].childNodes[0].'
               + 'getAttribute(offset) == 0', 0, 
               child.childNodes[0].childNodes[0].getAttribute('offset'));

  if (_hasObjects) {
    if (isIE || renderer == 'native') {
      root = document.getElementsByTagName('object')[2].contentDocument
                                                            .documentElement;
    } else {
      root = document.getElementsByTagName('embed')[2].contentDocument
                                                            .documentElement;
    }
  } else {
    root = document.getElementsByTagNameNS(svgns, 'svg')[2];
  }
  assertEquals('root.id == svg11242', 'svg11242', root.id);
  if (_hasObjects) {
    // Firefox and Safari differ by one
    if (renderer == 'flash') {
      assertEqualsAny('root.childNodes.length == 3 or 4', [3, 4], 
                      root.childNodes.length);
    }
  } else {
    assertEquals('root.childNodes.length == 2', 2, root.childNodes.length);
  }
  child = root.childNodes[0];
  assertExists('root.childNodes[0] exists', child);
  assertEquals('root.childNodes[0].nodeName == defs', 'defs',
               child.nodeName);
  assertEquals('root.childNodes[0].getAttribute(id) == defs3', 'defs3',
               child.getAttribute('id'));
  if (_hasObjects) {
    assertEquals('root.childNodes[0].childNodes.length == 209', 209,
                 child.childNodes.length);
  } else {
    assertEquals('root.childNodes[0].childNodes.length == 105', 105,
                 child.childNodes.length);
  }
  assertEquals('root.childNodes[0].childNodes[0].nodeName '
               + '== linearGradient', 'linearGradient',
               child.childNodes[0].nodeName);
  assertEquals('root.childNodes[0].childNodes[0].childNodes[0].nodeName == stop',
               'stop', child.childNodes[0].childNodes[0].nodeName);
  assertEquals('root.childNodes[0].childNodes[0].childNodes[0].getAttribute(offset) == 0',
               0,
               child.childNodes[0].childNodes[0].getAttribute('offset'));

  metadata = getDoc('svg2').getElementsByTagNameNS(svgns, 'metadata')[0];
  assertExists('metadata element', metadata);
  assertEquals('metadata.getAttribute(id) == metadata7', 'metadata7',
               metadata.getAttribute('id'));
  metadata.setAttribute('id', 'metadata8');
  assertEquals('After setting, metadata.getAttribute(id) == metadata8', 
               'metadata8', metadata.getAttribute('id'));
  metadata = getDoc('svg2').getElementById('metadata7');
  assertNull('metadata.id was changed, should be null now', metadata);
  metadata = getDoc('svg2').getElementById('metadata8');
  assertExists('metadata.id was changed, should not be null', metadata);
  metadata.id = 'metadata7';
  assertEquals('metadata.childNodes == 1', 1, metadata.childNodes.length);
  rdf = metadata.childNodes[0];
  assertExists('RDF element', rdf);
  assertEquals('rdf.childNodes.length == 1', 1, rdf.childNodes.length);
  assertEquals('rdf.nodeName == rdf:RDF', 'rdf:RDF', rdf.nodeName);
  assertEquals('rdf.prefix == rdf', 'rdf', rdf.prefix);
  assertEquals('rdf.namespaceURI == http://www.w3.org/1999/02/22-rdf-syntax-ns#',
               'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
               rdf.namespaceURI);
  assertEquals('rdf.localName == RDF', 'RDF', rdf.localName);
  assertEquals('rdf.nodeType == 1', 1, rdf.nodeType);
  rdf = getDoc('svg2').getElementsByTagNameNS(
                      'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                      'RDF');
  assertExists('RDF elements should exist', rdf);
  assertEquals('# of RDF elements == 1', 1, rdf.length);
  rdf = rdf[0];
  assertExists('RDF element', rdf);
  assertEquals('rdf.childNodes.length == 1', 1, rdf.childNodes.length);
  assertEquals('rdf.nodeName == rdf:RDF', 'rdf:RDF', rdf.nodeName);
  assertEquals('rdf.prefix == rdf', 'rdf', rdf.prefix);
  assertEquals('rdf.namespaceURI == '
               + 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
               'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
               rdf.namespaceURI);
  assertEquals('rdf.localName == RDF', 'RDF', rdf.localName);
  assertEquals('rdf.nodeType == 1', 1, rdf.nodeType);
  cc = rdf.childNodes[0];
  assertExists('Creative Commons element should exist', cc);
  assertEquals('cc.childNodes.length == 2', 2, cc.childNodes.length);
  assertEquals('cc.nodeName == cc:Work', 'cc:Work', cc.nodeName);
  assertEquals('cc.prefix == cc', 'cc', cc.prefix);
  assertEquals('cc.namespaceURI == http://web.resource.org/cc/',
               'http://web.resource.org/cc/', cc.namespaceURI);
  assertEquals('cc.localName == Work', 'Work', cc.localName);
  assertEquals('cc.nodeType == 1', 1, cc.nodeType);  
}

function testOwnerDocument() {
  console.log('Testing ownerDocument...');
  
  // ownerDocument
  if (_hasObjects) {
    svg = document.getElementsByTagNameNS(svgns, 'svg');
    assertEquals('Zero svg elements', 0, svg.length);
    matches = document.getElementsByTagName('object');
    for (var i = 0; i < matches.length; i++) {
      if (!isIE && matches[i].getAttribute('src')) {
        // there are 6 OBJECT tags for standards compliant browsers (nested 
        // OBJECT tags), but IE only returns 3.
        continue;
      }
      
      doc = matches[i].contentDocument;
      svg = doc.documentElement;
      assertEquals('svg[' + i + '].ownerDocument == contentDocument', doc, 
                   svg.ownerDocument);
    }
  } else {
    svg = document.getElementsByTagNameNS(svgns, 'svg');
    assertEquals('Three svg elements', 3, svg.length);
    for (var i = 0; i < svg.length; i++) {
      assertEquals('svg[' + i + '].ownerDocument == document',
                   document, svg[i].ownerDocument);
    }
  }
  rdf = getDoc('svg2').getElementsByTagNameNS(
                                  'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                                  'RDF')[0];
  doc = getDoc('svg2');
  assertEquals('rdf.ownerDocument == document or contentDocument', doc, 
                rdf.ownerDocument);
}

function testTextNodes() {
  console.log('Testing text nodes...');
  
  // text nodes (createTextNode, textNode.nodeValue, textNode.textContent,
  // and textNode.data) including setting and getting
  
  svg = getDoc('mySVG').getElementById('mySVG');
  if (_hasObjects) {
    // Firebug inserts an html:div into our SVG DOM!
    if (renderer == 'native' && console.firebug) {
      svgText = svg.childNodes[4].childNodes[1];
    } else {
      svgText = svg.childNodes[3].childNodes[1];
    }
  } else {
    svgText = svg.childNodes[0].childNodes[1];
  }
  assertExists('svgText should exist', svgText);
  assertEquals('svgText.nodeName == text', 'text', svgText.nodeName);
  assertEquals('svgText.id == myText', 'myText', svgText.id);
  assertEquals('svgText.childNodes.length == 1', 1, 
               svgText.childNodes.length);
  textNode = svgText.childNodes[0];
  assertExists('svgText should have a DOM TEXT NODE', textNode);
  assertEquals('textNode.nodeType == 3', 3, textNode.nodeType);
  assertEquals('textNode.nodeName == #text', '#text', textNode.nodeName);
  assertNull('textNode.localName == null', textNode.localName);
  assertNull('textNode.namespaceURI == null', textNode.namespaceURI);
  assertNull('textNode.prefix == null', textNode.prefix);
  assertUndefined('textNode.x == undefined', textNode.x);
  assertUndefined('textNode.y == undefined', textNode.y);
  assertUndefined('textNode.width == undefined', textNode.width);
  assertUndefined('textNode.height == undefined', textNode.height);
  assertUndefined('textNode.id == undefined', textNode.id);
  assertExists('textNode.childNodes should exist', textNode.childNodes);
  assertEquals('textNode.childNodes.length == 0', 0,
               textNode.childNodes.length);
  assertEquals('textNode.ownerDocument == document or contentDocument', 
               getDoc('mySVG'), textNode.ownerDocument);
  assertEquals('textNode.nodeValue == hello world', 'hello world',
               textNode.nodeValue);
  assertEquals('textNode.data == hello world', 'hello world',
               textNode.data);
  assertEquals('textNode.textContent == hello world', 'hello world',
               textNode.textContent);
  textNode.nodeValue = 'set through nodeValue';

  assertEquals('After setting .nodeValue, textNode.nodeValue == '
               + 'set through nodeValue', 'set through nodeValue',
               textNode.nodeValue);
  assertEquals('After setting .nodeValue, textNode.data == '
               + 'set through nodeValue', 'set through nodeValue',
               textNode.data);
  assertEquals('After setting .nodeValue, textNode.textContent == '
               + 'set through nodeValue', 'set through nodeValue',
               textNode.textContent);
  textNode.data = 'set through data';
  assertEquals('After setting .data, textNode.nodeValue == '
               + 'set through data', 'set through data',
               textNode.nodeValue);
  assertEquals('After setting .data, textNode.data == '
               + 'set through data', 'set through data',
               textNode.data);
  assertEquals('After setting .data, textNode.textContent == '
               + 'set through nodeValue', 'set through data',
               textNode.textContent);
  textNode.textContent = 'set through textContent';
  assertEquals('After setting .textContent, textNode.nodeValue == '
               + 'set through textContent', 'set through textContent',
               textNode.nodeValue);
  assertEquals('After setting .textContent, textNode.data == '
               + 'set through textContent', 'set through textContent',
               textNode.data);
  assertEquals('After setting .textContent, textNode.textContent == '
               + 'set through textContent', 'set through textContent',
               textNode.textContent);
              
  text = getDoc('mySVG').getElementById('myText');
  assertExists('SVG text element should exist', text);
  assertEquals('text.id == myText', 'myText', text.id);
  assertEquals('text.getAttribute(id) == myText', 'myText',
               text.getAttribute('id'));
  assertEquals("text.getAttribute('x') == 80", 80,
               text.getAttribute('x'));
  assertEquals("text.getAttribute('y') == 80", 80,
               text.getAttribute('y'));
  assertEquals("text.getAttribute('font-family') == Verdana", 'Verdana',
               text.getAttribute('font-family'));
  assertEquals("text.getAttribute('font-size') == 24", 24,
               text.getAttribute('font-size'));
  assertEquals("text.getAttribute('fill') == blue", 'blue',
               text.getAttribute('fill'));           
  assertNull('text.nodeValue == null', text.nodeValue);
  assertEquals('text.childNodes.length == 1', 1, text.childNodes.length);
  textNode = text.childNodes[0];
  assertExists('text.childNodes[0] should exist', textNode);
  assertEquals('textNode.nodeType == 3', 3, textNode.nodeType);
  assertEquals('textNode.nodeName == #text', '#text', textNode.nodeName);
  assertNull('textNode.localName == null', textNode.localName);
  assertNull('textNode.namespaceURI == null', textNode.namespaceURI);
  assertNull('textNode.prefix == null', textNode.prefix);
  assertEquals('textNode.childNodes.length == 0', 0,
               textNode.childNodes.length);
  assertEquals('textNode.ownerDocument == document or contentDocument', 
               getDoc('mySVG'), textNode.ownerDocument);
  textNode.nodeValue = 'hello world';
  assertEquals('textNode.nodeValue == hello world', 'hello world',
               textNode.nodeValue);
  assertEquals('textNode.data == hello world', 'hello world',
               textNode.data);
  assertEquals('textNode.textContent == hello world', 'hello world',
               textNode.textContent); 
  textNode.nodeValue = 'set through nodeValue';
  assertEquals('After setting .nodeValue, textNode.nodeValue == '
               + 'set through nodeValue', 'set through nodeValue',
               textNode.nodeValue);
  assertEquals('After setting .nodeValue, textNode.data == '
               + 'set through nodeValue', 'set through nodeValue',
               textNode.data);
  assertEquals('After setting .nodeValue, textNode.textContent == '
               + 'set through nodeValue', 'set through nodeValue',
               textNode.textContent);
  textNode.data = 'set through data';
  assertEquals('After setting .data, textNode.nodeValue == '
               + 'set through data', 'set through data',
               textNode.nodeValue);
  assertEquals('After setting .data, textNode.data == '
               + 'set through data', 'set through data',
               textNode.data);
  assertEquals('After setting .data, textNode.textContent == '
               + 'set through nodeValue', 'set through data',
               textNode.textContent);
  textNode.textContent = 'set through textContent';
  assertEquals('After setting .textContent, textNode.nodeValue == '
               + 'set through textContent', 'set through textContent',
               textNode.nodeValue);
  assertEquals('After setting .textContent, textNode.data == '
               + 'set through textContent', 'set through textContent',
               textNode.data);
  assertEquals('After setting .textContent, textNode.textContent == '
               + 'set through textContent', 'set through textContent',
               textNode.textContent);
               
  desc = getDoc('mySVG').getElementsByTagNameNS(svgns, 'desc');
  assertExists('There should be a DESC element', desc);
  if (_hasObjects) {
    assertEquals('There should be 1 DESC element', 1, desc.length);
  } else {
    assertEquals('There should be 2 DESC elements', 2, desc.length);
  }
  desc = desc[0];
  assertEquals('desc.nodeName == desc', 'desc', desc.nodeName);
  assertNull('desc.nodeValue == null', desc.nodeValue);
  assertEquals('desc.childNodes.length == 1', 1, desc.childNodes.length);
  text = desc.childNodes[0];
  assertEquals('text.nodeType == 3', 3, text.nodeType);
  assertEquals('text.nodeValue == This is a description',
               'This is a description', text.nodeValue);
  assertEquals('text.data == This is a description',
               'This is a description', text.data);
  assertEquals('text.textContent == This is a description',
               'This is a description', text.textContent);
  text.nodeValue = 'This is a description2';
  assertEquals('text.nodeValue == This is a description2',
               'This is a description2', text.nodeValue);
  assertEquals('text.data == This is a description2',
               'This is a description2', text.data);
  assertEquals('text.textContent == This is a description2',
               'This is a description2', text.textContent);                    
  text.data = 'This is a description3';
  assertEquals('text.nodeValue == This is a description3',
               'This is a description3', text.nodeValue);
  assertEquals('text.data == This is a description3',
               'This is a description3', text.data);
  assertEquals('text.textContent == This is a description3',
               'This is a description3', text.textContent);
  text.textContent = 'This is a description4';
  assertEquals('text.nodeValue == This is a description4',
               'This is a description4', text.nodeValue);
  assertEquals('text.data == This is a description4',
               'This is a description4', text.data);
  assertEquals('text.textContent == This is a description4',
               'This is a description4', text.textContent);
               
  title = getDoc('mySVG').getElementsByTagNameNS(svgns, 'title');
  assertExists('SVG title should exist', title);
  // bug test (all browsers and renderers): make sure that it's not the 
  // HTML title element. On Safari with the native renderer, it changes
  // the page title. All browsers return a null namespaceURI.
  // make sure that the HTML page title didn't change (Safari bug)
  head = document.getElementsByTagName('head')[0];
  assertExists('head.getElementsByTagName("title")',
               head.getElementsByTagName('title'));
  htmlTitle = head.getElementsByTagName('title');
  htmlTitle = htmlTitle[0];
  assertExists('htmlTitle should exist', htmlTitle);
  assertEquals('htmlTitle.innerHTML != This is a description4', true, 
                htmlTitle.innerHTML != 'This is a description4');
  assertExists('There should be a TITLE element', title);
  assertEquals('There should be 1 TITLE element', 1, title.length);
  title = title[0];
  assertEquals('title.namespaceURI == svgns', svgns,
               title.namespaceURI);
  // end bug test
  assertEquals('title.nodeName == title', 'title', title.nodeName);
  assertNull('title.nodeValue == null', title.nodeValue);
  assertEquals('title.childNodes.length == 1', 1, 
               title.childNodes.length);
  text = title.childNodes[0];
  assertEquals('text.nodeType == 3', 3, text.nodeType);
  assertEquals('text.nodeValue == This is a title',
               'This is a title', text.nodeValue);
  assertEquals('text.data == This is a title',
               'This is a title', text.data);
  assertEquals('text.textContent == This is a title',
               'This is a title', text.textContent);
  text.nodeValue = 'This is a title2';
  assertEquals('text.nodeValue == This is a title2',
               'This is a title2', text.nodeValue);
  assertEquals('text.data == This is a title2',
               'This is a title2', text.data);
  assertEquals('text.textContent == This is a title2',
               'This is a title2', text.textContent);                    
  text.data = 'This is a title3';
  assertEquals('text.nodeValue == This is a title3',
               'This is a title3', text.nodeValue);
  assertEquals('text.data == This is a title3',
               'This is a title3', text.data);
  assertEquals('text.textContent == This is a title3',
               'This is a title3', text.textContent);
  text.textContent = 'This is a title4';
  assertEquals('text.nodeValue == This is a title4',
               'This is a title4', text.nodeValue);
  assertEquals('text.data == This is a title4',
               'This is a title4', text.data);
  assertEquals('text.textContent == This is a title4',
               'This is a title4', text.textContent);
}

function testDOMHierarchyAccessors() {
  // parentNode, firstChild, lastChild, previousSibling, and nextSibling
  console.log('Testing parentNode, firstChild, lastChild, '
              + 'previousSibling, and nextSibling...');
              
  svg = getRoot('svg11242');
  div = document.getElementById('test_container');
  assertExists('svg.parentNode should exist', svg.parentNode);
  // FF and Safari with Flash
  if (_hasObjects) {
    doc = getDoc('svg11242');
    assertEquals('svg.parentNode.nodeName == #document', 
                 '#document', svg.parentNode.nodeName.toLowerCase());
  } else if (svg.parentNode.nodeName.toLowerCase() == 'embed') {
    assertEquals('svg.parentNode.nodeName == embed (non-IE browsers)', 
                 'embed', svg.parentNode.nodeName.toLowerCase());
    assertEquals('svg.parentNode.className == embedssvg '
                 + '(non-IE browsers)', 'embedssvg',
                 svg.parentNode.className);
  } else { // IE with Flash and FF and Safari using native support
    assertEquals('svg.parentNode.nodeName == div', 
                 'div', svg.parentNode.nodeName.toLowerCase());
    assertEquals('svg.parentNode.id == test_container', 'test_container', 
                 svg.parentNode.id);
  }
  
  if (_hasObjects) {
    assertNull('svg.previousSibling == null', svg.previousSibling);
    assertNull('svg.nextSibling == null', svg.nextSibling);
  } else {
    assertExists('svg.previousSibling should exist', svg.previousSibling);
    assertExists('svg.nextSibling should exist', svg.nextSibling);
    if (whitespaceAreNodes) { // FF and Safari
      assertEquals('svg.previousSibling.nodeType == 3', 3,
                   svg.previousSibling.nodeType);
      assertEquals('svg.nextSibling.nodeType == 3', 3,
                   svg.nextSibling.nodeType);
    } else { // IE
      assertEquals('svg.previousSibling.nodeName == svg', 'svg',
                   svg.previousSibling.nodeName);
      assertEquals('svg.previousSibling.id == svg2', 'svg2',
                   svg.previousSibling.id);
      assertEquals('svg.nextSibling.nodeName == h1', 'h1',
                   svg.nextSibling.nodeName.toLowerCase());
      assertEquals('svg.nextSibling.childNodes.length == 1', 1,
                   svg.nextSibling.childNodes.length);
      assertEquals('svg.nextSibling.childNodes[0].data == Test HTML H1', 
                   'Test HTML H1', svg.nextSibling.childNodes[0].data);
    }
  }
  
  assertExists('svg.firstChild should exist', svg.firstChild);
  assertEquals('svg.firstChild == svg.childNodes[0]', svg.childNodes[0],
               svg.firstChild);
  child = svg.firstChild;
  assertEquals('firstChild.nodeName == defs', 'defs', child.nodeName);
  assertEquals('firstChild.parentNode == svg', svg, child.parentNode);
  assertNull('firstChild.previousSibling == null', child.previousSibling);
  assertExists('firstChild.nextSibling should exist', child.nextSibling);
  if (_hasObjects) {
    assertEquals('firstChild.nextSibling.nodeName == script', 'script',
                 child.nextSibling.nodeName);
    // we never assigned an ID to the SCRIPT; make sure that the @id property
    // is still present though for the Native Handler (we generate a random
    // ID for the Flash Handler)
    if (renderer == 'native') {
      assertEquals('firstChild.nextSibling.id == ""', '', child.nextSibling.id);
    }
  } else {
    assertEquals('firstChild.nextSibling.nodeName == g', 'g',
                 child.nextSibling.nodeName);
    assertEquals('firstChild.nextSibling.id == g4337', 'g4337',
                 child.nextSibling.id);
  }
  assertExists('firstChild.firstChild should exist', child.firstChild);
  assertExists('firstChild.lastChild should exist', child.lastChild);
  assertEquals('firstChild.firstChild.nodeName == linearGradient',
               'linearGradient', child.firstChild.nodeName);
  assertEquals('firstChild.firstChild.id == linearGradient2361',
               'linearGradient2361', child.firstChild.id);
  assertEquals('firstChild.lastChild.nodeName == linearGradient',
               'linearGradient', child.lastChild.nodeName);
  assertEquals('firstChild.lastChild.id == linearGradient4485',
               'linearGradient4485', child.lastChild.id);
  assertEquals('firstChild.firstChild.parentNode == this (def)',
               child, child.firstChild.parentNode);
  assertEquals('firstChild.lastChild.parentNode == this (def)',
               child, child.lastChild.parentNode);
  
  assertExists('svg.lastChild should exist', svg.lastChild);
  assertEquals('svg.lastChild == svg.childNodes[last child]',
               svg.childNodes[svg.childNodes.length - 1],
               svg.lastChild);
  
  child = svg.lastChild;
  assertEquals('lastChild.nodeName == g', 'g', child.nodeName);
  assertEquals('lastChild.getAttribute(id) == g4337', 'g4337', 
               child.getAttribute('id'));
  assertEquals('lastChild.parentNode == svg', svg, child.parentNode);
  assertNull('lastChild.nextSibling == null', child.nextSibling);
  assertExists('lastChild.previousSibling should exist',
               child.previousSibling);
  if (_hasObjects) {
    // NOTE: When using Firefox with Firebug, Firebug will insert an html:div
    // into the SVG DOM
    if (!isFF || renderer == 'flash') {
      assertEquals('lastChild.previousSibling.nodeName == script', 'script',
                  child.previousSibling.nodeName);
    }
  } else {
    assertEquals('lastChild.previousSibling.nodeName == defs', 'defs',
                 child.previousSibling.nodeName);
  }
  assertExists('lastChild.firstChild should exist', child.firstChild);
  assertExists('lastChild.lastChild should exist', child.lastChild);
  assertEquals('lastChild.firstChild.nodeName == path',
               'path', child.firstChild.nodeName);
  assertEquals('lastChild.firstChild.id == path5427',
               'path5427', child.firstChild.id);
  assertEquals('lastChild.lastChild.nodeName == g',
               'g', child.lastChild.nodeName);
  assertEquals('lastChild.lastChild.id == layer1A',
               'layer1A', child.lastChild.id);
  assertEquals('lastChild.firstChild.parentNode == this (g)',
               child, child.firstChild.parentNode);
  assertEquals('lastChild.lastChild.parentNode == this (g)',
               child, child.lastChild.parentNode);
               
  metadata = getDoc('svg2').getElementsByTagNameNS(svgns, 'metadata')[0];
  svg = getRoot('svg2');
  assertEquals('metadata.parentNode == svg2', svg, 
               metadata.parentNode);
  assertExists('metadata.previousSibling should exist', 
               metadata.previousSibling);
  assertEquals('metadata.previousSibling.nodeName == sodipodi:namedview',
               'sodipodi:namedview', metadata.previousSibling.nodeName);
  assertExists('metadata.nextSibling should exist', metadata.nextSibling);
  if (_hasObjects) {
    assertEquals('metadata.nextSibling.nodeName == #text', '#text',
                 metadata.nextSibling.nodeName);
  } else {
    assertEquals('metadata.nextSibling.nodeName == g', 'g',
                 metadata.nextSibling.nodeName);
  }
  if (!_hasObjects) {
    assertEquals('metadata.nextSibling.id == layer1', 'layer1',
                metadata.nextSibling.id);
  }
  assertExists('metadata.firstChild should exist', metadata.firstChild);
  assertExists('metadata.lastChild should exist', metadata.lastChild);
  assertEquals('metadata.firstChild == metadata.lastChild)',
               metadata.lastChild, metadata.firstChild);
  rdf = metadata.firstChild;
  assertEquals('metadata.firstChild.nodeName == rdf:RDF', 'rdf:RDF',
               rdf.nodeName);
  assertExists('metadata.firstChild.parentNode', 
               rdf.parentNode);
  assertEquals('metadata.firstChild.parentNode == metadata node',
               metadata, rdf.parentNode);
  assertExists('metadata.firstChild.childNodes[0] should exist',
               rdf.childNodes[0]);
  cc = metadata.firstChild.childNodes[0];
  assertEquals('cc.nodeName == cc:Work', 'cc:Work', cc.nodeName);
  assertEquals('cc.parentNode == RDF node', rdf, cc.parentNode);
  assertExists('cc.firstChild should exist', cc.firstChild);
  assertExists('cc.lastChild should exist', cc.lastChild);
  format = cc.firstChild;
  type = cc.lastChild;
  assertEquals('cc.firstChild.nodeName == dc:format', 'dc:format',
               format.nodeName);
  assertEquals('cc.lastChild.nodeName == dc:type', 'dc:type',
               type.nodeName);
  assertEquals('cc.firstChild.nextSibling == cc.lastChild',
               cc.lastChild, format.nextSibling);
  assertNull('cc.firstChild.previousSibling == null', 
             format.previousSibling);
  assertEquals('cc.lastChild.previousSibling == cc.firstChild',
               cc.firstChild, type.previousSibling);
  assertNull('cc.lastChild.nextSibling == null', 
             type.nextSibling);
  assertExists('format.firstChild should exist (text node)',
               format.firstChild);
  assertExists('format.lastChild should exist (text node)',
               format.lastChild);
  assertEquals('format.childNodes.length == 1', 1, 
               format.childNodes.length);
  child = format.firstChild;
  assertEquals('format.firstChild.nodeType == 3', 3, child.nodeType);
  assertEquals('format.firstChild.data == image/svg+xml', 'image/svg+xml', 
               child.data);
  assertEquals('format.firstChild.parentNode == format', format,
               child.parentNode);
  assertNull('format.firstChild.nextSibling == null', child.nextSibling);
  assertNull('format.firstChild.nextSibling == null', 
             child.previousSibling);

  // append the node to an SVG node and ensure the values are correct, 
  // and when changed pass through to the Flash
  textNode = getDoc('svg2').createTextNode('hello world', true);
  textNode = format.appendChild(textNode);
  assertExists('svgText should have a DOM TEXT NODE', textNode);
  assertEquals('textNode.nodeType == 3', 3, textNode.nodeType);
  assertEquals('textNode.nodeName == #text', '#text', textNode.nodeName);
  assertNull('textNode.localName == ', textNode.localName);
  assertNull('textNode.namespaceURI == null', textNode.namespaceURI);
  assertNull('textNode.prefix == null', textNode.prefix);
  assertExists('textNode.childNodes should exist', textNode.childNodes);
  assertEquals('textNode.childNodes.length == 0', 0,
               textNode.childNodes.length);
  assertEquals('textNode.ownerDocument == document or contentDocument', 
               getDoc('svg2'), textNode.ownerDocument);
  assertEquals('textNode.nodeValue == hello world', 'hello world',
               textNode.nodeValue);
  assertEquals('textNode.data == hello world', 'hello world',
               textNode.data);
  assertEquals('textNode.textContent == hello world', 'hello world',
               textNode.textContent);
  textNode.nodeValue = 'set through nodeValue';
  assertEquals('After setting .nodeValue, textNode.nodeValue == '
               + 'set through nodeValue', 'set through nodeValue',
               textNode.nodeValue);
  assertEquals('After setting .nodeValue, textNode.data == '
               + 'set through nodeValue', 'set through nodeValue',
               textNode.data);
  assertEquals('After setting .nodeValue, textNode.textContent == '
               + 'set through nodeValue', 'set through nodeValue',
               textNode.textContent);
  textNode.data = 'set through data';
  assertEquals('After setting .data, textNode.nodeValue == '
               + 'set through data', 'set through data',
               textNode.nodeValue);
  assertEquals('After setting .data, textNode.data == '
               + 'set through data', 'set through data',
               textNode.data);
  assertEquals('After setting .data, textNode.textContent == '
               + 'set through nodeValue', 'set through data',
               textNode.textContent);
  textNode.textContent = 'set through textContent';
  assertEquals('After setting .textContent, textNode.nodeValue == '
               + 'set through textContent', 'set through textContent',
               textNode.nodeValue);
  assertEquals('After setting .textContent, textNode.data == '
               + 'set through textContent', 'set through textContent',
               textNode.data);
  assertEquals('After setting .textContent, textNode.textContent == '
               + 'set through textContent', 'set through textContent',
               textNode.textContent);
}

function testAppendChild() {
  // appendChild
  console.log('Testing appendChild...');
  
  // create an SVG visual element circle and attach it to a group,
  // then retrieve it from the page by ID and make sure it's properties
  // are present, then change one of them on the circle and make sure
  // it goes through
  circle = getDoc('mySVG').createElementNS(svgns, 'circle');
  assertExists('circle should exist', circle);
  assertEquals('circle.nodeType == 1', 1, circle.nodeType);
  assertNull('circle.prefix == null', circle.prefix);
  assertEquals('circle.namespaceURI == svgns', svgns, 
               circle.namespaceURI);
  assertEquals('circle.nodeName == circle', 'circle', circle.nodeName);
  assertEquals('circle.localName == circle', 'circle', circle.localName);
  assertNull('circle.parentNode == null', circle.parentNode);
  assertNull('circle.firstChild == null', circle.firstChild);
  assertNull('circle.lastChild == null', circle.lastChild);
  assertNull('circle.nextSibling == null', circle.nextSibling);
  assertNull('circle.previousSibling == null', circle.previousSibling);
  assertExists('circle.childNodes should exist', circle.childNodes);
  assertEquals('circle.childNodes.length == 0', 0, 
               circle.childNodes.length);
  circle.setAttribute('cx', 100);
  assertEquals('before appending, circle.cx', 100,
               circle.getAttribute('cx'));
  circle.setAttribute('cy', 50);
  assertEquals('before appending, circle.cy', 50,
               circle.getAttribute('cy'));
  circle.setAttribute('r', 40);
  assertEquals('before appending, circle.r', 40,
               circle.getAttribute('r'));
  circle.setAttribute('stroke', 'black');
  assertEquals('before appending, circle.stroke', 'black',
               circle.getAttribute('stroke'));
  circle.setAttribute('stroke-width', 2);
  assertEquals('before appending, circle.stroke-width', 2,
               circle.getAttribute('stroke-width'));
  circle.setAttribute('fill', 'red');
  assertEquals('before appending, circle.fill', 'red',
               circle.getAttribute('fill'));
  circle.id = 'myCircle2';
  assertEquals('circle.id == myCircle2', 'myCircle2', circle.id);
  assertEquals('circle.getAttribute(id) == myCircle2', 'myCircle2',
               circle.getAttribute('id'));
  circle.setAttribute('id', 'myCircle');
  assertEquals('circle.id == myCircle', 'myCircle', circle.id);
  assertEquals('circle.getAttribute(id) == myCircle', 'myCircle',
               circle.getAttribute('id'));
  group = getDoc('mySVG').getElementById('myGroup');
  assertExists('myGroup should exist', group);
  assertEquals('group.id == myGroup', 'myGroup', group.getAttribute('id'));
  lengthBefore = group.childNodes.length;
  group.appendChild(circle);
  // test our post-append properties using the circle object reference
  assertEquals('group.lastChild == circle', group.lastChild,
               circle);
  assertEquals('group.childNodes.length > lengthBefore + 1',
               lengthBefore + 1, group.childNodes.length);
  assertEquals('group.childNodes[last child] == circle',
               circle, group.childNodes[group.childNodes.length - 1]);
  assertEquals('circle.nodeType == 1', 1, circle.nodeType);
  assertEquals('circle.nodeName == circle', 'circle', circle.nodeName);
  assertNull('circle.prefix == null', circle.prefix);
  assertEquals('circle.namespaceURI == svgns', svgns, circle.namespaceURI);
  assertEquals('circle.localName == circle', 'circle', circle.localName);
  assertEquals('circle.parentNode == myGroup', group, circle.parentNode);
  child = group.childNodes[group.childNodes.length - 2];
  assertEquals('next to last childNode for group == circle.previousSibling',
               child, circle.previousSibling);
  assertEquals('(next to last childNode for group).nextSibling == circle',
               circle, child.nextSibling);
  assertNull('circle.nextSibling == null', circle.nextSibling);
  assertNull('circle.firstChild == null', circle.firstChild);
  assertNull('circle.lastChild == null', circle.lastChild);
  // now do these post-append circle tests again, but after retrieving 
  // it by ID
  circle = getDoc('mySVG').getElementById('myCircle');
  assertExists('myCircle should exist', circle);
  assertEquals('circle.id == myCircle', 'myCircle', circle.id);
  assertEquals('group.lastChild == circle', group.lastChild, circle);
  assertEquals('group.childNodes.length > lengthBefore + 1',
               lengthBefore + 1, group.childNodes.length);
  assertEquals('group.childNodes[last child] == circle',
               circle, group.childNodes[group.childNodes.length - 1]);
  assertEquals('circle.nodeType == 1', 1, circle.nodeType);
  assertEquals('circle.nodeName == circle', 'circle', circle.nodeName);
  assertNull('circle.prefix == null', circle.prefix);
  assertEquals('circle.namespaceURI == svgns', svgns, circle.namespaceURI);
  assertEquals('circle.localName == circle', 'circle', circle.localName);
  assertEquals('circle.parentNode == myGroup', group, circle.parentNode);
  child = group.childNodes[group.childNodes.length - 2];
  assertEquals('next to last childNode for group == circle.previousSibling',
               child, circle.previousSibling);
  assertEquals('(next to last childNode for group).nextSibling == circle',
               circle, child.nextSibling);
  assertNull('circle.nextSibling == null', circle.nextSibling);
  assertNull('circle.firstChild == null', circle.firstChild);
  assertNull('circle.lastChild == null', circle.lastChild);
  assertEquals('after appending, circle.cx', 100,
               circle.getAttribute('cx'));
  assertEquals('after appending, circle.cy', 50,
               circle.getAttribute('cy'));
  assertEquals('after appending, circle.r', 40,
               circle.getAttribute('r'));
  assertEquals('after appending, circle.stroke', 'black',
               circle.getAttribute('stroke'));
  assertEquals('after appending, circle.stroke-width', 2,
               circle.getAttribute('stroke-width'));
  assertEquals('after appending, circle.fill', 'red',
               circle.getAttribute('fill'));
  // now rename the ID and make sure it takes hold
  circle.id = 'myCircle3';
  assertExists('document.getElementById(myCircle3) should exist',
               getDoc('mySVG').getElementById('myCircle3'));
  assertNull('document.getElementById(myCircle) == null',
             getDoc('mySVG').getElementById('myCircle'));
  assertNull('document.getElementById(myCircle2) == null',
             getDoc('mySVG').getElementById('myCircle2'));
  // now make sure we can get the circle through 
  // getElementsByTagNameNS
  circle = null;
  matches = getDoc('mySVG').getElementsByTagNameNS(svgns, 'circle');
  for (var i = 0; i < matches.length; i++) {
    if (matches[i].getAttribute('id') == 'myCircle3') {
      circle = matches[i];
      break;
    }
  }
  assertExists('circle should exist after getElementsByTagNameNS', circle);
  circle.setAttribute('id', 'myCircle');
  
  // create an SVG visual element path and attach it to an
  // SVG root element. give it no ID, but set a custom attribute
  // instead. retrieve it from the page by 
  // getElementsByTagNameNS and make sure it's properties are present, 
  // then change one of them and make sure it goes through
  path = getDoc('mySVG').createElementNS(svgns, 'path');
  assertExists('path should exist', path);
  path.setAttribute('d', 'M -20.133478,316.78351 C -2.5343923,300.86446 23.150308,304.80212 43.988839,310.96541 C 64.182313,311.03608 84.995525,308.01108 102.22691,296.84598 C 116.66515,291.19078 133.79301,284.32476 148.30745,293.77777 C 164.10698,306.69071 183.19684,310.30976 201.28953,299.86958 C 220.6633,293.25475 231.73414,283.23716 251.94853,283.33722 C 273.59866,283.44962 280.81344,306.25205 297.64771,310.93883 C 318.87056,316.8474 338.07631,304.09275 351.47223,307.28886 C 365.27894,310.58296 386.98702,326.3148 408.2949,324.48886 C 425.22232,319.70984 428.34402,315.64725 448.13463,315.6678 C 459.12426,315.44023 482.48913,306.95039 477.97163,325.59815 C 478.30341,380.34313 478.63519,424.53633 478.96697,479.2813 C 309.08287,477.17096 139.1988,475.06064 -30.685293,472.9503 C -27.16803,420.89469 -23.650742,368.83911 -20.133478,316.78351 z ');
  assertEquals('path should have long d attribute',
               'M -20.133478,316.78351 C -2.5343923,300.86446 23.150308,304.80212 43.988839,310.96541 C 64.182313,311.03608 84.995525,308.01108 102.22691,296.84598 C 116.66515,291.19078 133.79301,284.32476 148.30745,293.77777 C 164.10698,306.69071 183.19684,310.30976 201.28953,299.86958 C 220.6633,293.25475 231.73414,283.23716 251.94853,283.33722 C 273.59866,283.44962 280.81344,306.25205 297.64771,310.93883 C 318.87056,316.8474 338.07631,304.09275 351.47223,307.28886 C 365.27894,310.58296 386.98702,326.3148 408.2949,324.48886 C 425.22232,319.70984 428.34402,315.64725 448.13463,315.6678 C 459.12426,315.44023 482.48913,306.95039 477.97163,325.59815 C 478.30341,380.34313 478.63519,424.53633 478.96697,479.2813 C 309.08287,477.17096 139.1988,475.06064 -30.685293,472.9503 C -27.16803,420.89469 -23.650742,368.83911 -20.133478,316.78351 z ',
               path.getAttribute('d'));
  assertEquals('path.id == ""', '', path.id);
  assertNull('path.getAttribute(fill) before setting == null',
             path.getAttribute('fill'));
  path.setAttribute('fill', '#585a53');
  assertEquals('path.getAttribute(fill) == #585a53', '#585a53',
               path.getAttribute('fill'));
  assertNull('path.getAttribute(somethingCustom) == null', 
             path.getAttribute('somethingCustom'));
  path.setAttribute('somethingCustom', 'foo');
  assertEquals('path.getAttribute(somethingCustom) == foo', 'foo',
               path.getAttribute('somethingCustom'));
  assertEquals('path.nodeType == 1', 1, path.nodeType);
  assertNull('path.prefix == null', path.prefix);
  assertEquals('path.namespaceURI == svgns', svgns, 
               path.namespaceURI);
  assertEquals('path.nodeName == path', 'path', path.nodeName);
  assertEquals('path.localName == path', 'path', path.localName);
  assertNull('path.parentNode == null', path.parentNode);
  assertNull('path.firstChild == null', path.firstChild);
  assertNull('path.lastChild == null', path.lastChild);
  assertNull('path.nextSibling == null', path.nextSibling);
  assertNull('path.previousSibling == null', path.previousSibling);
  assertExists('path.childNodes should exist', path.childNodes);
  assertEquals('path.childNodes.length == 0', 0, 
               path.childNodes.length);
  svg = getRoot('mySVG');
  lengthBefore = svg.childNodes.length;
  temp = svg.appendChild(path);
  // make sure appendChild returns good results
  assertExists('path should exist', temp);
  assertExists('path should exist', path);
  assertEquals('path == appendChild result', path, temp);
  // make sure things really got appended
  assertEquals('svg.childNodes.length > lengthBefore',
               lengthBefore + 1, svg.childNodes.length);
  assertEquals('svg.lastChild == path', path, svg.lastChild);
  assertEquals('svg.childNodes[last child] == path', path,
               svg.childNodes[svg.childNodes.length - 1]);
  // check values post-appendChild using object reference
  assertEquals('path.nodeType == 1', 1, path.nodeType);
  assertNull('path.prefix == null', path.prefix);
  assertEquals('path.namespaceURI == svgns', svgns, path.namespaceURI);
  assertEquals('path.nodeName == path', 'path', path.nodeName);
  assertEquals('path.localName == path', 'path', path.localName);
  assertEquals('path.parentNode == svg', svg, path.parentNode);
  assertNull('path.firstChild == null', path.firstChild);
  assertNull('path.lastChild == null', path.lastChild);
  assertNull('path.nextSibling == null', path.nextSibling);
  // NOTE: It is a known issue that on IE sometimes two text nodes that
  // should be identical won't have == be true
  if (!isIE) {
    assertEquals('path.previousSibling == svg.childNodes[2nd to last child]', 
                 svg.childNodes[svg.childNodes.length - 2], 
                 path.previousSibling);
  }             
  assertExists('path.childNodes should exist', path.childNodes);
  assertEquals('path.childNodes.length == 0', 0, 
               path.childNodes.length);
  assertEquals('path.getAttribute(somethingCustom) == foo', 'foo',
               path.getAttribute('somethingCustom'));
  assertEquals('path.getAttribute(fill) == #585a53', '#585a53',
               path.getAttribute('fill'));
  assertEquals('path.id == ""', '', path.id);
  // get the element through getElementsByTagNameNS, then check it's
  // DOM sibling/child properties
  // FIXME (IMPORTANT): The following call is way too slow (~850ms);
  // find out what is going on and optimize, probably because there
  // are so many PATHs on the page (~450) and each is pretty heavy to 
  // initialize (about 2 ms to initialize each PATH)
  matches = getDoc('mySVG').getElementsByTagNameNS(svgns, 'path');
  path = null;
  for (var i = 0; i < matches.length; i++) {
    if (matches[i].getAttribute('somethingCustom') == 'foo') {
      path = matches[i];
      break;
    }
  }
  assertExists('path should exist after getElementsByTagNameNS', path);
  assertEquals('path.parentNode == svg', svg, path.parentNode);
  assertNull('path.nextSibling == null', path.nextSibling);
  child = svg.childNodes[svg.childNodes.length - 2];
  assertExists('child should exist', child);
  // NOTE: It is a known issue that on IE sometimes two text nodes that
  // should be identical won't have == be true
  if (!isIE) {
    assertEquals('path.previousSibling == child', child, 
                 path.previousSibling);
  }
  assertEquals('child.nextSibling == path', path, child.nextSibling);
  assertNull('path.firstChild == null', path.firstChild);
  assertNull('path.lastChild == null', path.lastChild);
  assertEquals('path.childNodes.length == 0', 0, path.childNodes.length);
  assertEquals('path.id == ""', '', path.id);
  path.setAttribute('stroke-width', '5px');
  assertEquals('path.getAttribute(stroke-width) == 5px', '5px',
               path.getAttribute('stroke-width'));
  
  // create a metadata node, then create a namespaced dublin core
  // element, then attach it and attach both to an SVG root element.
  // make sure to give the dublic core element an ID, then retrieve it
  // by ID to ensure it shows up in the DOM and is retrievable
  metadata = getDoc('mySVG').createElementNS(svgns, 'metadata');
  assertExists('metadata should exist', metadata);
  assertEquals('metadata.nodeName == metadata', 'metadata', 
               metadata.nodeName);
  metadata.id = 'myMetadata';
  dc = getDoc('mySVG').createElementNS(dc_ns, 'dc:creator');
  assertEquals('dc.nodeName == dc:creator', 'dc:creator', dc.nodeName);
  assertEquals('dc.nodeType == 1', 1, dc.nodeType);
  assertEquals('dc.prefix == dc', 'dc', dc.prefix);
  assertEquals('dc.namespaceURI == dc_ns', dc_ns, dc.namespaceURI);
  assertEquals('dc.localName == creator', 'creator', dc.localName);
  assertNull('dc.parentNode == null', dc.parentNode);
  assertNull('dc.firstChild == null', dc.firstChild);
  assertNull('dc.lastChild == null', dc.lastChild);
  assertNull('dc.previousSibling == null', dc.previousSibling);
  assertNull('dc.nextSibling == null', dc.nextSibling);
  assertEquals('dc.childNodes.length == 0', 0, dc.childNodes.length);
  text = getDoc('mySVG').createTextNode('Brad Neuberg', true);
  dc.appendChild(text);
  assertEquals('text.nodeType == 3', 3, text.nodeType);
  assertEquals('text.nodeName == #text', '#text', text.nodeName);
  assertNull('text.prefix == null', text.prefix);
  assertNull('text.namespaceURI == null', text.namespaceURI);
  assertEquals('dc.childNodes.length == 1', 1, dc.childNodes.length);
  dc.setAttribute('id', 'dcCreator');
  svg = getRoot('mySVG');
  temp = svg.appendChild(metadata);
  metadata.appendChild(dc);
  assertEquals('metadata == temp', metadata, temp);
  // now test values post-appendChild
  metadata = getDoc('mySVG').getElementById('myMetadata');
  assertExists('metadata should exist', metadata);
  dc = getDoc('mySVG').getElementById('dcCreator');
  assertExists('dc:creator should exist', dc);
  assertEquals('metadata.childNodes.length == 1', 1, 
               metadata.childNodes.length);
  assertEquals('metadata.firstChild == dc', dc, metadata.firstChild);
  assertEquals('metadata.lastChild == dc', dc, metadata.lastChild);
  assertEquals('metadata.childNodes[0] == dc', dc, 
               metadata.childNodes[0]);
  dc = metadata.firstChild;
  assertEquals('dc.nodeName == dc:creator', 'dc:creator', dc.nodeName);
  assertEquals('dc.nodeType == 1', 1, dc.nodeType);
  assertEquals('dc.prefix == dc', 'dc', dc.prefix);
  assertEquals('dc.namespaceURI == dc_ns', dc_ns, dc.namespaceURI);
  assertEquals('dc.localName == creator', 'creator', dc.localName);
  assertEquals('dc.parentNode == metadata', metadata, dc.parentNode);
  text = dc.firstChild;
  assertExists('text node should exist', text);
  assertEquals('text.nodeName == #text', '#text', text.nodeName);
  assertEquals('text.nodeType == 3', 3, text.nodeType);
  assertEquals('text.data == Brad Neuberg', 'Brad Neuberg', text.data);
  assertEquals('text.textContent == Brad Neuberg', 'Brad Neuberg', 
               text.data);
  assertEquals('text.nodeValue == Brad Neuberg', 'Brad Neuberg', 
               text.nodeValue);
  assertEquals('text.parentNode == dc', dc, text.parentNode);
  assertNull('text.firstChild == null', text.firstChild);
  assertNull('text.lastChild == null', text.lastChild);
  assertNull('text.nextSibling == null', text.nextSibling);
  assertNull('text.previousSibling == null', text.previousSibling);
  assertEquals('text.childNodes.length == 0', 0, text.childNodes.length);
  assertEquals('dc.firstChild == text node', text, dc.firstChild);
  assertEquals('dc.lastChild == text node', text, dc.lastChild);
  assertEquals('dc.lastChild == dc.firstChild', dc.firstChild, 
               dc.lastChild);
  assertNull('dc.nextSibling == null', dc.nextSibling);
  assertNull('dc.previousSibling == null', dc.previousSibling);
  // change text node value and make sure it maps over
  text.data = 'James Hight';
  // make sure it shows up in getElementsByTagNameNS
  matches = getDoc('mySVG').getElementsByTagNameNS(dc_ns, 'creator');
  dc = null;
  for (var i = 0; i < matches.length; i++) {
    if (matches[i].id == 'dcCreator') {
      dc = matches[i];
    }
  }
  assertExists('dc should exist after getElementsByTagNameNS', dc);
  assertEquals('dc.nodeName == dc:creator', 'dc:creator', dc.nodeName);
  text = dc.childNodes[0];
  assertEquals('text node == James Hight', 'James Hight', 
               text.textContent);
  // change the ID and ensure it maps over
  dc.id = 'dcCreator2';
  assertEquals('dc.id == dcCreator2', 'dcCreator2', dc.id);
  dc = getDoc('mySVG').getElementById('dcCreator2');
  assertExists('dcCreator2 should exist', dc);
  dc = getDoc('mySVG').getElementById('dcCreator');
  assertNull('dcCreator should not exist', dc);
  
  // create multiple children and append all of them one at a time
  // to ensure that appending past a first element works
  group = getDoc('svg11242').createElementNS(svgns, 'g');
  path = getDoc('svg11242').createElementNS(svgns, 'path');
  path.id = 'group_path1';
  group.appendChild(path);
  path = getDoc('svg11242').createElementNS(svgns, 'path');
  path.id = 'group_path2';
  group.appendChild(path);
  path = getDoc('svg11242').createElementNS(svgns, 'path');
  path.id = 'group_path3';
  group.appendChild(path);
  path = getDoc('svg11242').createElementNS(svgns, 'path');
  path.id = 'group_path4';
  group.appendChild(path);
  path = getDoc('svg11242').createElementNS(svgns, 'path');
  path.id = 'group_path5';
  group.appendChild(path);
  svg = getDoc('svg11242').getElementById('svg11242');
  nextToLast = svg.lastChild;
  svg.appendChild(group);
  group = nextToLast.nextSibling; // should be our new group
  assertExists('Group of created paths should exist', group);
  assertEquals('group.childNodes.length == 5', 5, 
               group.childNodes.length);
  assertEquals('group.childNodes[0].getAttribute(id) == group_path1',
               'group_path1', group.childNodes[0].getAttribute('id'));
  assertEquals('group.childNodes[1].getAttribute(id) == group_path2',
               'group_path2', group.childNodes[1].getAttribute('id'));
  assertEquals('group.childNodes[2].getAttribute(id) == group_path3',
               'group_path3', group.childNodes[2].getAttribute('id'));
  assertEquals('group.childNodes[3].getAttribute(id) == group_path4',
               'group_path4', group.childNodes[3].getAttribute('id'));
  assertEquals('group.childNodes[4].getAttribute(id) == group_path5',
               'group_path5', group.childNodes[4].getAttribute('id'));
      
  // create a linearGradient, create its stop elements,
  // attach it to a defs element, then modify
  // an existing element to use this linearGradient
  defs = getDoc('mySVG').createElementNS(svgns, 'defs');
  gradient = getDoc('mySVG').createElementNS(svgns, 'linearGradient');
  gradient.id = 'myGradient';
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('x2', '100%');
  gradient.setAttribute('y2', '0%');
  defs.appendChild(gradient);
  stop = getDoc('mySVG').createElementNS(svgns, 'stop');
  stop.setAttribute('stop-color', 'blue');
  stop.setAttribute('offset', 0);
  gradient.appendChild(stop);
  stop = getDoc('mySVG').createElementNS(svgns, 'stop');
  stop.setAttribute('stop-color', 'red');
  stop.setAttribute('offset', 1);
  gradient.appendChild(stop);
  svg = getDoc('mySVG').getElementById('mySVG');
  svg.appendChild(defs);
  circle = getDoc('mySVG').getElementById('myCircle');
  circle.setAttribute('fill', 'url(#myGradient)');
  
  // create a DESC element, then create a text node, and append
  // both together than append the DESC element to a G element
  desc = getDoc('svg2').createElementNS(svgns, 'desc');
  text = getDoc('svg2').createTextNode('This is a test desc - dynamic', true);
  desc.appendChild(text);
  group = getDoc('svg2').getElementById('layer1');
  group.appendChild(desc);
  // bug test - embed2 already has a <desc> element; a bug was incorrectly
  // causing _its_ data value to also change at this time (Issue 94)
  assertEquals('myDesc over in svg2 should _not_ have its value changed; it '
               + 'should be: This is a description',
               'This is a description',
               getDoc('svg2').getElementById('myDesc').firstChild.data);
  assertEquals('myDesc over in svg2 should _not_ have its value changed; it '
               + 'should be: This is a description',
               'This is a description',
               getDoc('svg2').getElementById('myDesc').childNodes[0].data); 
  assertEquals('myDesc over in svg2 should _not_ have its value changed; it '
               + 'should be: This is a description',
               'This is a description',
               getDoc('svg2').getElementById('myDesc').lastChild.data);  
  // end bug test
  matches = getDoc('svg2').getElementsByTagNameNS(svgns, 'desc');
  desc = null;
  for (var i = 0; i < matches.length; i++) {
    var m = matches[i];
    if (m.childNodes.length > 0 
        && m.childNodes[0].data == 'This is a test desc - dynamic') {
      desc = matches[i];
    }
  }
  assertExists('desc should exist', desc);
  assertEquals('desc.parentNode == group', group, desc.parentNode);
  //
  // FIXME: This is known to fail, since object equality in some
  // cases for text nodes doesn't work for us
  //assertEquals('desc.childNodes[0] == text', text, desc.childNodes[0]);
  //
  // change the value of the text node through the original object
  // returned from createTextNode
  text.nodeValue = 'Changed desc';
  assertEquals('desc.childNodes[0].nodeValue == Changed desc',
               'Changed desc', desc.childNodes[0].nodeValue);
  
  // create an SVG TEXT element, append it, then change it's
  // text value and make sure that shows up
  text = getDoc('mySVG').createElementNS(svgns, 'text');
  text.setAttribute('x', 0);
  text.setAttribute('y', 300);
  text.setAttribute('fill', 'green');
  textNode = getDoc('mySVG').createTextNode('You should see this text', true);
  textNode = text.appendChild(textNode);
  group = getDoc('mySVG').getElementById('myGroup');
  group.appendChild(text);
  textNode.data = 'Even more text';
  assertEquals('textNode.data == Even more text', 'Even more text',
          getDoc('mySVG').getElementById('myGroup').lastChild.firstChild.data);
  // bug test -- the internal XML data structures would get messed up in
  // some scenarios
  text.setAttribute('id', 'SomeSVGText');
  assertEquals('textNode.parentNode.id == SomeSVGText', 'SomeSVGText',
               textNode.parentNode.id);
  // end bug test
               
  // make sure using createElementNS still works if originally present
  node = document.createElementNS('http://www.w3.org/1999/xhtml', 'h1');
  node.setAttribute('id', 'testH1');
  node.appendChild(document.createTextNode('hello world!'));
  document.getElementsByTagName('body')[0].appendChild(node);
  node = document.getElementById('testH1');
  assertExists('H1 node should exist', node);
  assertEquals('node.nodeName == h1', 'h1', 
               node.nodeName.toLowerCase());
  assertEquals('H1 content should be == hello world!', 'hello world!',
               node.childNodes[0].data);
               
  // do same test but use createTextNode(text, false)
  node = document.createElementNS('http://www.w3.org/1999/xhtml', 'h1');
  node.setAttribute('id', 'anotherH1');
  node.appendChild(document.createTextNode('hello world!'), false);
  document.getElementsByTagName('body')[0].appendChild(node);
  node = document.getElementById('anotherH1');
  assertExists('H1 node should exist', node);
  assertEquals('node.nodeName == h1', 'h1', 
               node.nodeName.toLowerCase());
  assertEquals('H1 content should be == hello world!', 'hello world!',
               node.childNodes[0].data);

  // add a test where have a group with multiple children; then,
  // do an appendChild and test to make sure that
  // next/previous sibling relationships work correctly on all the
  // nodes. Everything should be unattached.
  group = getDoc('svg11242').createElementNS(svgns, 'g');
  group.id = 'testPathsGroup';
  paths = [];
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  // note that we've used this ID before; should be ok and should still
  // work since this node will remain unattached
  paths[0].id = 'group_path1';
  group.appendChild(paths[0]);
  assertTrue('unattached paths[0].id(group_path1) '
              + '!= document.getElementById(group_path1)',
              paths[0] != getDoc('svg11242').getElementById('group_path1'));
  // change the ID on the unattached node; should not affect the
  // attached node with same ID
  paths[0].id = 'group_path100';
  assertExists('document.getElementById(group_path1)',
               getDoc('svg11242').getElementById('group_path1'));
  assertNull('document.getElementById(group_path100) == null',
               getDoc('svg11242').getElementById('group_path100')); 
  // now create the other paths
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[1].id = 'group_path200';
  group.appendChild(paths[1]);
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[2].id = 'group_path300';
  group.appendChild(paths[2]);
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[3].id = 'group_path400';
  group.appendChild(paths[3]);
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[4].id = 'group_path500';
  group.appendChild(paths[4]);
  assertExists('Group of created paths should exist', group);
  assertEquals('group.childNodes.length == 5', 5, 
               group.childNodes.length);
  assertEquals('group.childNodes[0].getAttribute(id) == group_path100',
               'group_path100', group.childNodes[0].getAttribute('id'));
  assertEquals('group.childNodes[1].getAttribute(id) == group_path200',
               'group_path200', group.childNodes[1].getAttribute('id'));
  assertEquals('group.childNodes[2].getAttribute(id) == group_path300',
               'group_path300', group.childNodes[2].getAttribute('id'));
  assertEquals('group.childNodes[3].getAttribute(id) == group_path400',
               'group_path400', group.childNodes[3].getAttribute('id'));
  assertEquals('group.childNodes[4].getAttribute(id) == group_path500',
               'group_path500', group.childNodes[4].getAttribute('id'));
  // nextSibling/previousSibling for group_path100
  assertNull('group_path100.previousSibling == null',
             paths[0].previousSibling);
  assertEquals('group_path100.nextSibling == group_path200',
               paths[1], paths[0].nextSibling);
  assertEquals('group_path100.parentNode.id == testPathsGroup', 
               'testPathsGroup', paths[0].parentNode.id);
  assertEquals('group_path100.parentNode == group', group,
               paths[0].parentNode);
  // nextSibling/previousSibling for group_path200
  assertEquals('group_path200.previousSibling == group_path100',
             paths[0], paths[1].previousSibling);
  assertEquals('group_path200.nextSibling == group_path300',
               paths[2], paths[1].nextSibling);
  assertEquals('group_path200.parentNode.id == testPathsGroup', 
               'testPathsGroup', paths[1].parentNode.id);
  assertEquals('group_path200.parentNode == group', group,
               paths[1].parentNode);
  // nextSibling/previousSibling for group_path300
  assertEquals('group_path300.previousSibling == group_path200',
             paths[1], paths[2].previousSibling);
  assertEquals('group_path300.nextSibling == group_path400',
               paths[3], paths[2].nextSibling);
  assertEquals('group_path300.parentNode.id == testPathsGroup', 
               'testPathsGroup', paths[2].parentNode.id);
  assertEquals('group_path300.parentNode == group', group,
               paths[2].parentNode);
  // nextSibling/previousSibling for group_path400
  assertEquals('group_path400.previousSibling == group_path300',
             paths[2], paths[3].previousSibling);
  assertEquals('group_path400.nextSibling == group_path500',
               paths[4], paths[3].nextSibling);
  assertEquals('group_path400.parentNode.id == testPathsGroup', 
               'testPathsGroup', paths[3].parentNode.id);
  assertEquals('group_path400.parentNode == group', group,
               paths[3].parentNode);
  // nextSibling/previousSibling for group_path500
  assertEquals('group_path500.previousSibling == group_path400',
             paths[3], paths[4].previousSibling);
  assertNull('group_path500.nextSibling == null',
             paths[4].nextSibling);
  assertEquals('group_path500.parentNode.id == testPathsGroup', 
               'testPathsGroup', paths[4].parentNode.id);
  assertEquals('group_path500.parentNode == group', group,
               paths[4].parentNode);
  // append the group node, then remove it, and make sure all the
  // sibling information is still correct
  svg = getRoot('svg11242');
  svg.appendChild(group);
  group = svg.removeChild(group);
  assertExists('Group of created paths should exist', group);
  assertEquals('group.childNodes.length == 5', 5, 
               group.childNodes.length);
  assertEquals('group.childNodes[0].getAttribute(id) == group_path100',
               'group_path100', group.childNodes[0].getAttribute('id'));
  assertEquals('group.childNodes[1].getAttribute(id) == group_path200',
               'group_path200', group.childNodes[1].getAttribute('id'));
  assertEquals('group.childNodes[2].getAttribute(id) == group_path300',
               'group_path300', group.childNodes[2].getAttribute('id'));
  assertEquals('group.childNodes[3].getAttribute(id) == group_path400',
               'group_path400', group.childNodes[3].getAttribute('id'));
  assertEquals('group.childNodes[4].getAttribute(id) == group_path500',
               'group_path500', group.childNodes[4].getAttribute('id'));
  // nextSibling/previousSibling for group_path100
  assertNull('group_path100.previousSibling == null',
             paths[0].previousSibling);
  assertEquals('group_path100.nextSibling == group_path200',
               paths[1], paths[0].nextSibling);
  assertEquals('group_path100.parentNode.id == testPathsGroup', 
               'testPathsGroup', paths[0].parentNode.id);
  assertEquals('group_path100.parentNode == group', group,
               paths[0].parentNode);
  // nextSibling/previousSibling for group_path200
  assertEquals('group_path200.previousSibling == group_path100',
             paths[0], paths[1].previousSibling);
  assertEquals('group_path200.nextSibling == group_path300',
               paths[2], paths[1].nextSibling);
  assertEquals('group_path200.parentNode.id == testPathsGroup', 
               'testPathsGroup', paths[1].parentNode.id);
  assertEquals('group_path200.parentNode == group', group,
               paths[1].parentNode);
  // nextSibling/previousSibling for group_path300
  assertEquals('group_path300.previousSibling == group_path200',
             paths[1], paths[2].previousSibling);
  assertEquals('group_path300.nextSibling == group_path400',
               paths[3], paths[2].nextSibling);
  assertEquals('group_path300.parentNode.id == testPathsGroup', 
               'testPathsGroup', paths[2].parentNode.id);
  assertEquals('group_path300.parentNode == group', group,
               paths[2].parentNode);
  // nextSibling/previousSibling for group_path400
  assertEquals('group_path400.previousSibling == group_path300',
             paths[2], paths[3].previousSibling);
  assertEquals('group_path400.nextSibling == group_path500',
               paths[4], paths[3].nextSibling);
  assertEquals('group_path400.parentNode.id == testPathsGroup', 
               'testPathsGroup', paths[3].parentNode.id);
  assertEquals('group_path400.parentNode == group', group,
               paths[3].parentNode);
  // nextSibling/previousSibling for group_path500
  assertEquals('group_path500.previousSibling == group_path400',
             paths[3], paths[4].previousSibling);
  assertNull('group_path500.nextSibling == null',
             paths[4].nextSibling);
  assertEquals('group_path500.parentNode.id == testPathsGroup', 
               'testPathsGroup', paths[4].parentNode.id);
  assertEquals('group_path500.parentNode == group', group,
               paths[4].parentNode);
               
  // append then remove a group of elements that are multiple levels deep
  // to ensure that the cached parent node is correct
  group = getDoc('svg11242').createElementNS(svgns, 'g');
  group.id = 'outerBigGroup';
  group2 = getDoc('svg11242').createElementNS(svgns, 'g');
  group2.id = 'anotherBigGroup';
  group.appendChild(group2); // have multiple nested groups
  paths = [];
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[0].id = 'anothergroup_path100';
  group2.appendChild(paths[0]);
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[1].id = 'anothergroup_path200';
  group2.appendChild(paths[1]);
  // now check child nodes
  assertNull('group.parentNode == null', group.parentNode);
  group2 = group.childNodes[0];
  assertEquals('group2.parentNode.id == outerBigGroup', 'outerBigGroup',
               group2.parentNode.id);
  assertEquals('group2.parentNode == group', group, group2.parentNode);
  assertEquals('group2.firstChild.parentNode.id == anotherBigGroup',
               'anotherBigGroup', group2.firstChild.parentNode.id);
  assertEquals('group2.firstChild.parentNode == group2', group2, 
               group2.firstChild.parentNode);
  assertEquals('group2.lastChild.parentNode.id == anotherBigGroup',
               'anotherBigGroup', group2.lastChild.parentNode.id);
  assertEquals('group2.lastChild.parentNode == group2', group2, 
               group2.lastChild.parentNode);
  assertEquals('group2.childNodes[0].parentNode.id == anotherBigGroup',
               'anotherBigGroup', group2.childNodes[0].parentNode.id);
  assertEquals('group2.childNodes[0].parentNode == group2', group2, 
               group2.childNodes[0].parentNode);
  assertEquals('group2.childNodes[1].parentNode.id == anotherBigGroup',
               'anotherBigGroup', group2.childNodes[1].parentNode.id);
  assertEquals('group2.childNodes[1].parentNode == group2', group2, 
               group2.childNodes[1].parentNode);
  // append then remove and check child nodes to ensure cached child nodes
  // are correct
  svg = getRoot('svg11242');
  svg.appendChild(group);
  group = svg.removeChild(group);
  // check parentNode info
  assertNull('group.parentNode == null', group.parentNode);
  group2 = group.childNodes[0];
  assertEquals('group2.parentNode.id == outerBigGroup', 'outerBigGroup',
               group2.parentNode.id);
  assertEquals('group2.parentNode == group', group, group2.parentNode);
  assertEquals('group2.firstChild.parentNode.id == anotherBigGroup',
               'anotherBigGroup', group2.firstChild.parentNode.id);
  assertEquals('group2.firstChild.parentNode == group2', group2, 
               group2.firstChild.parentNode);
  assertEquals('group2.lastChild.parentNode.id == anotherBigGroup',
               'anotherBigGroup', group2.lastChild.parentNode.id);
  assertEquals('group2.lastChild.parentNode == group2', group2, 
               group2.lastChild.parentNode);
  assertEquals('group2.childNodes[0].parentNode.id == anotherBigGroup',
               'anotherBigGroup', group2.childNodes[0].parentNode.id);
  assertEquals('group2.childNodes[0].parentNode == group2', group2, 
               group2.childNodes[0].parentNode);
  assertEquals('group2.childNodes[1].parentNode.id == anotherBigGroup',
               'anotherBigGroup', group2.childNodes[1].parentNode.id);
  assertEquals('group2.childNodes[1].parentNode == group2', group2, 
               group2.childNodes[1].parentNode);
}

function testRemoveChild() {
  // Test removeChild
  console.log('Testing removeChild...');
  
  // remove a normal circle element _before_ appending to DOM that has
  // no ID
  circle = getDoc('mySVG').createElementNS(svgns, 'circle');
  circle.setAttribute('cx', 100);
  circle.setAttribute('cy', 50);
  circle.setAttribute('r', 40);
  circle.setAttribute('stroke', 'black');
  circle.setAttribute('stroke-width', 2);
  circle.setAttribute('fill', 'red');
  group = getDoc('mySVG').createElementNS(svgns, 'g');
  group.appendChild(circle);
  temp = group.removeChild(circle);
  assertEquals('group.childNodes.length == 0', 0, 
               group.childNodes.length);
  assertNull('circle.parentNode == null', circle.parentNode);
  assertEquals('circle == temp', temp, circle);
  
  // remove a normal circle element _before_ appending to DOM that has
  // an ID
  circle = getDoc('svg2').createElementNS(svgns, 'circle');
  circle.setAttribute('cx', 100);
  circle.setAttribute('cy', 50);
  circle.setAttribute('r', 40);
  circle.setAttribute('stroke', 'black');
  circle.setAttribute('stroke-width', 2);
  circle.setAttribute('fill', 'red');
  circle.id = 'myCircle';
  group = getDoc('svg2').createElementNS(svgns, 'g');
  group.id = 'myGroup';
  group.appendChild(circle);
  temp = group.removeChild(circle);
  assertEquals('group.childNodes.length == 0', 0, 
               group.childNodes.length);
  assertNull('circle.parentNode == null', circle.parentNode);
  assertEquals('circle == temp', temp, circle);
  
  // remove a normal circle element _after_ appending to DOM
  // using object reference
  circle = getDoc('mySVG').createElementNS(svgns, 'circle');
  circle.setAttribute('cx', 2);
  circle.setAttribute('cy', 2);
  circle.setAttribute('r', 15);
  circle.setAttribute('stroke', 'green');
  circle.setAttribute('stroke-width', 1);
  circle.setAttribute('fill', 'pink');
  circle.id = 'myCircle5';
  group = getDoc('mySVG').getElementById('myGroup');
  lengthBefore = group.childNodes.length;
  group.appendChild(circle);
  temp = group.removeChild(circle);
  assertEquals('group.childNodes.length == lengthBefore', lengthBefore,
                group.childNodes.length);
  assertNull('circle.parentNode == null', circle.parentNode);
  assertEquals('circle == temp', temp, circle);
  assertNull('getElementById(myCircle5) == null',
              getDoc('mySVG').getElementById('myCircle5'));
  
  // remove a normal circle element _after_ appending to DOM
  // using returned object reference
  circle = getDoc('mySVG').createElementNS(svgns, 'circle');
  circle.setAttribute('cx', 2);
  circle.setAttribute('cy', 2);
  circle.setAttribute('r', 15);
  circle.setAttribute('stroke', 'green');
  circle.setAttribute('stroke-width', 1);
  circle.setAttribute('fill', 'pink');
  circle.id = 'myCircle6';
  group = getDoc('mySVG').getElementById('myGroup');
  lengthBefore = group.childNodes.length;
  circle = group.appendChild(circle);
  temp = group.removeChild(circle);
  assertEquals('group.childNodes.length == lengthBefore', lengthBefore,
                group.childNodes.length);
  assertNull('circle.parentNode == null', circle.parentNode);
  assertEquals('circle == temp', temp, circle);
  assertNull('getElementById(myCircle6) == null',
              getDoc('mySVG').getElementById('myCircle6'));
  
  // remove a normal circle element _after_ appending to DOM
  // after getting circle element through getElementById
  rect = getDoc('mySVG').getElementById('myRect');
  parent = rect.parentNode;
  lengthBefore = parent.childNodes.length;
  rect.parentNode.removeChild(rect);
  assertEquals('parent.childNodes.length == lengthBefore - 1',
               lengthBefore - 1, parent.childNodes.length);
  assertNull('rect.parentNode == null', rect.parentNode);
  assertNull('document.getElementById(myRect) == null',
             getDoc('mySVG').getElementById('myRect'));
  
  // remove a normal circle element _after_ appending to DOM
  // after getting circle element through getElementsByTagNameNS
  matches = getDoc('mySVG').getElementsByTagNameNS(svgns, 'text');
  text = null;
  for (var i = 0; i < matches.length; i++) {
    if (matches[i].getAttribute('id') == 'myText') {
      text = matches[i];
      break;
    }
  }
  assertExists('myText should exist', text);
  parent = text.parentNode;
  lengthBefore = text.parentNode.childNodes.length;
  origText = text.parentNode.removeChild(text);
  assertEquals('text.parentNode.childNodes.length == lengthBefore - 1',
               lengthBefore - 1, parent.childNodes.length);
  assertNull('text.parentNode == null', text.parentNode);
  assertNull('document.getElementById(myText) == null',
             getDoc('mySVG').getElementById('myText'));
  // SVG text node should now no longer show up in 
  // getElementsByTagNameNS
  matches = getDoc('mySVG').getElementsByTagNameNS(svgns, 'text');
  text = null;
  for (var i = 0; i < matches.length; i++) {
    if (matches[i].getAttribute('id') == 'myText') {
      text = matches[i];
      break;
    }
  }
  assertNull('text node should be null after removal', text);
  origText.setAttribute('y', parseInt(origText.getAttribute('y')) + 50);
  origText.firstChild.data = 'Deleted then added again';
  parent.appendChild(origText);
  
  // remove a text node _before_ appending to DOM on an SVG Title
  // element
  textNode = getDoc('mySVG').createTextNode('text for an svg title element', 
                                     true);
  title = getDoc('mySVG').createElementNS(svgns, 'title');
  title.appendChild(textNode);
  assertEquals('title.firstChild.nodeValue == '
               + 'text for an svg title element',
               'text for an svg title element',
               title.firstChild.nodeValue);
  assertEquals('textNode.parentNode == title', title, 
               textNode.parentNode);
  temp = textNode.parentNode.removeChild(textNode);
  assertEquals('title.childNodes.length == 0', 0, 
               title.childNodes.length);
  assertNull('textNode.parentNode == null', textNode.parentNode);
  assertEquals('textNode.nodeValue == text for an svg title element',
               'text for an svg title element', textNode.nodeValue);
  assertNull('title.firstChild == null', title.firstChild);
  assertEquals('textNode == temp', temp, textNode);
  
  // remove a text node _after_ appending to DOM on an SVG Title
  // element using object reference
  textNode = getDoc('mySVG').createTextNode('text for an svg title element', 
                                            true);
  title = getDoc('mySVG').createElementNS(svgns, 'title');
  title.appendChild(textNode);
  group = getDoc('mySVG').createElementNS(svgns, 'g');
  group.appendChild(title);
  svg = getRoot('mySVG');
  svg.appendChild(group);
  temp = title.removeChild(textNode);
  assertEquals('title.childNodes.length == 0', 0, 
               title.childNodes.length);
  assertNull('textNode.parentNode == null', textNode.parentNode);
  assertEquals('textNode.nodeValue == text for an svg title element',
               'text for an svg title element', textNode.nodeValue);
  assertNull('title.firstChild == null', title.firstChild);
  assertEquals('textNode == temp', temp, textNode);
  
  // remove an element from the SVG root
  lengthBefore = svg.childNodes.length;
  temp = svg.lastChild;
  svg.removeChild(svg.lastChild);
  assertEquals('svg.childNodes.length == lengthBefore - 1',
               lengthBefore - 1, svg.childNodes.length);
  assertEquals('group.parentNode == null', group.parentNode);
  assertEquals('temp.parentNode == null', temp.parentNode);        
  
  // remove a text node _before_ appending to DOM on an SVG Desc
  // element
  desc = getDoc('svg2').createElementNS(svgns, 'desc');
  textNode = getDoc('svg2').createTextNode('desc node content', true);
  desc.appendChild(textNode);
  temp = desc.removeChild(textNode);
  assertEquals('desc.childNodes.length == 0', 0, 
               desc.childNodes.length);
  assertNull('textNode.parentNode == null', textNode.parentNode);
  assertEquals('textNode.nodeValue == desc node content',
               'desc node content', textNode.nodeValue);
  assertNull('desc.firstChild == null', desc.firstChild);
  assertEquals('textNode == temp', temp, textNode);
  
  // remove a text node _after_ appending to DOM on an SVG Desc
  // element; get the element reference by using getElementById
  desc = getDoc('svg2').createElementNS(svgns, 'desc');
  svg = getRoot('svg2');
  textNode = getDoc('svg2').createTextNode('desc node content', true);
  desc.id = 'myDesc2';
  desc.appendChild(textNode);
  group = getDoc('svg2').createElementNS(svgns, 'g');
  group.appendChild(desc);
  svg.appendChild(group);
  desc = getDoc('svg2').getElementById('myDesc2');
  temp = desc.removeChild(textNode);
  assertEquals('desc.childNodes.length == 0', 0, 
               desc.childNodes.length);
  assertNull('textNode.parentNode == null', textNode.parentNode);
  assertEquals('textNode.nodeValue == desc node content',
               'desc node content', textNode.nodeValue);
  assertNull('desc.firstChild == null', desc.firstChild);
  assertEquals('textNode == temp', temp, textNode);
  assertEquals('desc.parentNode == group', group, desc.parentNode);
  
  // remove a text node _before_ appending to DOM on an SVG Text
  // element
  text = getDoc('svg2').createElementNS(svgns, 'text');
  textNode = getDoc('svg2').createTextNode('text node content', true);
  text.appendChild(textNode);
  temp = text.removeChild(textNode);
  assertEquals('text.childNodes.length == 0', 0, 
               text.childNodes.length);
  assertNull('textNode.parentNode == null', textNode.parentNode);
  assertEquals('textNode.nodeValue == text node content',
               'text node content', textNode.nodeValue);
  assertNull('text.firstChild == null', text.firstChild);
  assertEquals('textNode == temp', temp, textNode);
  
  // remove a text node _after_ appending to DOM on an SVG Text
  // element
  group.appendChild(text);
  text.appendChild(getDoc('svg2').createTextNode('more content', true));
  textNode = text.lastChild;
  temp = text.removeChild(text.lastChild);
  assertEquals('text.childNodes.length == 0', 0, 
               text.childNodes.length);
  assertNull('textNode.parentNode == null', textNode.parentNode);
  assertEquals('textNode.nodeValue == more content',
               'more content', textNode.nodeValue);
  assertNull('text.firstChild == null', text.firstChild);
  assertEquals('textNode == temp', temp, textNode);
  
  // remove an element that has multiple levels of nested children
  lengthBefore = svg.childNodes.length;
  group.appendChild(getDoc('svg2').createElementNS(svgns, 'g'));
  group.lastChild.appendChild(getDoc('svg2').createElementNS(svgns, 'text'));
  group.lastChild.childNodes[0].appendChild(
                              getDoc('svg2').createTextNode('hello content!',
                                                            true));
  assertEquals('svg.lastChild == group', group, svg.lastChild);
  group.parentNode.removeChild(svg.lastChild);
  assertEquals('svg.childNodes.length == lengthBefore - 1',
               lengthBefore - 1, svg.childNodes.length);
  assertNull('group.parentNode == null', group.parentNode);
  assertEquals('group.lastChild.nodeName == g', 'g',
               group.lastChild.nodeName);
  assertEquals('group.lastChild.childNodes[0].nodeName == text', 'text',
                group.lastChild.childNodes[0].nodeName);
  assertEquals('text node content == hello content!', 'hello content!',
               group.childNodes[2].lastChild.firstChild.data);

  // remove an SVG TITLE element
  matches = getDoc('mySVG').getElementsByTagNameNS(svgns, 'title');
  lengthBefore = matches.length;
  assertTrue('title matches >= 1', matches.length >= 1);
  title = matches[0];
  assertTrue('title.parentNode != null', title.parentNode !== null);
  parentNode = title.parentNode;
  title.parentNode.removeChild(title);
  assertNull('title.parentNode == null', title.parentNode);
  assertTrue('parentNode.lastChild != title', 
             parentNode.lastChild != title); 
  matches = getDoc('mySVG').getElementsByTagNameNS(svgns, 'title');
  assertEquals('getElementsByTagNameNS(title).length == lengthBefore - 1',
               lengthBefore - 1, 
               getDoc('mySVG').getElementsByTagNameNS(svgns, 'title').length);
  
  // remove a namespaced metadata child
  dc = getDoc('svg2').getElementById('myDCType');
  parentNode = dc.parentNode;
  lengthBefore = dc.parentNode.childNodes.length;
  dc.parentNode.removeChild(dc);
  assertNull('dc.parentNode == null', dc.parentNode);
  assertEquals('parentNode.childNodes.length == lengthBefore - 1',
               lengthBefore - 1, parentNode.childNodes.length);
  assertNull('document.getElementById(myDCType) == null',
             getDoc('svg2').getElementById('myDCType'));
  parentNode.appendChild(dc);
  assertEquals('after reappending, parentNode.childNodes.length == '
               + 'lengthBefore', 
               lengthBefore, parentNode.childNodes.length);
  
  // remove a namespaced metadata child and text node before appending
  dc = getDoc('svg11242').createElementNS(dc_ns, 'dc:creator');
  text = getDoc('svg11242').createTextNode('Bryan Neuberg', true);
  dc.appendChild(text);
  temp = dc.removeChild(text);
  assertEquals('dc.childNodes.length == 0', 0, dc.childNodes.length);
  assertNull('text.parentNode == null', text.parentNode);
  assertEquals('temp == text', temp, text);
  metadata = getDoc('svg11242').createElementNS(svgns, 'metadata');
  metadata.appendChild(dc);
  temp = metadata.removeChild(dc);
  assertEquals('metadata.childNodes.length == 0', 0, 
               metadata.childNodes.length);
  assertNull('dc.parentNode == null', dc.parentNode);
  assertEquals('temp == dc', temp, dc);
  
  // remove a group and make sure all of it's elements disappear
  group = getDoc('mySVG').getElementById('removeMe');
  group.parentNode.removeChild(group);
  console.log('FIRST IMAGE: Look at the rendered image and make sure that you '
              + 'do not see the text "You should not see this" as well as not '
              + 'seeing a green rectangle next to it. If they are '
              + 'present than removeChild is not working correctly.');
  
  // remove a gradient from a DEFS that is depended on by something
  // else and make sure the gradient disappears
  var gradient = getDoc('svg11242').getElementById('linearGradient14971');
  parentNode = gradient.parentNode;
  lengthBefore = gradient.parentNode.childNodes.length;
  temp = gradient.parentNode.removeChild(gradient);
  assertEquals('gradient.parentNode.childNodes.length == lengthBefore - 1',
               lengthBefore - 1, parentNode.childNodes.length);
  assertNull('gradient.parentNode == null', gradient.parentNode);
  assertEquals('temp == gradient', temp, gradient);
  
  // remove the STOP element from a gradient
  matches = getDoc('svg11242').getElementsByTagNameNS(svgns, 'stop');
  stop = matches[0];
  parentNode = stop.parentNode;
  lengthBefore = parentNode.childNodes.length;
  temp = stop.parentNode.removeChild(stop);
  assertEquals('stop.parentNode.childNodes.length == lengthBefore - 1',
               lengthBefore - 1, parentNode.childNodes.length);
  // FIXME: TODO: If we do a removeChild using matches[0] instead of
  // the stop reference, Firefox 3 and Safari 3 incorrectly still have a
  // parentNode property for the matches[0] element! 
  // temp = matches[0].parentNode.removeChild(matches[0]);
  // matches[0].parentNode incorrectly != null
  // matches[0] also incorrectly != temp
  // I doubt there is a way to paper over this in a reasonable way,
  // and its such an edge condition that I doubt it's needed
  assertNull('stop.parentNode == null', stop.parentNode);
  assertEquals('temp == stop', temp, stop);
    
  // remove a node then test the firstChild, lastChild, nextSibling,
  // and previousSibling properties on the removed tree
  metadata = getDoc('svg2').getElementsByTagNameNS(svgns, 'metadata')[0];
  svg = getRoot('svg2');
  // restore metadata to it's original state before any modifications
  // by tests above
  orig = metadata.childNodes[0];
  metadata.removeChild(metadata.childNodes[0]);
  rdf = getDoc('svg2').createElementNS(rdf_ns, 'rdf:RDF');
  cc = getDoc('svg2').createElementNS(cc_ns, 'cc:Work');
  rdf.appendChild(cc);
  cc.appendChild(getDoc('svg2').createElementNS(dc_ns, 'dc:format'));
  cc.appendChild(getDoc('svg2').createElementNS(dc_ns, 'dc:type'));
  cc.firstChild.appendChild(
                          getDoc('svg2').createTextNode('image/svg+xml', true));
  metadata.appendChild(rdf);
  // now check things after removing the metadata node
  metadata.parentNode.removeChild(metadata);
  svg = getRoot('svg2');
  assertNull('metadata.parentNode == null', metadata.parentNode);
  assertNull('metadata.previousSibling == null', metadata.previousSibling);
  assertNull('metadata.nextSibling == null', metadata.nextSibling);
  assertExists('metadata.firstChild should exist', metadata.firstChild);
  assertExists('metadata.lastChild should exist', metadata.lastChild);
  assertEquals('metadata.firstChild == metadata.lastChild)',
               metadata.lastChild, metadata.firstChild);
  rdf = metadata.firstChild;
  assertEquals('metadata.firstChild.nodeName == rdf:RDF', 'rdf:RDF',
               rdf.nodeName);
  assertExists('metadata.firstChild.parentNode', 
               rdf.parentNode);
  assertEquals('metadata.firstChild.parentNode == metadata node',
               metadata, rdf.parentNode);
  assertExists('metadata.firstChild.childNodes[0] should exist',
               rdf.childNodes[0]);
  cc = metadata.firstChild.childNodes[0];
  assertEquals('cc.nodeName == cc:Work', 'cc:Work', cc.nodeName);
  assertEquals('cc.parentNode == RDF node', rdf, cc.parentNode);
  assertExists('cc.firstChild should exist', cc.firstChild);
  assertExists('cc.lastChild should exist', cc.lastChild);
  format = cc.firstChild;
  type = cc.lastChild;
  assertEquals('cc.firstChild.nodeName == dc:format', 'dc:format',
               format.nodeName);
  assertEquals('cc.lastChild.nodeName == dc:type', 'dc:type',
               type.nodeName);
  assertEquals('cc.firstChild.nextSibling == cc.lastChild',
               cc.lastChild, format.nextSibling);
  assertNull('cc.firstChild.previousSibling == null', 
             format.previousSibling);
  assertEquals('cc.lastChild.previousSibling == cc.firstChild',
               cc.firstChild, type.previousSibling);
  assertNull('cc.lastChild.nextSibling == null', 
             type.nextSibling);
  assertExists('format.firstChild should exist (text node)',
               format.firstChild);
  assertExists('format.lastChild should exist (text node)',
               format.lastChild);
  assertEquals('format.childNodes.length == 1', 1, 
               format.childNodes.length);
  child = format.firstChild;
  assertEquals('format.firstChild.nodeType == 3', 3, child.nodeType);
  assertEquals('format.firstChild.data == image/svg+xml', 'image/svg+xml', 
               child.data);
  assertEquals('format.firstChild.parentNode == format', format,
               child.parentNode);
  assertNull('format.firstChild.nextSibling == null', child.nextSibling);
  assertNull('format.firstChild.nextSibling == null', 
             child.previousSibling);
  // now re-append
  metadata = svg.appendChild(metadata);
  assertEquals('metadata.parentNode == svg2', svg, 
               metadata.parentNode);
  assertExists('metadata.previousSibling should exist', 
               metadata.previousSibling);
  if (_hasObjects) {
    assertEquals('metadata.previousSibling.nodeName == text',
                 'text', metadata.previousSibling.nodeName);
  } else {
    assertEquals('metadata.previousSibling.nodeName == g',
                 'g', metadata.previousSibling.nodeName);
    assertEquals('metadata.previousSibling.id == layer4', 'layer4',
                 metadata.previousSibling.id);
  }
  assertNull('metadata.nextSibling == null', metadata.nextSibling);
  assertExists('metadata.firstChild should exist', metadata.firstChild);
  assertExists('metadata.lastChild should exist', metadata.lastChild);
  assertEquals('metadata.firstChild == metadata.lastChild)',
               metadata.lastChild, metadata.firstChild);
  rdf = metadata.firstChild;
  assertEquals('metadata.firstChild.nodeName == rdf:RDF', 'rdf:RDF',
               rdf.nodeName);
  assertExists('metadata.firstChild.parentNode', 
               rdf.parentNode);
  assertEquals('metadata.firstChild.parentNode == metadata node',
               metadata, rdf.parentNode);
  assertExists('metadata.firstChild.childNodes[0] should exist',
               rdf.childNodes[0]);
  cc = metadata.firstChild.childNodes[0];
  assertEquals('cc.nodeName == cc:Work', 'cc:Work', cc.nodeName);
  assertEquals('cc.parentNode == RDF node', rdf, cc.parentNode);
  assertExists('cc.firstChild should exist', cc.firstChild);
  assertExists('cc.lastChild should exist', cc.lastChild);
  format = cc.firstChild;
  type = cc.lastChild;
  assertEquals('cc.firstChild.nodeName == dc:format', 'dc:format',
               format.nodeName);
  assertEquals('cc.lastChild.nodeName == dc:type', 'dc:type',
               type.nodeName);
  assertEquals('cc.firstChild.nextSibling == cc.lastChild',
               cc.lastChild, format.nextSibling);
  assertNull('cc.firstChild.previousSibling == null', 
             format.previousSibling);
  assertEquals('cc.lastChild.previousSibling == cc.firstChild',
               cc.firstChild, type.previousSibling);
  assertNull('cc.lastChild.nextSibling == null', 
             type.nextSibling);
  assertExists('format.firstChild should exist (text node)',
               format.firstChild);
  assertExists('format.lastChild should exist (text node)',
               format.lastChild);
  assertEquals('format.childNodes.length == 1', 1, 
               format.childNodes.length);
  child = format.firstChild;
  assertEquals('format.firstChild.nodeType == 3', 3, child.nodeType);
  assertEquals('format.firstChild.data == image/svg+xml', 'image/svg+xml', 
               child.data);
  assertEquals('format.firstChild.parentNode == format', format,
               child.parentNode);
  assertNull('format.firstChild.nextSibling == null', child.nextSibling);
  assertNull('format.firstChild.nextSibling == null', 
             child.previousSibling);
  // restore the original state
  metadata.removeChild(metadata.childNodes[0]);
  metadata.appendChild(orig);

  // create a test where we remove a child and its subtree, then
  // later on remove the _parent_ of that child, then test parentNode,
  // firstChild, etc. on this to make sure that the double removal
  // hasn't messed things up in terms of cached values
  group = getDoc('svg11242').createElementNS(svgns, 'g');
  group.id = 'parent_test_group1';
  path = getDoc('svg11242').createElementNS(svgns, 'path');
  path.id = 'subtree_test_path1';
  group.appendChild(path);
  path = getDoc('svg11242').createElementNS(svgns, 'path');
  path.id = 'subtree_test_path2';
  group.appendChild(path);
  path = getDoc('svg11242').createElementNS(svgns, 'path');
  path.id = 'subtree_test_path3';
  group.appendChild(path);
  group2 = getDoc('svg11242').createElementNS(svgns, 'g');
  group2.id = 'parent_container_group';
  group2.appendChild(group);
  svg = getRoot('svg11242');
  svg.appendChild(group2);
  // now remove group
  group.parentNode.removeChild(group);
  // remove group2 and tests it's various cached sibling info
  svg.removeChild(svg.lastChild);
  assertNull('group2.parentNode == null', group2.parentNode);
  assertNull('group.parentNode == null', group.parentNode);
  assertEquals('group2.childNodes.length == 0', 0,
                group2.childNodes.length);
  assertEquals('group.childNodes.length == 3', 3,
                group.childNodes.length);
  assertNull('group2.firstChild == null', group2.firstChild);
  assertNull('group2.lastChild == null', group2.lastChild);
  assertNull('group2.nextSibling == null', group2.nextSibling);
  assertNull('group2.previousSibling == null', group2.previousSibling);
  assertUndefined('group2.childNodes[0] == undefined',
                  group2.childNodes[0]);
  assertEquals('group.firstChild.id == subtree_test_path1',
               'subtree_test_path1', group.firstChild.id);
  assertEquals('group.lastChild.id == subtree_test_path3',
               'subtree_test_path3', group.lastChild.id);
  assertEquals('group.childNodes[1].id == subtree_test_path2',
               'subtree_test_path2', group.childNodes[1].id);

  // add a test where have a group with multiple children; then,
  // do an removeChild in the middle and test to make sure that
  // next/previous sibling relationships work correctly on all the
  // nodes. Everything should be unattached.
  group = getDoc('svg11242').createElementNS(svgns, 'g');
  paths = [];
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  // we've used these IDs before; make sure they aren't in the DOM, since
  // we removed them in the past
  assertNull('document.getElementById(group_path100) == null',
             getDoc('svg11242').getElementById('group_path100'));
  assertNull('document.getElementById(group_path200) == null',
             getDoc('svg11242').getElementById('group_path200'));
  assertNull('document.getElementById(group_path300) == null',
             getDoc('svg11242').getElementById('group_path300'));
  assertNull('document.getElementById(group_path400) == null',
             getDoc('svg11242').getElementById('group_path400'));
  assertNull('document.getElementById(group_path500) == null',
             getDoc('svg11242').getElementById('group_path500'));
  // now create our PATH elements
  paths[0].id = 'group_path100';
  group.appendChild(paths[0]);            
  // now create the other paths
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[1].id = 'group_path200';
  group.appendChild(paths[1]);
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[2].id = 'group_path300';
  group.appendChild(paths[2]);
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[3].id = 'group_path400';
  group.appendChild(paths[3]);
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[4].id = 'group_path500';
  group.appendChild(paths[4]);
  // now do a removeChild in the middle and make sure sibling 
  // relationships still work correctly
  group.removeChild(paths[3]); // group_path400 removed
  // nextSibling/previousSibling for group_path100
  assertNull('group_path100.previousSibling == null',
             paths[0].previousSibling);
  assertEquals('group_path100.nextSibling == group_path200',
               paths[1], paths[0].nextSibling);
  assertEquals('group_path100.parentNode == group', group,
               paths[0].parentNode);
  // nextSibling/previousSibling for group_path200
  assertEquals('group_path200.previousSibling == group_path100',
             paths[0], paths[1].previousSibling);
  assertEquals('group_path200.nextSibling == group_path300',
               paths[2], paths[1].nextSibling);
  assertEquals('group_path200.parentNode == group', group,
               paths[1].parentNode);
  // nextSibling/previousSibling for group_path300
  assertEquals('group_path300.previousSibling == group_path200',
             paths[1], paths[2].previousSibling);
  assertEquals('group_path300.nextSibling == group_path500',
               paths[4], paths[2].nextSibling);
  assertEquals('group_path300.parentNode == group', group,
               paths[2].parentNode);
  // nextSibling/previousSibling for group_path400; this node
  // was removed
  assertNull('group_path400.previousSibling == null',
             paths[3].previousSibling);
  assertNull('group_path400.nextSibling == null',
               paths[3].nextSibling);
  assertNull('group_path400.parentNode == null', paths[3].parentNode);
  // nextSibling/previousSibling for group_path500
  assertEquals('group_path500.previousSibling == group_path300',
             paths[2], paths[4].previousSibling);
  assertNull('group_path500.nextSibling == null',
             paths[4].nextSibling);
  assertEquals('group_path500.parentNode == group', group,
               paths[4].parentNode);
  // now remove the first path (group_path100) and make sure
  // sibling information is correct
  group.removeChild(paths[0]); // group_path100 removed
  // nextSibling/previousSibling for group_path100; removed
  assertNull('group_path100.previousSibling == null',
             paths[0].previousSibling);
  assertNull('group_path100.nextSibling == null',
               paths[0].nextSibling);
  assertNull('group_path100.parentNode == null',
               paths[0].parentNode);
  // nextSibling/previousSibling for group_path200
  assertNull('group_path200.previousSibling == null',
             paths[1].previousSibling);
  assertEquals('group_path200.nextSibling == group_path300',
               paths[2], paths[1].nextSibling);
  assertEquals('group_path200.parentNode == group', group,
               paths[1].parentNode);
  // nextSibling/previousSibling for group_path300
  assertEquals('group_path300.previousSibling == group_path200',
             paths[1], paths[2].previousSibling);
  assertEquals('group_path300.nextSibling == group_path500',
               paths[4], paths[2].nextSibling);
  assertEquals('group_path300.parentNode == group', group,
               paths[2].parentNode);
  // nextSibling/previousSibling for group_path400; this node
  // was removed
  assertNull('group_path400.previousSibling == null',
             paths[3].previousSibling);
  assertNull('group_path400.nextSibling == null',
               paths[3].nextSibling);
  assertNull('group_path400.parentNode == null', paths[3].parentNode);
  // nextSibling/previousSibling for group_path500
  assertEquals('group_path500.previousSibling == group_path300',
             paths[2], paths[4].previousSibling);
  assertNull('group_path500.nextSibling == null',
             paths[4].nextSibling);
  assertEquals('group_path500.parentNode == group', group,
               paths[4].parentNode);
  // now remove the last path (group_path500) and make sure
  // sibling information is correct
  group.removeChild(paths[4]); // group_path500 removed
  // nextSibling/previousSibling for group_path100; removed
  assertNull('group_path100.previousSibling == null',
             paths[0].previousSibling);
  assertNull('group_path100.nextSibling == null',
               paths[0].nextSibling);
  assertNull('group_path100.parentNode == null',
               paths[0].parentNode);
  // nextSibling/previousSibling for group_path200
  assertNull('group_path200.previousSibling == null',
             paths[1].previousSibling);
  assertEquals('group_path200.nextSibling == group_path300',
               paths[2], paths[1].nextSibling);
  assertEquals('group_path200.parentNode == group', group,
               paths[1].parentNode);
  // nextSibling/previousSibling for group_path300
  assertEquals('group_path300.previousSibling == group_path200',
             paths[1], paths[2].previousSibling);
  assertNull('group_path300.nextSibling == null', paths[2].nextSibling);
  assertEquals('group_path300.parentNode == group', group,
               paths[2].parentNode);
  // nextSibling/previousSibling for group_path400; this node
  // was removed
  assertNull('group_path400.previousSibling == null',
             paths[3].previousSibling);
  assertNull('group_path400.nextSibling == null', paths[3].nextSibling);
  assertNull('group_path400.parentNode == null', paths[3].parentNode);
  // nextSibling/previousSibling for group_path500; removed
  assertNull('group_path500.previousSibling == null',
             paths[4].previousSibling);
  assertNull('group_path500.nextSibling == null', paths[4].nextSibling);
  assertNull('group_path500.parentNode == null', paths[4].parentNode);
  // append the group node, then remove it, and make sure all the
  // sibling information is still correct
  svg = getRoot('svg11242');
  svg.appendChild(group);
  group = svg.removeChild(group);
  assertExists('Group of created paths should exist', group);
  assertEquals('group.childNodes.length == 2', 2, 
               group.childNodes.length);
  assertEquals('group.childNodes[0].getAttribute(id) == group_path200',
               'group_path200', group.childNodes[0].getAttribute('id'));
  assertEquals('group.childNodes[1].getAttribute(id) == group_path300',
               'group_path300', group.childNodes[1].getAttribute('id'));
  // nextSibling/previousSibling for group_path200
  assertNull('after removal, group_path200.previousSibling == null',
             group.childNodes[0].previousSibling);
  assertEquals('after removal, group_path200.nextSibling == group_path300',
               group.childNodes[1], group.childNodes[0].nextSibling);
  assertEquals('after removal, group_path200.parentNode == group', group,
               group.childNodes[0].parentNode);
  // nextSibling/previousSibling for group_path300
  assertEquals('after removal, group_path300.previousSibling == '
                + 'group_path200', group.childNodes[0],
                group.childNodes[1].previousSibling);
  assertNull('after removal, group_path300.nextSibling == null',
             group.childNodes[1].nextSibling);
  assertEquals('after removal, group_path300.parentNode == group', group,
               group.childNodes[1].parentNode);
}

function testReplaceChild() {
  // Test replaceChild
  console.log('Testing replaceChild...');

  // before anything is appended to the DOM, replace an SVG circle
  // element with an SVG rectangle
  group = getDoc('svg11242').createElementNS(svgns, 'g');
  circle = getDoc('svg11242').createElementNS(svgns, 'circle');
  circle.setAttribute('cx', 2);
  circle.setAttribute('cy', 2);
  circle.setAttribute('r', 15);
  circle.setAttribute('stroke', 'green');
  circle.setAttribute('stroke-width', 1);
  circle.setAttribute('fill', 'pink');
  group.appendChild(circle);
  rect = getDoc('svg11242').createElementNS(svgns, 'rect');
  rect.setAttribute('x', 5);
  rect.setAttribute('y', 5);
  rect.setAttribute('width', 20);
  rect.setAttribute('height', 20);
  rect.setAttribute('fill', 'orange');
  temp = group.replaceChild(rect, circle);
  assertNull('circle.parentNode == null', circle.parentNode);
  assertEquals('rect.parentNode == group', group, rect.parentNode);
  assertEquals('group.childNodes.length == 1', 1, group.childNodes.length);
  assertEquals('group.childNodes[0].nodeName == rect', 'rect',
               group.childNodes[0].nodeName);
  assertEquals('group.childNodes[0] == rect', rect,
               group.childNodes[0]);
  assertEquals('temp == circle', temp, circle);
  
  // after things are appended to the DOM, replace an SVG circle
  // element with an SVG rectangle
  group = getDoc('mySVG').createElementNS(svgns, 'g');
  circle = getDoc('mySVG').createElementNS(svgns, 'circle');
  circle.setAttribute('cx', 2);
  circle.setAttribute('cy', 2);
  circle.setAttribute('r', 15);
  circle.setAttribute('stroke', 'green');
  circle.setAttribute('stroke-width', 1);
  circle.setAttribute('fill', 'pink');
  group.appendChild(circle);
  rect = getDoc('svg11242').createElementNS(svgns, 'rect');
  rect.setAttribute('x', 5);
  rect.setAttribute('y', 5);
  rect.setAttribute('width', 20);
  rect.setAttribute('height', 20);
  rect.setAttribute('fill', 'orange');
  svg = getRoot('mySVG');
  svg.appendChild(group);
  temp = group.replaceChild(rect, circle);
  assertNull('circle.parentNode == null', circle.parentNode);
  assertEquals('rect.parentNode == group', group, rect.parentNode);
  assertEquals('group.childNodes[0] == rect', rect,
               group.childNodes[0]);
  assertEquals('temp == circle', temp, circle);
  
  // after things are appended to the DOM, replace an SVG circle
  // element with an SVG rectangle; use getElementById to get the
  // parent element instance
  group = getDoc('mySVG').createElementNS(svgns, 'g');
  group.id = 'myGroup1';
  circle = getDoc('mySVG').createElementNS(svgns, 'circle');
  circle.setAttribute('cx', 2);
  circle.setAttribute('cy', 2);
  circle.setAttribute('r', 15);
  circle.setAttribute('stroke', 'green');
  circle.setAttribute('stroke-width', 1);
  circle.setAttribute('fill', 'pink');
  group.appendChild(circle);
  rect = getDoc('mySVG').createElementNS(svgns, 'rect');
  rect.setAttribute('x', 5);
  rect.setAttribute('y', 5);
  rect.setAttribute('width', 20);
  rect.setAttribute('height', 20);
  rect.setAttribute('fill', 'orange');
  svg = getRoot('mySVG');
  svg.appendChild(group);
  group = getDoc('mySVG').getElementById('myGroup1');
  temp = group.replaceChild(rect, circle);
  assertNull('circle.parentNode == null', circle.parentNode);
  assertEquals('rect.parentNode == group', group, rect.parentNode);
  assertEquals('group.childNodes[0] == rect', rect,
               group.childNodes[0]);
  assertEquals('temp == circle', temp, circle);
  
  // before anything is appended to the DOM, replace the text in an
  // SVG Title element
  textNode = getDoc('mySVG').createTextNode('text for an svg title element', 
                                     true);
  title = getDoc('mySVG').createElementNS(svgns, 'title');
  title.appendChild(textNode);
  textNode2 = getDoc('mySVG').createTextNode('replace text for svg title', 
                                             true);
  temp = title.replaceChild(textNode2, textNode);
  assertNull('title.parentNode == null', title.parentNode);
  assertEquals('textNode2.parentNode == title', title, 
               textNode2.parentNode);
  assertEquals('title.childNodes[0] == textNode2', textNode2,
               title.childNodes[0]);
  assertEquals('temp == textNode', temp, textNode);
  
  // after things are appended to the DOM, replace the text in an 
  // SVG Title element; get the title we will do replacing on
  // through getElementsByTagNameNS
  title = getDoc('mySVG').createElementNS(svgns, 'title');
  textNode = getDoc('mySVG').createTextNode('more text for an svg title element',
                                     true);
  title.appendChild(textNode);
  title.id = 'myTitle1';
  matches = getDoc('mySVG').getElementsByTagNameNS(svgns, 'g');
  svg = getRoot('mySVG');
  group = null;
  for (var i = 0; i < matches.length; i++) {
    if (matches[i] == svg.lastChild) {
      group = matches[i];
      break;
    }
  }
  assertExists('group should exist', group);
  group.appendChild(title);
  matches = getDoc('mySVG').getElementsByTagNameNS(svgns, 'title');
  title = null;
  for (var i = 0; i < matches.length; i++) {
    if (matches[i].getAttribute('id') == 'myTitle1') {
      title = matches[i];
      break;
    }
  }
  assertExists('title should exist', title);
  lengthBefore = group.childNodes.length;
  textNode2 = getDoc('mySVG').createTextNode('more replaced text', true);
  textNode = title.firstChild;
  temp = title.replaceChild(textNode2, title.firstChild);
  assertNull('textNode.parentNode == null', textNode.parentNode);
  assertEquals('textNode == temp', temp, textNode);
  assertEquals('textNode2.parentNode == title', title, 
               textNode2.parentNode);
  assertEquals('title.firstChild.data = more replaced text',
               'more replaced text', title.firstChild.data);
  
  // before anything is appended to the DOM, replace the text in an
  // SVG Text element
  text = getDoc('mySVG').createElementNS(svgns, 'text');
  text.setAttribute('x', 0);
  text.setAttribute('y', 300);
  text.setAttribute('fill', 'green');
  textNode = getDoc('mySVG').createTextNode('You should see this text', true);
  textNode = text.appendChild(textNode);
  textNode2 = getDoc('mySVG').createTextNode('Replaced text', true);
  temp = text.replaceChild(textNode2, textNode);
  assertNull('textNode.parentNode == null', textNode.parentNode);
  assertEquals('textNode2.parentNode == text', text, 
               textNode2.parentNode);
  assertEquals('text.firstChild == textNode2', textNode2,
               text.firstChild);
  assertEquals('text.firstChild.textContent == Replaced text',
               'Replaced text', text.firstChild.textContent);
               
  // after things are appended to the DOM, replace the text in an 
  // SVG Text element
  text = getDoc('mySVG').createElementNS(svgns, 'text');
  text.setAttribute('x', 300);
  text.setAttribute('y', 300);
  textNode = getDoc('mySVG').createTextNode('more text for an svg text element',
                                            true);
  text.appendChild(textNode);
  text.id = 'myText1';
  matches = getDoc('mySVG').getElementsByTagNameNS(svgns, 'g');
  svg = getRoot('mySVG');
  group = null;
  for (var i = 0; i < matches.length; i++) {
    if (matches[i] == svg.lastChild) {
      group = matches[i];
      break;
    }
  }
  assertExists('group should exist', group);
  group.appendChild(text);
  matches = getDoc('mySVG').getElementsByTagNameNS(svgns, 'text');
  text = null;
  for (var i = 0; i < matches.length; i++) {
    if (matches[i].getAttribute('id') == 'myText1') {
      text = matches[i];
      break;
    }
  }
  assertExists('text should exist', text);
  lengthBefore = group.childNodes.length;
  textNode2 = getDoc('mySVG').createTextNode('more replaced text', true);
  textNode = text.firstChild;
  temp = text.replaceChild(textNode2, text.firstChild);
  assertNull('textNode.parentNode == null', textNode.parentNode);
  assertEquals('textNode == temp', temp, textNode);
  assertEquals('textNode2.parentNode == text', text, 
               textNode2.parentNode);
  assertEquals('text.firstChild.data = more replaced text',
               'more replaced text', text.firstChild.data);
  assertEquals('group.childNodes.length == lengthBefore',
               lengthBefore, group.childNodes.length);
  
  // before anything is appended to the DOM, replace the text in a
  // namespaced element inside a METADATA node
  rdf = getDoc('svg11242').createElementNS(rdf_ns, 'rdf:RDF');
  textNode = getDoc('svg11242').createTextNode('Some RDF text', true);
  textNode2 = getDoc('svg11242').createTextNode('Some more RDF text', true);
  rdf.appendChild(textNode);
  metadata = getDoc('svg11242').createElementNS(svgns, 'metadata');
  metadata.id = 'svg11242_metadata';
  metadata.appendChild(rdf);
  temp = rdf.replaceChild(textNode2, textNode);
  assertEquals('rdf.childNodes.length == 1', 1, rdf.childNodes.length);
  assertNull('textNode.parentNode == null', textNode.parentNode);
  assertEquals('textNode2.parentNode == rdf', rdf, textNode2.parentNode);
  assertEquals('metadata.firstChild == rdf', rdf, metadata.firstChild);
  assertEquals('metadata.firstChild.lastChild.data == '
               + 'Some more RDF text', 'Some more RDF text',
               metadata.firstChild.childNodes[0].data);
  
  // after things are appended to the DOM, replace the text in a 
  // namespaced element inside a METADATA node
  svg = getRoot('svg11242');
  svg.appendChild(metadata);
  matches = getDoc('svg11242').getElementsByTagNameNS(rdf_ns, 'RDF');
  if (_hasObjects) {
    assertEquals('rdf matches.length == 1', 1, matches.length);
    rdf = matches[0];
  } else {
    assertEquals('rdf matches.length == 2', 2, matches.length);
    rdf = matches[1];
  }
  assertExists('rdf should exist', rdf);
  textNode2 = getDoc('svg11242').createTextNode('Replaced RDF text', true);
  textNode = rdf.firstChild;
  temp = rdf.replaceChild(textNode2, rdf.firstChild);
  assertNull('textNode.parentNode == null', textNode.parentNode);
  assertEquals('textNode.nodeType == 3', 3, textNode.nodeType);
  assertEquals('textNode2.parentNode == rdf', rdf, textNode2.parentNode);
  assertEquals('rdf.childNodes.length == 1', 1, rdf.childNodes.length);
  assertEquals('rdf.childNodes[0].nodeValue == Replaced RDF text',
               'Replaced RDF text', rdf.childNodes[0].nodeValue);
  
  // before anything is appended to the DOM, replace a namespaced
  // element with another namespaced element inside a METADATA node
  rdf = getDoc('svg11242').createElementNS(rdf_ns, 'rdf:RDF');
  rdf.appendChild(textNode);
  metadata = getDoc('svg11242').createElementNS(svgns, 'metadata');
  metadata.appendChild(rdf);
  dc = getDoc('svg11242').createElementNS(dc_ns, 'dc:creator');
  textNode = getDoc('svg11242').createTextNode('Home boy', true);
  dc.appendChild(textNode);
  temp = metadata.replaceChild(dc, rdf);
  assertNull('rdf.parentNode == null', rdf.parentNode);
  assertEquals('dc.parentNode == metadata', metadata, dc.parentNode);
  assertEquals('metadata.lastChild == dc', dc, metadata.lastChild);
  assertEquals('metadata.childNodes.length == 1', 1,
               metadata.childNodes.length);
  assertEquals('dc.childNodes[0].textContent == Home boy',
               'Home boy', dc.childNodes[0].textContent);
  assertEquals('temp == rdf', temp, rdf);
  
  // after things are appended to the DOM, replace a namespaced
  // element with another namespaced element inside a METADATA node
  matches = getDoc('svg11242').getElementsByTagNameNS(rdf_ns, 'RDF');
  if (_hasObjects) {
    assertEquals('rdf matches == 1', 1, matches.length);
    rdf = matches[0];
  } else {
    assertEquals('rdf matches == 2', 2, matches.length);
    rdf = matches[1];
  }
  assertExists('rdf should exist', rdf);
  dc = getDoc('svg11242').createElementNS(dc_ns, 'dc:creator');
  dc.setAttribute('id', 'myDCNode');
  textNode = getDoc('svg11242').createTextNode('Home boy', true);
  dc.appendChild(textNode);
  rdf.id = 'myRDFNode';
  assertExists('document.getElementById(myRDFNode) should exist',
               getDoc('svg11242').getElementById('myRDFNode'));
  temp = rdf.parentNode.replaceChild(dc, rdf);
  assertEquals('dc.parentNode.nodeName == metadata', 'metadata',
               dc.parentNode.nodeName);
  assertEquals('temp == rdf', temp, rdf);
  assertNull('rdf.parentNode == null', rdf.parentNode);
  assertExists('document.getElementById(myDCNode) should exist',
               getDoc('svg11242').getElementById('myDCNode'));
  assertNull('document.getElementById(myRDFNode) == null',
             getDoc('svg11242').getElementById('myRDFNode'));
             
  // add a test where have a group with multiple children; then,
  // do an replaceChild in the middle and test to make sure that
  // next/previous sibling relationships work correctly on all the
  // nodes. Everything should be unattached.
  group = getDoc('svg11242').createElementNS(svgns, 'g');
  paths = [];
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  // we've used these IDs before; make sure they aren't in the DOM, since
  // we removed them in the past
  assertNull('document.getElementById(group_path100) == null',
             getDoc('svg11242').getElementById('group_path100'));
  assertNull('document.getElementById(group_path200) == null',
             getDoc('svg11242').getElementById('group_path200'));
  assertNull('document.getElementById(group_path300) == null',
             getDoc('svg11242').getElementById('group_path300'));
  assertNull('document.getElementById(group_path400) == null',
             getDoc('svg11242').getElementById('group_path400'));
  assertNull('document.getElementById(group_path500) == null',
             getDoc('svg11242').getElementById('group_path500'));
  // now create our PATH elements
  paths[0].id = 'group_path100';
  group.appendChild(paths[0]);            
  // now create the other paths
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[1].id = 'group_path200';
  group.appendChild(paths[1]);
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[2].id = 'group_path300';
  group.appendChild(paths[2]);
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[3].id = 'group_path400';
  group.appendChild(paths[3]);
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[4].id = 'group_path500';
  group.appendChild(paths[4]);
  // elements that we will use to replace earlier ones with
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[5].id = 'group_path400_replacer';
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[6].id = 'group_path100_replacer';
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[7].id = 'group_path500_replacer';
  // now do a replaceChild in the middle and make sure sibling 
  // relationships still work correctly
  // paths[5] == group_path400_replacer 
  // paths[3] == group_path400
  group.replaceChild(paths[5], paths[3]);
  // nextSibling/previousSibling for group_path100
  assertNull('group_path100.previousSibling == null',
             paths[0].previousSibling);
  assertEquals('group_path100.nextSibling == group_path200',
               paths[1], paths[0].nextSibling);
  assertEquals('group_path100.parentNode == group', group,
               paths[0].parentNode);
  // nextSibling/previousSibling for group_path200
  assertEquals('group_path200.previousSibling == group_path100',
             paths[0], paths[1].previousSibling);
  assertEquals('group_path200.nextSibling == group_path300',
               paths[2], paths[1].nextSibling);
  assertEquals('group_path200.parentNode == group', group,
               paths[1].parentNode);
  // nextSibling/previousSibling for group_path300
  assertEquals('group_path300.previousSibling == group_path200',
             paths[1], paths[2].previousSibling);
  // paths[5] == group_path400_replacer
  assertEquals('group_path300.nextSibling == group_path400_replacer',
               paths[5], paths[2].nextSibling);
  assertEquals('group_path300.parentNode == group', group,
               paths[2].parentNode);
  // nextSibling/previousSibling for group_path400; this node
  // was removed
  assertNull('group_path400.previousSibling == null',
             paths[3].previousSibling);
  assertNull('group_path400.nextSibling == null',
               paths[3].nextSibling);
  assertNull('group_path400.parentNode == null', paths[3].parentNode);
  // nextSibling/previousSibling for group_path400_replacer; this replaced
  // another element
  // paths[2] == group_path300
  assertEquals('group_path400_replacer.previousSibling == group_path300',
             paths[2], paths[5].previousSibling);
  // paths[4] == group_path500
  assertEquals('group_path400_replacer.nextSibling == '
               + 'group_path500',
               paths[4], paths[5].nextSibling);
  assertEquals('group_path400_replacer.parentNode == group', group,
               paths[5].parentNode);
  // nextSibling/previousSibling for group_path500
  assertEquals('group_path500.previousSibling == group_path400_replacer',
             paths[5], paths[4].previousSibling);
  assertNull('group_path500.nextSibling == null', paths[4].nextSibling);
  assertEquals('group_path500.parentNode == group', group,
               paths[4].parentNode);
  // now do a replaceChild at the beginning and make sure sibling 
  // relationships still work correctly
  // paths[6] == group_path100_replacer
  // paths[0] == group_path100
  group.replaceChild(paths[6], paths[0]);
  // nextSibling/previousSibling for group_path100; this was replaced
  assertNull('group_path100.previousSibling == null',
             paths[0].previousSibling);
  assertNull('group_path100.nextSibling == null', paths[0].nextSibling);
  assertNull('group_path100.parentNode == null', paths[0].parentNode);
  // nextSibling/previousSibling for group_path100_replacer
  assertNull('group_path100_replacer.previousSibling == null',
             paths[6].previousSibling);
  assertEquals('group_path100_replacer.nextSibling == group_path200',
               paths[1], paths[6].nextSibling);
  assertEquals('group_path100_replacer.parentNode == group', group,
               paths[6].parentNode);
  // nextSibling/previousSibling for group_path200
  assertEquals('group_path200.previousSibling == group_path100_replacer',
             paths[6], paths[1].previousSibling);
  assertEquals('group_path200.nextSibling == group_path300',
               paths[2], paths[1].nextSibling);
  assertEquals('group_path200.parentNode == group', group,
               paths[1].parentNode);
  // nextSibling/previousSibling for group_path300
  assertEquals('group_path300.previousSibling == group_path200',
             paths[1], paths[2].previousSibling);
  // paths[5] == group_path400_replacer
  assertEquals('group_path300.nextSibling == group_path400_replacer',
               paths[5], paths[2].nextSibling);
  assertEquals('group_path300.parentNode == group', group,
               paths[2].parentNode);
  // nextSibling/previousSibling for group_path400; this node
  // was removed
  assertNull('group_path400.previousSibling == null',
             paths[3].previousSibling);
  assertNull('group_path400.nextSibling == null',
               paths[3].nextSibling);
  assertNull('group_path400.parentNode == null', paths[3].parentNode);
  // nextSibling/previousSibling for group_path400_replacer; this replaced
  // another element
  // paths[2] == group_path300
  assertEquals('group_path400_replacer.previousSibling == group_path300',
             paths[2], paths[5].previousSibling);
  // paths[4] == group_path500
  assertEquals('group_path400_replacer.nextSibling == '
               + 'group_path500',
               paths[4], paths[5].nextSibling);
  assertEquals('group_path400_replacer.parentNode == group', group,
               paths[5].parentNode);
  // nextSibling/previousSibling for group_path500
  assertEquals('group_path500.previousSibling == group_path400_replacer',
             paths[5], paths[4].previousSibling);
  assertNull('group_path500.nextSibling == null',
             paths[4].nextSibling);
  assertEquals('group_path500.parentNode == group', group,
               paths[4].parentNode);
  // now do a replaceChild at the end and make sure sibling 
  // relationships still work correctly
  // paths[7] == group_path500_replacer
  // paths[4] == group_path500
  group.replaceChild(paths[7], paths[4]);
  // nextSibling/previousSibling for group_path100; this was replaced
  assertNull('group_path100.previousSibling == null',
             paths[0].previousSibling);
  assertNull('group_path100.nextSibling == null', paths[0].nextSibling);
  assertNull('group_path100.parentNode == null', paths[0].parentNode);
  // nextSibling/previousSibling for group_path100_replacer
  assertNull('group_path100_replacer.previousSibling == null',
             paths[6].previousSibling);
  assertEquals('group_path100_replacer.nextSibling == group_path200',
               paths[1], paths[6].nextSibling);
  assertEquals('group_path100_replacer.parentNode == group', group,
               paths[6].parentNode);
  // nextSibling/previousSibling for group_path200
  assertEquals('group_path200.previousSibling == group_path100_replacer',
             paths[6], paths[1].previousSibling);
  assertEquals('group_path200.nextSibling == group_path300',
               paths[2], paths[1].nextSibling);
  assertEquals('group_path200.parentNode == group', group,
               paths[1].parentNode);
  // nextSibling/previousSibling for group_path300
  assertEquals('group_path300.previousSibling == group_path200',
             paths[1], paths[2].previousSibling);
  // paths[5] == group_path400_replacer
  assertEquals('group_path300.nextSibling == group_path400_replacer',
               paths[5], paths[2].nextSibling);
  assertEquals('group_path300.parentNode == group', group,
               paths[2].parentNode);
  // nextSibling/previousSibling for group_path400; this node
  // was removed
  assertNull('group_path400.previousSibling == null',
             paths[3].previousSibling);
  assertNull('group_path400.nextSibling == null',
               paths[3].nextSibling);
  assertNull('group_path400.parentNode == null', paths[3].parentNode);
  // nextSibling/previousSibling for group_path400_replacer; this replaced
  // another element
  // paths[2] == group_path300
  assertEquals('group_path400_replacer.previousSibling == group_path300',
             paths[2], paths[5].previousSibling);
  // paths[7] == group_path500_replacer
  assertEquals('group_path400_replacer.nextSibling == '
               + 'group_path500_replacer',
               paths[7], paths[5].nextSibling);
  assertEquals('group_path400_replacer.parentNode == group', group,
               paths[5].parentNode);
  // nextSibling/previousSibling for group_path500; this node was 
  // removed
  assertNull('group_path500.previousSibling == null',
             paths[4].previousSibling);
  assertNull('group_path500.nextSibling == null',
             paths[4].nextSibling);
  assertNull('group_path500.parentNode == null', paths[4].parentNode);
  // nextSibling/previousSibling for group_path500_replacer
  assertEquals('group_path500_replacer.previousSibling == '
              + 'group_path400_replacer',
              paths[5], paths[7].previousSibling);
  assertNull('group_path500_replacer.nextSibling == null',
             paths[7].nextSibling);
  assertEquals('group_path500_replacer.parentNode == group', group,
               paths[7].parentNode);
               
  // have a test where we do a replaceChild on a visual element with
  // another visual element to make sure the Flash side shows the correct
  // updates
  // create group and children to replace
  group = getDoc('svg2').createElementNS(svgns, 'g');
  group.id = 'replaceMePlease';
  group.setAttribute('x', 0);
  group.setAttribute('y', 0);
  group.setAttribute('transform', 'translate(200, 300)');
  circle = getDoc('svg2').createElementNS(svgns, 'circle');
  circle.setAttribute('cx', 30);
  circle.setAttribute('cy', 30);
  circle.setAttribute('r', 50);
  circle.style.fill = 'orange';
  group.appendChild(circle);
  text = getDoc('svg2').createElementNS(svgns, 'text');
  text.setAttribute('x', 30);
  text.setAttribute('y', 100);
  text.style.fill = 'red';
  text.style.fontWeight = 'bold';
  text.appendChild(getDoc('svg2').createTextNode('I should be replaced', true));
  group.appendChild(text);
  // append to DOM
  svg = getRoot('svg2');
  svg.appendChild(group);
  // create group and children that will be the replacee
  group = getDoc('svg2').createElementNS(svgns, 'g');
  group.setAttribute('x', 0);
  group.setAttribute('y', 0);
  group.setAttribute('transform', 'translate(220, 320)');
  circle = getDoc('svg2').createElementNS(svgns, 'circle');
  circle.setAttribute('cx', 30);
  circle.setAttribute('cy', 30);
  circle.setAttribute('r', 50);
  circle.style.fill = 'yellow';
  group.appendChild(circle);
  text = getDoc('svg2').createElementNS(svgns, 'text');
  text.setAttribute('x', 30);
  text.setAttribute('y', 100);
  text.style.fill = 'red';
  text.style.fontWeight = 'bold';
  text.appendChild(getDoc('svg2').createTextNode('I\'m the replacee!', true));
  group.appendChild(text);
  // do the replaceChild
  svg.replaceChild(group, getDoc('svg2').getElementById('replaceMePlease'));
  console.log('SECOND IMAGE: You should see a yellow circle and the text '
               + '"I\'m the replacee!" near the middle bottom of the image; '
               + 'you should _not_ see an orange circle and the '
               + 'text "I should be replaced"');
}

function testInsertBefore() {
  // Test insertBefore
  console.log('Testing insertBefore...');
  
  // before anything is appended to the DOM, insert an SVG GROUP
  // before another SVG GROUP
  group = getDoc('svg11242').createElementNS(svgns, 'g');
  group.id = 'shouldBeLast';
  group2 = getDoc('svg11242').createElementNS(svgns, 'g');
  group2.id = 'shouldBeFirst';
  group2.setAttribute('fill', 'red');
  parentNode = getDoc('svg11242').createElementNS(svgns, 'g');
  parentNode.appendChild(group);
  temp = parentNode.insertBefore(group2, group);
  assertEquals('parentNode.childNodes.length == 2', 2,
               parentNode.childNodes.length);
  assertEquals('parentNode.childNodes[0] == group2', group2,
               parentNode.childNodes[0]);
  assertEquals('parentNode.childNodes[1] == group', group,
               parentNode.childNodes[1]);             
  assertEquals('group2.parentNode == parentNode', parentNode,
               group2.parentNode);
  assertEquals('group.parentNode == parentNode', parentNode,
               group.parentNode);
  assertEquals('parentNode.firstChild.getAttribute(fill) == red',
               'red', parentNode.firstChild.getAttribute('fill'));
  assertNull('parentNode.lastChild.getAttribute(fill) == null',
             parentNode.lastChild.getAttribute('fill'));
  
  // after things are appended to the DOM, insert an SVG GROUP before
  // another SVG GROUP
  group = getDoc('svg11242').getElementById('g3269');
  group2 = getDoc('svg11242').getElementById('layer1A');
  assertEquals('g3269.parentNode.id == g4337', 'g4337', group.parentNode.id);
  assertEquals('layer1A.parentNode.id == g4337', 'g4337', group2.parentNode.id);
  group2.parentNode.removeChild(group2);
  assertNull('document.getElementById(layer1A) == null',
             getDoc('svg11242').getElementById('layer1A'));
  assertNull('group2.parentNode == null', group2.parentNode);
  temp = group.parentNode.insertBefore(group2, group);
  parentNode = getDoc('svg11242').getElementById('g4337');
  assertEquals('group2.parentNode == parentNode', parentNode,
               group2.parentNode);
  assertEquals('group2.nextSibling == group', group, group2.nextSibling);
  assertEquals('group.previousSibling == group2', group2,
               group.previousSibling);
  assertExists('document.getElementById(layer1A) should exist',
               getDoc('svg11242').getElementById('layer1A'));
  
  // after things are appended to the DOM, insert an SVG PATH before
  // an SVG CIRCLE
  path = getDoc('mySVG').createElementNS(svgns, 'path');
  path.setAttribute('d', 'M 186.73487,92.490168 C 188.75138,93.498448 192.34333,97.672468 193.37297,99.731747 C 194.46222,101.91025 195.90306,103.46878 197.59721,105.16293 C 199.10496,106.67067 202.59217,108.26386 204.83879,109.38717 C 207.79637,110.86598 211.25854,113.44764 213.89076,115.42183 C 216.93346,117.70386 220.449,120.16967 222.94271,122.66341 C 225.31886,125.03953 228.37059,127.18771 231.39124,128.69804 C 235.10473,130.55479 236.82534,133.28494 241.04666,134.12921 C 245.08284,134.93646 250.95305,138.23826 254.32286,140.16385 C 257.84084,142.17412 262.19671,143.49732 265.18523,144.99159 C 268.45466,146.6263 271.36813,146.8761 273.63373,148.0089 C 275.97169,149.17789 279.04857,149.8193 281.47876,149.8193');
  path.setAttribute('fill', 'none');
  path.setAttribute('fill-rule', 'evenodd');
  path.setAttribute('stroke', '#26241c');
  path.setAttribute('stroke-width', 2.91826558);
  path.setAttribute('stroke-linecap', 'butt');
  path.setAttribute('stroke-linejoin', 'miter');
  path.setAttribute('stroke-miterlimit', 4);
  path.setAttribute('stroke-dasharray', 'none');
  path.setAttribute('stroke-opacity', 1);
  circle = getDoc('mySVG').createElementNS(svgns, 'circle');
  circle.setAttribute('cx', 100);
  circle.setAttribute('cy', 50);
  circle.setAttribute('r', 40);
  circle.setAttribute('stroke', 'black');
  circle.setAttribute('stroke-width', 2);
  circle.setAttribute('fill', 'red');
  svg = getRoot('mySVG');
  svg.appendChild(circle);
  circle = svg.childNodes[svg.childNodes.length - 1];
  temp = svg.insertBefore(path, circle);
  assertEquals('svg.lastChild.nodeName == circle', 'circle',
               svg.lastChild.nodeName);
  assertEquals('svg.lastChild.parentNode == svg', svg,
               svg.lastChild.parentNode);
  assertEquals('temp == path', temp, path);
  assertEquals('temp.parentNode == svg', svg, temp.parentNode);
  assertEquals('path.parentNode == svg', svg, path.parentNode);
  
  // before anything is appended to the DOM, insert a namespaced
  // element before another one in the METADATA section
  rdf = getDoc('svg2').createElementNS(rdf_ns, 'rdf:RDF');
  textNode = getDoc('svg2').createTextNode('rdf content', true);
  rdf.appendChild(textNode);
  metadata = getDoc('svg2').createElementNS(svgns, 'metadata');
  dc = getDoc('svg2').createElementNS(dc_ns, 'dc:creator');
  textNode = getDoc('svg2').createTextNode('Home boy2', true);
  dc.appendChild(textNode);
  metadata.appendChild(rdf);
  temp = metadata.insertBefore(dc, rdf);
  assertEquals('metadata.childNodes.length == 2', 2,
               metadata.childNodes.length);
  assertEquals('metadata.childNodes[0].nodeName == dc:creator',
               'dc:creator', metadata.childNodes[0].nodeName);
  assertEquals('metadata.childNodes[1].nodeName == rdf:RDF',
               'rdf:RDF', metadata.childNodes[1].nodeName);            
  assertEquals('dc.parentNode == metadata', metadata, dc.parentNode);
  assertEquals('rdf.parentNode == metadata', metadata, rdf.parentNode);
  assertEquals('dc.nextSibling == rdf', rdf, dc.nextSibling);
  assertEquals('rdf.previousSibling == dc', dc, rdf.previousSibling);
    
  // after things are appended to the DOM, insert a namespaced
  // element before another one in the METADATA section
  metadata = getDoc('svg2').getElementById('metadata7');
  dc = getDoc('svg2').createElementNS(dc_ns, 'dc:description');
  dc.appendChild(getDoc('svg2').createTextNode('This is a description', true));
  rdf = metadata.firstChild;
  temp = metadata.insertBefore(dc, rdf);
  assertEquals('metadata.childNodes.length == 2', 2,
               metadata.childNodes.length);
  assertEquals('rdf.parentNode == metadata', metadata, rdf.parentNode);
  assertEquals('dc.parentNode == metadata', metadata, dc.parentNode);
  assertEquals('metadata.lastChild.nodeName == rdf:RDF', 'rdf:RDF',
               metadata.lastChild.nodeName);
  assertEquals('metadata.firstChild.nodeName == dc:description', 
               'dc:description', metadata.firstChild.nodeName);   
               
  // add a test where have a group with multiple children; then,
  // do an insertBefore in the middle and test to make sure that
  // next/previous sibling relationships work correctly on all the
  // nodes. Everything should be unattached.
  group = getDoc('svg11242').createElementNS(svgns, 'g');
  paths = [];
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  // we've used these IDs before; make sure they aren't in the DOM, since
  // we removed them in the past
  assertNull('document.getElementById(group_path100) == null',
             getDoc('svg11242').getElementById('group_path100'));
  assertNull('document.getElementById(group_path200) == null',
             getDoc('svg11242').getElementById('group_path200'));
  assertNull('document.getElementById(group_path300) == null',
             getDoc('svg11242').getElementById('group_path300'));
  assertNull('document.getElementById(group_path400) == null',
             getDoc('svg11242').getElementById('group_path400'));
  assertNull('document.getElementById(group_path500) == null',
             getDoc('svg11242').getElementById('group_path500'));
  assertNull('document.getElementById(group_path100_replacer) == null',
             getDoc('svg11242').getElementById('group_path100_replacer'));
  assertNull('document.getElementById(group_path400_replacer) == null',
             getDoc('svg11242').getElementById('group_path400_replacer'));
  assertNull('document.getElementById(group_path500_replacer) == null',
             getDoc('svg11242').getElementById('group_path500_replacer'));
  // now create our PATH elements
  paths[0].id = 'group_path100';
  group.appendChild(paths[0]);      
  // now create the other paths
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[1].id = 'group_path200';
  group.appendChild(paths[1]);
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[2].id = 'group_path300';
  group.appendChild(paths[2]);
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[3].id = 'group_path400';
  group.appendChild(paths[3]);
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[4].id = 'group_path500';
  group.appendChild(paths[4]);
  // elements that we will use to insert before earlier ones with
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  paths[5].id = 'group_path400_insertBefore';
  paths.push(getDoc('svg11242').createElementNS(svgns, 'path'));
  // now do an insertBefore in the middle and make sure sibling 
  // relationships still work correctly
  // paths[5] == group_path400_insertBefore
  // paths[3] == group_path400
  group.insertBefore(paths[5], paths[3]);
  assertEquals('group.childNodes after insertBefore == 6', 6,
               group.childNodes.length);
  // nextSibling/previousSibling for group_path100
  assertNull('group_path100.previousSibling == null',
             group.childNodes[0].previousSibling);
  assertEquals('group_path100.nextSibling == group_path200',
               paths[1], group.childNodes[0].nextSibling);
  assertEquals('group_path100.parentNode == group', group,
               group.childNodes[0].parentNode);
  // nextSibling/previousSibling for group_path200
  assertEquals('group_path200.previousSibling == group_path100',
             paths[0], group.childNodes[1].previousSibling);
  assertEquals('group_path200.nextSibling == group_path300',
               paths[2], group.childNodes[1].nextSibling);
  assertEquals('group_path200.parentNode == group', group,
               group.childNodes[1].parentNode);
  // nextSibling/previousSibling for group_path300
  assertEquals('group_path300.previousSibling == group_path200',
             paths[1], group.childNodes[2].previousSibling);
  // paths[5] == group_path400_insertBefore
  assertEquals('group_path300.nextSibling == group_path400_insertBefore',
               paths[5], group.childNodes[2].nextSibling);
  assertEquals('group_path300.parentNode == group', group,
               group.childNodes[2].parentNode);
  // nextSibling/previousSibling for group_path400_insertBefore
  // paths[2] == group_path300
  assertEquals('group_path400_insertBefore.previousSibling == group_path300',
             paths[2], group.childNodes[3].previousSibling);
  // paths[3] == group_path400
  assertEquals('group_path400_insertBefore.nextSibling == '
               + 'group_path400',
               paths[3], group.childNodes[3].nextSibling);
  assertEquals('group_path400_insertBefore.parentNode == group', group,
               group.childNodes[3].parentNode);
  // nextSibling/previousSibling for group_path400
  // paths[5] == group_path400
  assertEquals('group_path400.previousSibling == group_path400_insertBefore',
             paths[5], group.childNodes[4].previousSibling);
  // paths[4] == group_path500
  assertEquals('group_path400.nextSibling == group_path500',
               paths[4], group.childNodes[4].nextSibling);
  assertEquals('group_path400.parentNode == group', group,
               group.childNodes[4].parentNode);
  // nextSibling/previousSibling for group_path500
  assertEquals('group_path500.previousSibling == group_path400',
             paths[3], group.childNodes[5].previousSibling);
  assertNull('group_path500.nextSibling == null', 
             group.childNodes[5].nextSibling);
  assertEquals('group_path500.parentNode == group', group,
               group.childNodes[5].parentNode);
}

function testHasChildNodes() {
  // Test hasChildNodes
  console.log('Testing hasChildNodes...');
  
  // grab a group element from the document that has child nodes
  group = getDoc('svg2').getElementById('layer5');
  assertTrue('layer5.hasChildNodes() == true', group.hasChildNodes());
  
  // grab a path element from the document that doesn't have child nodes
  path = getDoc('svg2').getElementById('path3913');
  assertFalse('path3913.hasChildNodes() == false', path.hasChildNodes());
  
  // grab a text node from the document that doesn't have child nodes
  text = getDoc('mySVG').getElementById('myText');
  assertExists('myText should exist', text);
  assertTrue('text.hasChildNodes() == true', text.hasChildNodes());
  textNode = text.firstChild;
  assertExists('text.firstChild should exist', textNode);
  assertFalse('textNode.hasChildNodes() == false', 
              textNode.hasChildNodes());
  
  // grab a namespaced element from METADATA that has child nodes
  cc = getDoc('svg2').getElementById('myCCWork');
  assertExists('myCCWork should exist', cc);
  assertTrue('myCCWork.hasChildNodes() == true', cc.hasChildNodes());
  
  // grab a namespaced element from METADATA that does not have
  // child nodes
  dc = getDoc('svg2').getElementById('myDCType');
  assertExists('myDCType should exist', dc);
  assertFalse('dc.hasChildNodes() == false', dc.hasChildNodes());
  
  // test hasChildNodes on an unappended element and text node
  text = getDoc('svg11242').createElementNS(svgns, 'text');
  text.setAttribute('x', 250);
  text.setAttribute('y', 250);
  assertFalse('text before append, text.hasChildNodes() == false',
             text.hasChildNodes());
  textNode = getDoc('svg11242').createTextNode('hello world', true);
  text.appendChild(textNode);
  assertTrue('text before append, text.hasChildNodes() == true',
             text.hasChildNodes());
  assertFalse('textNode before append, textNode.hasChildNodes() == false', 
              textNode.hasChildNodes());
  
  // test an SVG root node
  svg = getRoot('svg2');
  assertTrue('svg.hasChildNodes() == true', svg.hasChildNodes());
}

function testHasAttributes() {
  // Test hasAttributes
  console.log('Testing hasAttributes...');

  // grab an element from the document that has attributes
  path = getDoc('svg2').getElementById('path3913');
  assertTrue('path3913.hasAttributes() == true', path.hasAttributes());

  // test on an svg root
  svg = getRoot('svg2');
  assertTrue('svg.hasAttributes() == true', svg.hasAttributes());

  // grab an element from the document that does not have attributes
  group = getDoc('mySVG').createElementNS(svgns, 'g');
  svg = getRoot('mySVG');
  svg.appendChild(group);
  assertFalse('group.hasAttributes() == false', group.hasAttributes());

  // grab a text node -- text nodes don't have attributes
  text = getDoc('svg11242').createElementNS(svgns, 'text');
  text.setAttribute('x', 250);
  text.setAttribute('y', 250);
  assertTrue('text before append, text.hasAttributes() == true',
             text.hasAttributes());
  textNode = getDoc('svg11242').createTextNode('hello world', true);
  text.appendChild(textNode);
  assertFalse('textNode before append, textNode.hasAttributes() == false', 
              textNode.hasAttributes());
  text = group.appendChild(text);
  assertTrue('text after append, text.hasAttributes() == true',
             text.hasAttributes());
  textNode = text.childNodes[0];
  assertFalse('textNode after append, textNode.hasAttributes() == false', 
              textNode.hasAttributes());

  // grab the SVG root which should have attributes
  svg = getRoot('mySVG');
  assertTrue('mySVG.hasAttributes() == true', svg.hasAttributes());

  // grab a namespaced element inside METADATA that has attributes
  cc = getDoc('svg2').getElementById('myCCWork');
  assertTrue('myCCWork.hasAttributes() == true', cc.hasAttributes());

  // grab a namespaced element inside of METADATA that does not have
  // attributes
  dc = getDoc('svg2').getElementsByTagNameNS(dc_ns, 'format')[0];
  assertFalse('dc.hasAttributes() == false', dc.hasAttributes());
}

function testIsSupported() {
  // Test Node.isSupported
  console.log('Testing Node.isSupported...');
  
  // Test various support levels
  
  // Note: Firefox 3 doesn't support Node.isSupported natively
  // on SVG elements (throws not supported exception) so we can't
  // test isSupported there
  if (renderer != 'native' 
        && navigator.userAgent.indexOf('Gecko') == -1) {   
    path = getDoc('svg2').getElementById('path3913');
    assertTrue('path.isSupported(Core, 2.0) == true',
               path.isSupported('Core', '2.0'));
    assertFalse('path.isSupported(Core, 4.0) == false',
               path.isSupported('Core', '4.0'));
    assertTrue('path.isSupported(Events, 2.0) == true',
               path.isSupported('Events', '2.0'));
    assertTrue('path.isSupported(UIEvents, 2.0) == true',
               path.isSupported('UIEvents', '2.0'));
    assertTrue('path.isSupported(MouseEvents, 2.0) == true',
               path.isSupported('MouseEvents', '2.0'));
    if (renderer == 'native') {
      assertTrue('path.isSupported(HTML, 2.0) == true',
                   path.isSupported('HTML', '2.0'));
    } else if (renderer == 'flash') {
      assertFalse('path.isSupported(HTML, 2.0) == false',
                   path.isSupported('HTML', '2.0'));
    }
  }
}

function testStyle() {
  // Test .style property
  console.log('Testing style property...');
  
  // test .style property on unattached nodes:
  // * set style values that have no attribute values
  //    * make sure that attribute values don't get updated as well
  // * get style values that have no attribute values
  // * set style values that have attributes values
  //    * ensure style string is consistent
  // * get style values that have attribute values
  circle = getDoc('mySVG').createElementNS(svgns, 'circle');
  circle.setAttribute('cx', 350);
  circle.setAttribute('cy', 400);
  circle.setAttribute('r', 50);
  circle.style.fill = 'red';
  circle.style.stroke = 'blue';
  circle.style.strokeWidth = 10;
  assertNull('circle.getAttribute(fill) == null', 
             circle.getAttribute('fill'));
  assertNull('circle.getAttribute(stroke) == null', 
             circle.getAttribute('stroke'));
  assertNull('circle.getAttribute(stroke-width) == null', 
             circle.getAttribute('stroke-width'));
  // make sure attributes don't get set
  // NOTE: Safari transforms color names into their RGB hex
  // values, so 'red' becomes '#FF0000'. Safari also transforms
  // unit measurements into their actual types, so '10' becomes '10px'
  assertEqualsAny('circle.style.fill == red or #FF0000 or #ff0000',
                  ['red', '#FF0000', '#ff0000'],
                  circle.style.fill);
  assertEqualsAny('circle.style.stroke == blue or #0000FF or #0000ff',
                  ['blue', '#0000FF', '#0000ff'],
                  circle.style.stroke);
  assertEqualsAny('circle.style.strokeWidth == 10 or 10px',
                  [10, '10px'],
                  circle.style.strokeWidth);
  // make sure style[prop] syntax works
  assertEqualsAny('circle.style[fill] == red or #FF0000 or #ff0000', 
                  ['red', '#FF0000', '#ff0000'], 
                  circle.style['fill']);
  assertEqualsAny('circle.style[stroke] == blue or #0000FF or #0000ff',
                  ['blue', '#0000FF', '#0000ff'],
                  circle.style['stroke']);
  assertEqualsAny('circle.style[strokeWidth] == 10 or 10px',
                  [10, '10px'],
                  circle.style['strokeWidth']);
  // now set attributes; surprisingly, styles should retain their old
  // values
  circle.setAttribute('fill', 'blue');
  circle.setAttribute('stroke', 'red');
  circle.setAttribute('stroke-width', 5);
  assertEqualsAny('circle.getAttribute(fill) == blue '
                  + 'or #0000FF or #0000ff',
                  ['blue', '#0000FF', '#0000ff'],
                  circle.getAttribute('fill'));
  assertEqualsAny('circle.style.fill == red or #FF0000 or #ff0000',
                  ['red', '#FF0000', '#ff0000'],
                  circle.style.fill);
  assertEqualsAny('circle.getAttribute(stroke) == red '
                  + 'or #FF0000 or #ff0000',
                  ['red', '#FF0000', '#ff0000'],
                  circle.getAttribute('stroke'));
  assertEqualsAny('circle.style.stroke == blue or #0000FF or #0000ff',
                  ['blue', '#0000FF', '#0000ff'],
                  circle.style.stroke);
  assertEqualsAny('circle.getAttribute(stroke-width) == 5 or 5px',
                  [5, '5px'],
                  circle.getAttribute('stroke-width'));
  assertEqualsAny('circle.style.strokeWidth == 10 or 10px',
                  [10, '10px'],
                  circle.style.strokeWidth);
  // set style again to see if it overrides attribute setting;
  // it should _not_ -- XML attributes have precedence over style
  circle.style.fill = 'green';
  assertEqualsAny('circle.style.fill == green or #008000',
                  ['green', '#008000'],
                  circle.style.fill);
  // attribute and style have independent values
  assertEqualsAny('circle.getAttribute(fill) == blue '
                  + 'or #0000FF or #0000ff',
                  ['blue', '#0000FF', '#0000ff'],
                  circle.getAttribute('fill'));
  // attach node and make sure it shows up correctly
  svg = getRoot('mySVG');
  svg.appendChild(circle);
  
  // repeat the above steps, but with a node that is attached
  circle = getDoc('mySVG').createElementNS(svgns, 'circle');
  svg = getRoot('mySVG');
  svg.appendChild(circle);
  circle.setAttribute('cx', 200);
  circle.setAttribute('cy', 200);
  circle.setAttribute('r', 50);
  circle.style.fill = 'red';
  circle.style.stroke = 'blue';
  circle.style.strokeWidth = 10;
  assertNull('circle.getAttribute(fill) == null', 
             circle.getAttribute('fill'));
  assertNull('circle.getAttribute(stroke) == null', 
             circle.getAttribute('stroke'));
  assertNull('circle.getAttribute(stroke-width) == null', 
             circle.getAttribute('stroke-width'));
  // make sure attributes don't get set
  assertEqualsAny('circle.style.fill == red or #FF0000 or #ff0000', 
                  ['red', '#FF0000', '#ff0000'], 
                  circle.style.fill);
  assertEqualsAny('circle.style.stroke == blue or #0000FF or #0000ff',
                  ['blue', '#0000FF', '#0000ff'],
                  circle.style.stroke);
  assertEqualsAny('circle.style.strokeWidth == 10 or 10px',
                  [10, '10px'],
                  circle.style.strokeWidth);
  // make sure style[prop] syntax works
  assertEqualsAny('circle.style[fill] == red or #FF0000 or #ff0000',
                  ['red', '#FF0000', '#ff0000'], 
                  circle.style['fill']);
  assertEqualsAny('circle.style[stroke] == blue or #0000FF or #0000ff',
                  ['blue', '#0000FF', '#0000ff'],
                  circle.style['stroke']);
  assertEqualsAny('circle.style[strokeWidth] == 10 or 10px',
                  [10, '10px'],
                  circle.style['strokeWidth']);
  // now set attributes; surprisingly, styles should retain their old
  // values
  circle.setAttribute('fill', 'blue');
  circle.setAttribute('stroke', 'red');
  circle.setAttribute('stroke-width', 5);
  assertEqualsAny('circle.getAttribute(fill) == blue '
                  + 'or #0000FF or #0000ff',
                  ['blue', '#0000FF', '#0000ff'],
                  circle.getAttribute('fill'));
  assertEqualsAny('circle.style.fill == red or #FF0000 or #ff0000',
                  ['red', '#FF0000', '#ff0000'],
                  circle.style.fill);
  assertEqualsAny('circle.getAttribute(stroke) == red '
                  + 'or #FF0000 or #ff0000',
                  ['red', '#FF0000', '#ff0000'],
                  circle.getAttribute('stroke'));
  assertEqualsAny('circle.style.stroke == blue or #0000FF or #0000ff',
                  ['blue', '#0000FF', '#0000ff'],
                  circle.style.stroke);
  assertEqualsAny('circle.getAttribute(stroke-width) == 5 or 5px',
                  [5, '5px'],
                  circle.getAttribute('stroke-width'));
  assertEqualsAny('circle.style.strokeWidth == 10 or 10px',
                  [10, '10px'],
                  circle.style.strokeWidth);
  // set style again to see if it overrides attribute setting;
  // it should _not_ -- XML attributes have precedence over style
  circle.style.fill = 'green';
  assertEqualsAny('circle.style.fill == green or #008000',
                  ['green', '#008000'],
                  circle.style.fill);
  // attribute and style have independent values
  assertEqualsAny('circle.getAttribute(fill) == blue '
                  + 'or #0000FF or #0000ff',
                  ['blue', '#0000FF', '#0000ff'],
                  circle.getAttribute('fill'));
            
  // remove an element, set and get some styles, then reattach it
  // and make sure styles show up
  circle = getDoc('mySVG').createElementNS(svgns, 'circle');
  svg = getRoot('mySVG');
  svg.appendChild(circle);
  circle.style.stroke = 'blue';
  circle.style.strokeWidth = 10;
  circle.setAttribute('cx', 100);
  circle.setAttribute('cy', 250);
  circle.setAttribute('r', 20);
  svg.removeChild(circle);
  circle.style.fill = 'yellow';
  circle.style.strokeWidth = 15;
  circle.style.stroke = 'green';
  svg.appendChild(circle);
  circle.style.stroke = 'pink';
  assertEqualsAny('circle.style.fill == yellow or #FFFF00 or #ffff00',
                  ['yellow', '#FFFF00', '#ffff00'],
                  circle.style.fill);
  assertEqualsAny('circle.style.strokeWidth == 15 or 15px',
                  [15, '15px'],
                  circle.style.strokeWidth);             
  assertEqualsAny('circle.style.stroke == pink or #FFC0CB or #ffc0cb',
                  ['pink', '#FFC0CB', '#ffc0cb'],
                  circle.style.stroke);
  assertEquals('circle.getAttribute(r) == 20', 20,
                circle.getAttribute('r'));
  
  // test setting and getting common style values across a range of style
  // attributes across a range of different SVG elements
  
  // rectangle
  rect = getDoc('mySVG').createElementNS(svgns, 'rect');
  svg = getRoot('mySVG');
  rect.setAttribute('x', 400);
  rect.setAttribute('y', 20);
  rect.setAttribute('width', 60);
  rect.setAttribute('height', 60);
  rect.setAttribute('rx', 3);
  rect.setAttribute('ry', 5);
  rect.style.opacity = 0.5;
  rect.style.fill = '#0000FF';
  svg.appendChild(rect);
  rect.style.stroke = 'rgb(0, 255, 0)';
  rect.style.strokeWidth = '10px';
  rect.style.strokeOpacity = 0.8;
  rect.style.strokeLinecap = 'round';
  rect.style.strokeLinejoin = 'round';
  rect.style.strokeMiterlimit = 15;
  rect.style.strokeDasharray = '5,3,2';
  rect.style.strokeDashoffset = 3;
  assertEqualsAny('rect.style.opacity == 0.5',
                  [0.5],
                  rect.style.opacity);
  assertEqualsAny('rect.style.stroke == rgb(0, 255, 0) '
                  + 'or #00FF00 or #00ff00',
                  ['rgb(0, 255, 0)', '#00FF00', '#00ff00'],
                  rect.style.stroke);
  assertEqualsAny('rect.style.fill == #0000FF '
                  + 'or rgb(0, 0, 255) or #0000ff',
                  ['#0000FF', 'rgb(0, 0, 255)', '#0000ff'],
                  rect.style.fill);               
  assertEqualsAny('rect.style.strokeWidth == 10px',
                  ['10px'],
                  rect.style.strokeWidth);
  assertEqualsAny('rect.style.strokeOpacity == 0.8',
                  [0.8],
                  rect.style.strokeOpacity);
  assertEqualsAny('rect.style.strokeLinecap == round',
                  ['round'],
                  rect.style.strokeLinecap);
  assertEqualsAny('rect.style.strokeLinejoin == round',
                  ['round'],
                  rect.style.strokeLinejoin);
  assertEqualsAny('rect.style.strokeMiterlimit == 15',
                  [15],
                  rect.style.strokeMiterlimit);
  // Safari adds pixel info; FF adds spaces to strokeDasharray values
  assertEqualsAny('rect.style.strokeDasharray == '
                  + '5,3,2 or 5, 3, 2 or 5px, 3px, 2px',
                  ['5,3,2', '5, 3, 2', '5px, 3px, 2px'],
                  rect.style.strokeDasharray);
  // Safari adds pixel info to strokeDashoffset
  assertEqualsAny('rect.style.strokeDashoffset == 3 or 3px',
                  [3, '3px'],
                  rect.style.strokeDashoffset);
 
  // line and g
  group = getDoc('mySVG').createElementNS(svgns, 'g');
  group.id = 'testStyleG';
  group.style.stroke = 'green'; // should pass to children (i.e. the line)
  line = getDoc('mySVG').createElementNS(svgns, 'line');
  line.id = 'testStyleLine';
  line.setAttribute('x1', 100);
  line.setAttribute('y1', 100);
  line.setAttribute('x2', 200);
  line.setAttribute('y2', 200);
  line.style['strokeWidth'] = '5px';
  line.style.opacity = 0.8;
  group.appendChild(line);
  svg = getRoot('mySVG');
  svg.appendChild(group);
  // get the line and group through getElementsByTagNameNS to make
  // sure style works from those
  matches = getDoc('mySVG').getElementsByTagNameNS(svgns, 'g');
  group = null;
  for (var i = 0; i < matches.length; i++) {
    if (matches[i].getAttribute('id') == 'testStyleG') {
      group = matches[i];
      break;
    }
  }
  assertExists('testStyleG should exist', group);
  matches = getDoc('mySVG').getElementsByTagNameNS(svgns, 'line');
  line = null;
  for (var i = 0; i < matches.length; i++) {
    if (matches[i].getAttribute('id') == 'testStyleLine') {
      line = matches[i];
      break;
    }
  }
  assertExists('testStyleLine should exist', line);
  // now make sure style properties are correct
  assertEqualsAny('group.style.stroke == green or #008000',
                  ['green', '#008000'],
                  group.style.stroke);
  assertEqualsAny('line.style[opacity] == 0.8',
                  [0.8],
                  line.style['opacity']);
  assertEqualsAny('line.style.strokeWidth == 5 or 5px',
                  [5, '5px'],
                  line.style.strokeWidth);
  // make sure stroke color got inherited from the group
  console.log('FIRST IMAGE: There should be a green line on the screen');
  
  // path
  svg = getRoot('mySVG');
  path = getDoc('mySVG').createElementNS(svgns, 'path');
  path.setAttribute('d', 'M 276.7942,130.31422 C 277.86932,148.45158 284.99929,164.68195 290.10668,181.7066 C 292.40065,189.35315 295.52304,197.25984 298.46568,204.61645 C 300.33395,209.28711 300.74063,213.93183 301.56161,218.85771 C 302.07568,221.9421 302.49039,224.68887 302.49039,227.83589');
  path.style.opacity = 1;
  path.style.fill = 'none';
  path.style.fillOpacity = 0.31948882;
  path.style.stroke = '#FF0000';
  svg.appendChild(path);
  path.style.strokeWidth = 1.29999995;
  path.style.strokeLinejoin = 'miter';
  path.style.strokeMiterlimit = 4;
  path.style.strokeDasharray = 'none';
  path.style.strokeOpacity = 1;
  path.style.display = 'inline';
  // make sure all the values are correct
  assertEqualsAny('path.style.opacity == 1',
                  [1],
                  path.style.opacity);
  assertEqualsAny('path.style.fill == none',
                  ['none'],
                  path.style.fill);
  // fillOpacity gets rounded off on some browsers
  assertEqualsAny('path.style.fillOpacity == 0.31948882 or 0.319489',
                  [0.31948882, 0.319489],
                  path.style.fillOpacity);
  // strokeWidth gets rounded differently on some browsers
  assertEqualsAny('path.style.strokeWidth == 1.29999995 '
                  + 'or 1.29999995px or 1.3px or 1.3',
                  [1.29999995, '1.29999995px', '1.3px', '1.3'],
                  path.style.strokeWidth);
  assertEqualsAny('path.style.stroke == #FF0000 '
                  + 'or rgb(255, 0, 0) or #ff0000',
                  ['#FF0000', 'rgb(255, 0, 0)', '#ff0000'],
                  path.style.stroke);
  assertEqualsAny('path.style.strokeLinejoin == miter',
                  ['miter'],
                  path.style.strokeLinejoin);
  assertEqualsAny('path.style.strokeMiterlimit == 4',
                  ['4'],
                  path.style.strokeMiterlimit);
  assertEqualsAny('path.style.strokeDasharray == none',
                  ['none'],
                  path.style.strokeDasharray);
  assertEqualsAny('path.style.strokeOpacity == 1',
                  ['1'],
                  path.style.strokeOpacity);
  console.log('FIRST IMAGE: There should be a red path on the screen');
  
  // linearGradient
  gradient = getDoc('svg2').createElementNS(svgns, 'linearGradient');
  gradient.id = 'testGradient1';
  stop = getDoc('svg2').createElementNS(svgns, 'stop');
  stop.style.stopColor = '#ffffff';
  stop.style.stopOpacity = 1;
  stop.setAttribute('offset', 0);
  gradient.appendChild(stop);
  stop.setAttribute('id', 'testStop1'); // set ID after appending
  stop = getDoc('svg2').createElementNS(svgns, 'stop');
  stop.style.stopColor = '#bfbfbf';
  stop.style.stopOpacity = 1;
  stop.setAttribute('offset', 0.7);
  gradient.appendChild(stop);
  stop = getDoc('svg2').createElementNS(svgns, 'stop');
  stop.style.stopColor = '#525252';
  stop.style.stopOpacity = 1;
  stop.setAttribute('offset', 1);
  gradient.appendChild(stop);
  // get the defs element for mySVG, use NodeList.item() to do so
  matches = getDoc('svg2').getElementsByTagNameNS(svgns, 'defs');
  defs = null;
  for (var i = 0; i < matches.length; i++) {
    assertExists('matches.item(' + i + ') should exist', matches.item(i));
    if (matches.item(i).parentNode.id == 'svg2') {
      defs = matches.item(i);
      break;
    }
  }
  assertExists('defs for svg2 should exist', defs);
  // add the gradient to the defs section
  defs.appendChild(gradient);
  // now create a circle that will use this gradient
  circle = getDoc('svg2').createElementNS(svgns, 'circle');
  circle.setAttribute('cx', 50);
  circle.setAttribute('cy', 50);
  circle.setAttribute('r', 100);
  circle.style.fill = 'url(#testGradient1)';
  circle.style.stroke = 'white';
  circle.style.strokeWidth = '3px';
  svg = getRoot('svg2');
  svg.appendChild(circle);
  // test all of our style values
  // Firefox makes the fill become 'url(#testGradient1) rgb(0, 0, 0)'
  // for some reason
  // TODO: investigate if this is something we should do too
  assertEqualsAny('circle.style.fill == url(#testGradient1) or '
                  + '"url(#testGradient1) rgb(0, 0, 0)"',
                  ['url(#testGradient1)', 
                   'url(#testGradient1) rgb(0, 0, 0)'],
                  circle.style.fill);
  assertEqualsAny('circle.style.stroke == white or #FFFFFF or #ffffff',
                  ['white', '#FFFFFF', '#ffffff'],
                  circle.style.stroke); 
  // test each of the linearGradient's children using NodeList.item()
  assertEqualsAny('gradient.childNodes.item(0).style.stopColor == '
                  + '#ffffff or #FFFFFF or rgb(255, 255, 255)',
                  ['#ffffff', '#FFFFFF', 'rgb(255, 255, 255)'],
                  gradient.childNodes.item(0).style.stopColor);
  assertEqualsAny('gradient.childNodes.item(0).style.stopOpacity == 1',
                  [1],
                  gradient.childNodes.item(0).style.stopOpacity);
  assertEqualsAny('gradient.childNodes.item(1).style.stopColor == '
                  + '#bfbfbf or #BFBFBF or rgb(191, 191, 191)',
                  ['#bfbfbf', '#BFBFBF', 'rgb(191, 191, 191)'],
                  gradient.childNodes.item(1).style.stopColor);
  assertEqualsAny('gradient.childNodes.item(1).style.stopOpacity == 1',
                  [1],
                  gradient.childNodes.item(1).style.stopOpacity);
  assertEqualsAny('gradient.childNodes.item(2).style.stopColor == '
                  + '#525252 or rgb(82, 82, 82)',
                  ['#525252', 'rgb(82, 82, 82)'],
                  gradient.childNodes.item(2).style.stopColor);
  assertEqualsAny('gradient.childNodes.item(2).style.stopOpacity == 1',
                  [1],
                  gradient.childNodes.item(2).style.stopOpacity);
  // repeat, but get the first stop node using an ID, then move to the
  // next using nextSibling to make styles work with sibling navigation
  stop = getDoc('svg2').getElementById('testStop1');
  assertExists('stop node with ID testStop1 should exist', stop);
  // first stop node
  assertEqualsAny('first stop.style.stopColor == '
                  + '#ffffff or #FFFFFF or rgb(255, 255, 255)',
                  ['#ffffff', '#FFFFFF', 'rgb(255, 255, 255)'],
                  stop.style.stopColor);
  assertEqualsAny('first stop.style.stopOpacity == 1',
                  [1],
                  stop.style.stopOpacity);
  // second stop node
  stop = stop.nextSibling;
  assertEqualsAny('second stop.style.stopColor == '
                  + '#bfbfbf or #BFBFBF or rgb(191, 191, 191)',
                  ['#bfbfbf', '#BFBFBF', 'rgb(191, 191, 191)'],
                  stop.style.stopColor);
  assertEqualsAny('second stop.style.stopOpacity == 1',
                  [1],
                  stop.style.stopOpacity);
  // third stop node
  stop = stop.nextSibling;
  assertEqualsAny('third stop.style.stopColor == '
                  + '#525252 or rgb(82, 82, 82)',
                  ['#525252', 'rgb(82, 82, 82)'],
                  stop.style.stopColor);
  assertEqualsAny('third stop.style.stopOpacity == 1',
                  [1],
                  stop.style.stopOpacity);
  console.log('SECOND IMAGE: There should be a circle with a linear gradient in it '
              + 'on the upper left');
       
  // image
  image = getDoc('svg11242').createElementNS(svgns, 'image');
  image.setAttributeNS(xlinkns, 'xlink:href', 'balloon.jpg');
  image.setAttribute('x', 20);
  image.setAttribute('y', 20);
  image.setAttribute('width', '100px');
  image.setAttribute('height', '100px');
  image.style.opacity = 0.8;
  svg = getRoot('svg11242');
  svg.appendChild(image);
  assertEqualsAny('svg11242.lastChild.style.opacity == 0.8',
                  [0.8],
                  svg.lastChild.style.opacity);
  console.log('THIRD IMAGE: There should be a scaled black and white image of '
              + 'balloons');
          
  // text
  text = getDoc('mySVG').createElementNS(svgns, 'text');
  text.id = 'testStyleText1';
  text.setAttribute('x', 30);
  text.setAttribute('y', 400);
  text.style.fill = 'yellow';
  text.style.fontSize = '30px';
  text.style.fontWeight = 'bold';
  text.appendChild(getDoc('mySVG').createTextNode('Some bolded text!', true));
  svg = getRoot('mySVG');
  svg.appendChild(text);
  // get text node from getElementById to make sure styles work after
  // that
  text = getDoc('mySVG').getElementById('testStyleText1');
  assertExists('testStyleText1 should exist', text);
  assertEqualsAny('text.style.fill == yellow or #FFFF00 or #ffff00',
                  ['yellow', '#FFFF00', '#ffff00'],
                  text.style.fill);
  assertEqualsAny('text.style.fontSize == 30px',
                  ['30px'],
                  text.style.fontSize);
  assertEqualsAny('text.style.fontWeight == bold',
                  ['bold'],
                  text.style.fontWeight);
  console.log('FIRST IMAGE: There should be some bolded text that says '
              + '"Some bolded text!"');
          
  // desc
  desc = getDoc('mySVG').createElementNS(svgns, 'desc');
  desc.appendChild(getDoc('mySVG').createTextNode('A desc', true));
  svg = getRoot('mySVG');
  svg.appendChild(desc);
  desc.style.fill = 'green'; // nothing should display!
  desc.style.border = '1px solid black';
  
  // change the style of some rectangles that are already in the page
  rect1 = getDoc('mySVG').getElementById('anotherRect1');
  assertExists('anotherRect1 should exist', rect1);
  rect2 = getDoc('mySVG').getElementById('anotherRect2');
  assertExists('anotherRect2 should exist', rect2);
  assertEqualsAny('anotherRect1.style.fill == blue or #0000FF or rgb(0, 0, 255)',
                  ['blue', '#0000FF', 'rgb(0, 0, 255)'],
                  rect1.style.fill);
  rect1.style.fill = 'green';
  assertEqualsAny('anotherRect1.style.fill == green or #008000 or rgb(0, 128, 0)',
                  ['green', '#008000', 'rgb(0, 128, 0)'],
                  rect1.style.fill);
  console.log('FIRST IMAGE: You should see a green rectangle, and _not_ a blue '
              + 'rectangle');
  rect2.style.fill = 'yellow';
  assertEqualsAny('anotherRect2.style.fill == yellow or #0000FF or rgb(0, 0, 255)',
                  ['yellow', '#FFFF00', 'rgb(255, 255, 0)'],
                  rect2.style.fill);
  console.log('FIRST IMAGE: You should see a yellow rectangle, and _not_ a '
              + 'black rectangle');
  
  // Test default style values for unattached and attached nodes.
  // FF and Safari for native handling return empty strings or 
  // undefined for all of these, so we mimic this behavior
  group = getDoc('mySVG').createElementNS(svgns, 'g');
  styleReturned = false;
  for (var i = 0; i < allStyles.length; i++) {
    var styleName = allStyles[i];
    var styleValue = group.style[styleName];
    if (styleValue) {
      styleReturned = true;
      break;
    }
  }
  assertFalse('unattached group.style.* should be undefined for '
              + 'default styles',
              styleReturned);
  // attach node and repeat
  svg = getRoot('mySVG');
  svg.appendChild(group);
  styleReturned = false;
  for (var i = 0; i < allStyles.length; i++) {
    var styleName = allStyles[i];
    var styleValue = group.style[styleName];
    if (styleValue) {
      styleReturned = true;
      break;
    }
  }
  assertFalse('attached group.style.* should be undefined for '
              + 'default styles',
              styleReturned);
  
  // test on elements that have style settings in the markup and 
  // document itself; get style values different ways, set them, etc.
  // Read style values off an element first.
  group = getDoc('svg2').getElementById('layer1');
  assertExists('layer1 should exist', group);
  // Note: embed2.svg changes layer1.style.opacity from 1 to 0.4
  if (_hasObjects) {
    assertEqualsAny('layer1.style.opacity == 0.4',
                    [0.4],
                    group.style.opacity);
  } else {
    assertEqualsAny('layer1.style.opacity == 1',
                    [1],
                    group.style.opacity);
  }
  assertEqualsAny('layer1.style.display == inline',
                  ['inline'],
                  group.style.display);
  // For the native handler, Firefox and Safari put spaces in different places 
  // in their style strings; Safari also doesn't have a trailing semicolon. 
  // Safari also switches having 'display' before 'opacity' property.
  if (_hasObjects) {
    assertTrue('layer1.getAttribute(style) == opacity:0.4;display:inline;',
               (/\s*opacity:\s*0.4;?/.test(group.getAttribute('style'))
               && /\s*display:\s*inline;?/.test(group.getAttribute('style'))));
  } else {
    assertTrue('layer1.getAttribute(style) == opacity:1;display:inline;',
               (/\s*opacity:\s*1;?/.test(group.getAttribute('style'))
               && /\s*display:\s*inline;?/.test(group.getAttribute('style'))));
  }
  // repeat reading style values off another element
  rect = getDoc('svg2').getElementById('rect3926');
  // NOTE: unfortunately, FF has a bug where it doesn't mirror all
  // styles set with the style="" attribute into the 
  // element.style.* namespace! It only mirrors some, such as opacity
  // and display, but not others like fill.
  doTests = true;
  if (isFF && renderer == 'native') {
    doTests = false;
  }
  if (doTests) {
    assertEqualsAny('rect3926.style.opacity == 1',
                    [1],
                    rect.style.opacity);
    assertEqualsAny('rect3926.style.fill == #c1cfeb or #C1CFEB',
                    ['#c1cfeb', '#C1CFEB'],
                    rect.style.fill);
    assertEqualsAny('rect3926.style.fillOpacity == 1',
                    [1],
                    rect.style.fillOpacity);
    assertEqualsAny('rect3926.style.stroke == #555040',
                    ['#555040'],
                    rect.style.stroke); 
    assertEqualsAny('rect3926.style.strokeWidth == 3.1614 or '
                    + '3.1614px or 3.16145px or 3.16145396',
                    [3.1614, '3.1614px', '3.16145px', 3.16145396],
                    rect.style.strokeWidth);
    assertEqualsAny('rect3926.style[strokeWidth] == 3.16145396 '
                    + 'or 3.16145396 or 3.16145px or 3.16145396',
                    [3.16145396, '3.16145396', '3.16145px', 3.16145396],
                    rect.style['strokeWidth']);
    assertEqualsAny('rect3926.style.strokeLinejoin == miter',
                    ['miter'],
                    rect.style.strokeLinejoin);
    assertEqualsAny('rect3926.style.strokeDasharray == none',
                    ['none'],
                    rect.style.strokeDasharray);
    assertEqualsAny('rect3926.style.strokeOpacity == 1',
                    [1],
                    rect.style.strokeOpacity);
    assertEqualsAny('rect3926.style.display == inline',
                    ['inline'],
                    rect.style.display);   
    // do a style[] type access
    assertEqualsAny('rect3926.style[strokeWidth] == 3.16145396 '
                    + 'or 3.16145396 or 3.16145px',
                    [3.16145396, '3.16145396', '3.16145px'],
                    rect.style['strokeWidth']);
  }
  // change a CSS value that is also used by HTML and make sure it changes
  rect.style.display = 'block';
  assertEqualsAny('rect3926.style.display after changing == block',
                  ['block'],
                  rect.style.display);              
  // change a visible SVG style
  group = getDoc('svg2').getElementById('layer1');
  group.style.opacity = 0.4;
  assertEqualsAny('layer1.style.opacity after changing == 0.4',
                  [0.4],
                  group.style.opacity); 
  
  // apply style on a use element that references a rectangle
  // * NOTE: Firefox 3's native support has a bug where it doesn't
  // correctly display the rectangle
  // * FIXME: This test has a number of issues; see the TODOs below.
  // With the Flash handler, it also doesn't position correctly
  // on the screen. I believe these are issues with the Flash USE
  // code, which is probably fixed on trunk so I am not going to
  // fix it on my branch. Check after the merge to see if the issue
  // still stands.
  defs = getDoc('svg2').getElementById('defs4');
  assertExists('defs4 should exist', defs);
  // create rectangle in our defs that we will reference
  rect = getDoc('svg2').createElementNS(svgns, 'rect');
  rect.setAttribute('id', 'bar');
  rect.setAttribute('width', 196);
  rect.setAttribute('height', 21);
  rect.setAttribute('fill', 'brown');
  rect.style.stroke = 'purple';
  rect.style.strokeWidth = '5px';
  defs.appendChild(rect);
  // now create USE element using this rectangle
  use = getDoc('svg2').createElementNS(svgns, 'use');
  use.setAttribute('id', 'testUse1');
  use.setAttributeNS(xlinkns, 'xlink:href', 'bar');
  // set our USE values
  use.setAttribute('x', '275px');
  use.setAttribute('y', '400px');
  use.setAttribute('width', '50px');
  use.setAttribute('height', '50px');
  // * TODO: Should the USE elements 50x50 setting above pass through into
  // the RECT? It's not on with the native support on Safari nor in our
  // Flash viewer.
  // * TODO: I'm confused on whether styles added to the USE element
  // using use.style should override and apply to the underlying
  // RECT that is being used. On Safari it _doesn't_, while FF has a
  // bug that doesn't even ever display the rectangle. Find out 
  // correct spec behavior and support that with some tests that override
  // and add new styles.
  // Add USE to our second SVG; get the second SVG through parentNode
  // to make sure .id still works for browsers with native handling.
  svg = defs.parentNode;
  assertEquals('svg.id == svg2', 'svg2', svg.id);
  svg.appendChild(use);
  // get USE element from DOM using getElementById to test that
  use = getDoc('svg2').getElementById('testUse1');
  assertExists('use should exist', use);
  // make sure no children show up under USE element
  assertEquals('use.childNodes.length == 0', 0, use.childNodes.length);
  assertNull('use.firstChild == null', use.firstChild);
  // make sure use.x, y, width, and height have correct values
  assertEquals('use.x == 275', 275, use.x.baseVal.value);
  assertEquals('use.y == 400', 400, use.y.baseVal.value);
  assertEquals('use.width == 50', 50, use.width.baseVal.value);
  assertEquals('use.height == 50', 50, use.height.baseVal.value);
  // make sure that the rect's styles don't 'leak' through
  assertNotExists('use.style.stroke should not exist',
                  use.style.stroke);
  assertNull('use.getAttribute(fill) == null', use.getAttribute('fill'));
  console.log('SECOND IMAGE: There should be a brown rectangle with 5px stroke '
              + 'in the lower right corner of the image');
  
  // test display and visibility properties
  
  // make a rectangle invisible
  rect = getDoc('mySVG').createElementNS(svgns, 'rect');
  svg = getRoot('mySVG');
  rect.setAttribute('x', 380);
  rect.setAttribute('y', 100);
  rect.setAttribute('width', 30);
  rect.setAttribute('height', 30);
  rect.setAttribute('rx', 3);
  rect.setAttribute('ry', 5);
  rect.style.opacity = 0.5;
  rect.style.fill = '#0000FF';
  svg.appendChild(rect);
  assertEquals('rect.style.visibility == ""', '', 
                  rect.style.visibility); 
  rect.style.visibility = 'hidden';
  rect.style.stroke = 'rgb(0, 255, 0)';
  rect.style.strokeWidth = '10px';
  rect.style.strokeOpacity = 0.8;
  rect.style.strokeLinecap = 'round';
  rect.style.strokeLinejoin = 'round';
  rect.style.strokeMiterlimit = 15;
  assertEquals('rect.style.visibility == hidden', 'hidden',
               rect.style.visibility);
  console.log('FIRST IMAGE: You should _not_ see a small light blue rectangle '
              + 'with curved corners in the upper right');

  // make some text invisible
  text = getDoc('mySVG').createElementNS(svgns, 'text');
  text.appendChild(getDoc('mySVG').createTextNode('This text should be hidden',
                                                  true));
  text.setAttribute('x', 50);
  text.setAttribute('y', 300);
  svg = getRoot('mySVG');
  svg.appendChild(text);
  text.style.visibility = 'hidden';
  assertEquals('text.style.visibility == hidden', 'hidden',
               text.style.visibility);
  console.log('FIRST IMAGE: You should _not_ see the text '
              + '"This text should be hidden"');
              
  // make some text invisible than visible
  text = getDoc('mySVG').createElementNS(svgns, 'text');
  text.appendChild(getDoc('mySVG').createTextNode('This text should not be '
                                           + 'hidden', true));
  text.setAttribute('x', 50);
  text.setAttribute('y', 320);
  text.style.visibility = 'hidden';
  svg = getRoot('mySVG');
  svg.appendChild(text);
  text.style.visibility = 'visible';
  assertEquals('text.style.visibility == visible', 'visible',
               text.style.visibility);
  // apply display: none to a group with a nested circle and text. Use
  // transform property to move group around, with the circle setting
  // itself using the group's local coordinate system.
  group = getDoc('mySVG').createElementNS(svgns, 'g');
  circle = getDoc('mySVG').createElementNS(svgns, 'circle');
  circle.setAttribute('cx', 0);
  circle.setAttribute('cy', 0);
  circle.setAttribute('r', '30px');
  circle.style.fill = 'rgb(0, 0, 175)';
  group.appendChild(circle);
  text = getDoc('mySVG').createElementNS(svgns, 'text');
  text.style.color = 'red';
  text.appendChild(getDoc('mySVG').createTextNode('Display: none text', true));
  text.setAttribute('x', 50);
  text.setAttribute('y', 50);
  group.appendChild(text);
  group.setAttribute('transform', 'translate(90, 350)');
  svg.appendChild(group);
  // now make the whole group display: none
  svg.lastChild.style.display = 'none';
  console.log('FIRST IMAGE: You should _not_ see the text "Display: none text" '
              + 'with a small circle near it');
  // check values
  assertEquals('group.style.display == none', 'none',
               svg.lastChild.style.display);
  assertEqualsAny('circle.style.fill == rgb(0, 0, 175) '
                  + 'or #0000AF or #0000af',
                  ['rgb(0, 0, 175)', '#0000AF', '#0000af'],
                  svg.lastChild.childNodes[0].style.fill);
  assertEqualsAny('text.style.color == red',
                  ['red'],
                  svg.childNodes[svg.childNodes.length - 1]
                     .childNodes[1].style.color);
  assertEqualsAny('group.getAttribute(transform) == translate(90, 350)',
                  ['translate(90, 350)'],
                  svg.lastChild.getAttribute('transform'));
                  
  // TODO: have a test where we set a group to visibility hidden, but
  // have an element inside it that we explicity set to visibility 
  // visible -- that element should still show, while everything else
  // should hide
  
  // TODO: have tests where the visibility and display properties are
  // set inline in our markup both with style="" properties and XML
  // properties and ensure those elements don't visibly show up
  
  // TODO: test overflow property
  
  // TODO: set a style property with a url() value (both a local ID 
  // anchor such as #foobar as well as an external reference)
  
  // TODO: set style property with different measurement values
  
  // TODO: test stop-color and stop-opacity style properties on a gradient
  
  // TODO: test visibility=hidden and display=none on root SVG element
  
  // try to set or get an unknown property and ensure things are ok
  circle = getDoc('mySVG').createElementNS(svgns, 'circle');
  circle.style.foobar = 'hello world'; // no exception should be thrown

  // in our XML, have an inline style set on an element. Make sure
  // that getting these values returns correct results, then set existing
  // values and then new ones to make sure that works. Test with 
  // uppercase style names, which is allowed by CSS spec -- make sure
  // they go lower case for us.
  circle = getDoc('svg11242').getElementById('strangeStyleCircle');
  // the native SVG renderers don't lower-case the style string; we
  // do for the Flash renderer though to simplify internal processing
  regExp = 'fill:\\s*green;\\s*fill-opacity:\\s*1;'
           + '\\s*background-image:\\s*url\\(FOOBAR\\.SVG\\);'
           + '\\s*stroke:\\s*purple;\\s*stroke-width:\\s*3px;?';
  if (renderer == 'flash') {
    // make sure casing is transformed correctly
    regExp = new RegExp(regExp);
  } else {
    regExp = new RegExp(regExp, 'i');
  }
  assertTrue('strangeStyleCircle.getAttribute(style) == '
            + 'fill: green; fill-opacity:1; '
            + 'background-image: url(FOOBAR.SVG); '
            + 'stroke: purple; stroke-width:3px;',
            regExp.test(circle.getAttribute('style')));
  // make sure values get passed through correctly to .style member
  // NOTE: Firefox's native support doesn't parse style="" string
  // into .style members
  if (!isFF || renderer == 'flash') {
    assertEqualsAny('circle.style.fill == green or #008000',
                    ['green', '#008000'],
                    circle.style.fill);
    assertEqualsAny('circle.style.fillOpacity == 1',
                    [1],
                    circle.style.fillOpacity);
    assertEqualsAny('circle.style.stroke == purple or #800080',
                    ['purple', '#800080'],
                    circle.style.stroke);
    assertEqualsAny('circle.style.strokeWidth == 3px',
                    ['3px'],
                    circle.style.strokeWidth);
  }
  // override some existing styles as well as adding some new ones
  // and make sure they show up
  circle.style.fill = 'purple';
  circle.style.stroke = 'green';
  circle.style.strokeWidth = '8px';
  circle.style.opacity = 0.5;
  assertEqualsAny('circle.style.stroke == green or #008000',
                  ['green', '#008000'],
                  circle.style.stroke);
  assertEqualsAny('circle.style.fill == purple or #800080',
                    ['purple', '#800080'],
                    circle.style.fill);
  assertEqualsAny('circle.style.strokeWidth == 8px',
                    ['8px'],
                    circle.style.strokeWidth);
  assertEqualsAny('circle.style.opacity == 0.5',
                    [0.5],
                    circle.style.opacity);
  // Now check style="" string. It should change the style="" string,
  // as well update the UI with the new values. The different browsers
  // and renderer configurations return the style values in different
  // orders. Order alphabetically to ease testing.
  // NOTE: Sadly, Firefox/Native and Safari/Native have some strange
  // behavior here. Firefox does not display the newly set fill
  // and stroke, and also doesn't update the style="" string. Safari
  // correctly displays the new fill and stroke, but the style="" string
  // now no longer has the stroke and fill in it.
  // TODO: FIXME: Confirm what the correct behavior should be.
  if (renderer == 'flash') {
    // normalize the style string to make testing its value a bit easier
    styleStr = circle.getAttribute('style');
    if (styleStr.charAt(styleStr.length - 1) != ';') {
      styleStr += ';';
    }
    split = circle.getAttribute('style').split(';');
    split = split.slice(0, split.length - 1); // last array entry blank
    for (var i = 0; i < split.length; i++) {
      split[i] = split[i].replace(/^\s?/g, '');
      split[i] = split[i].replace(/:\s?/g, ':');
    }
    split.sort();
    styleStr = split.join(';');
    styleStr += ';';
    // NOTE: Firefox/Native has a bug where the style still has 
    // 3px for stroke-width rather than 8px in the style string
    assertTrue('circle.getAttribute(style) == '
               + 'background-image:url(FOOBAR.SVG);fill-opacity:1;'
               + 'fill:purple;opacity:0.5;stroke-width:(3|8)px;'
               + 'stroke:green;',
               /background\-image:url\((?:FOOBAR.SVG)?\);fill\-opacity:1;fill:(?:purple|\#008000);opacity:0\.5;stroke\-width:(?:3|8)px;stroke:(?:green|\#800080);/i
                    .test(styleStr));
  }
  // TODO: FIXME: Native Firefox renders this as a green circle with a 
  // purple outline, while native Safari renders it as a purpe circle
  // with a green outline! Determine which is correct.
  console.log('THIRD IMAGE: There should be a purple circle with a green '
              + 'outline and partial transparency');
  
  // TODO: manually set style="" string on an element with a preexisting
  // style="" string
  
  // TODO: manually set style="" string on an element without a preexisting
  // style="" string

  // TODO: make sure that setting and getting style rules from root SVG
  // element works.
  
  // TODO: test style.setProperty, style.getPropertyValue, style.length, 
  // style.item(). Add a style and make sure that the length
  // changes, that the item still works, etc. Test these methods as
  // well on an element with no style setting initially.
  
  // TODO: test display, visibility, and overflow properties
  // on root SVG element.
  
  // TODO: test doing the various font style properties on a text element
  
  // TODO: test using the SVG 'filter' property which potentially 
  // conflicts with IE's proprietary 'filter' CSS property
  
  // TODO: null out properties and make sure they change, see if they 
  // change style.length
}

function testCreateSVGObject() {
  // Tests for dynamically creating an SVG OBJECT
  console.log('Testing dynamically creating an SVG OBJECT...');
  
  // test using addEventListener('load')
  div = document.getElementById('test_container');
  obj1 = document.createElement('object', true);
  obj1.setAttribute('id', 'dynamic1');
  obj1.setAttribute('data', '../../samples/svg-files/rectangles.svg');
  obj1.setAttribute('type', 'image/svg+xml');
  obj1.addEventListener('load', function() {
    // now run our tests for this object
    
    // make sure 'this' points to the right thing, as well as ensuring
    // that 'obj' outside the closure still refers to ourselves rather than
    // something that was thrown away internally (i.e. does that OBJECT
    // become our Flash object?)
    // FIXME: This is known not to work; currently the reference to obj1
    // outside the closure will not match 'this' for the Flash handler.
    // Instead, obj1 incorrectly refers to an SVG OBJECT and 'this' correctly 
    // refers to our Flash OBJECT. This is hard to solve, and after 
    // trying to fix tabling for now as a Known Issue.
    //assertEquals('this == SVG OBJECT', obj1, this);
    
    // make sure getting our element by ID works
    obj1 = document.getElementById('dynamic1');
    assertExists('dynamic1 should exist', obj1);
    
    // make sure 'this' points to the right thing
    assertEquals('this == SVG OBJECT', obj1, this);
    assertEquals('this.id == dynamic1', 'dynamic1', this.id);
    
    // indicate that this onload and its tests ran
    svgweb._dynamicObjOnloads++;
  }, false);
  svgweb.appendChild(obj1, div);
  
  // test using onload
  div = document.getElementById('test_container');
  obj2 = document.createElement('object', true);
  obj2.setAttribute('id', 'dynamic2');
  obj2.setAttribute('data', '../../samples/svg-files/rectangles.svg');
  obj2.setAttribute('type', 'image/svg+xml');
  obj2.onload = function() {
    // now run our tests for this object
    
    // make sure getting the element by ID works
    obj2 = document.getElementById('dynamic2');
    assertExists('dynamic2 should exist', obj2);
    
    // make sure 'this' points to the right thing
    assertEquals('this == SVG OBJECT', obj2, this);
    assertEquals('this.id == dynamic2', 'dynamic2', this.id);
    
    // do a test for testRedraw() here
    // modify the contents _inside_ of an object in the middle of a suspendRedraw
    obj2 = document.getElementById('dynamic2');
    assertExists('dynamic2 should exist', obj2);
    svg.suspendRedraw(500);
    rect = obj2.contentDocument.getElementsByTagNameNS(svgns, 'rect')[1];
    assertExists('2nd rectangle should exist', rect);
    rect.setAttribute('fill', 'blue');
    // do it again, but fetch the object while inside of a suspendRedraw
    obj2 = document.getElementById('dynamic2');
    assertExists('dynamic2 should exist', obj2);
    svg.suspendRedraw(500); // nested suspendRedraw
    rect = obj2.contentDocument.getElementsByTagNameNS(svgns, 'rect')[1];
    assertExists('2nd rectangle should exist', rect);
    rect.setAttribute('stroke', 'red');
    svg.unsuspendRedrawAll();
    console.log('FOURTH IMAGE: The rectangle should be blue with a red stroke');
    
    // indicate that this onload and its tests ran
    svgweb._dynamicObjOnloads++;
  };
  svgweb.appendChild(obj2, div);
  
  // test having no ID on the dynamically created OBJECT
  div = document.getElementById('test_container');
  obj3 = document.createElement('object', true);
  obj3.setAttribute('data', '../../samples/svg-files/rectangles.svg');
  obj3.setAttribute('type', 'image/svg+xml');
  obj3.addEventListener('load', function() {
    if (renderer == 'native' || isIE) {
      matches = document.getElementsByTagName('object');
    } else {
      matches = document.getElementsByTagName('embed');
    }
    if ((!isIE && renderer == 'flash') || _hasObjects) {
      obj3 = matches[5];
    } else {
      obj3 = matches[2];
    }
    assertExists('SVG OBJECT should exist', obj3);
    assertExists('SVG OBJECT should have an id', obj3.id);
    assertTrue('SVG OBJECT should have a random id',
               (obj3.id.indexOf('random') != -1));
    
    // make sure 'this' points to the right thing
    assertEquals('this == SVG OBJECT', obj3, this);
    
    // indicate that this onload and its tests ran
    svgweb._dynamicObjOnloads++;
  }, false);
  svgweb.appendChild(obj3, div);
  
  // TODO: dynamically create an SVG OBJECT that has a SCRIPT tag in it,
  // and make sure that it has a Window object of some kind, such as our
  // fake _SVGWindow instance
  
  // TODO: test creating an SVG OBJECT that uses PARAM values to pass values
  // into an SVG file, where these values are used to affect appearance.
  
  // TODO: test removing dynamically added SVG OBJECTs and SVG root tags,
  // both by setting their parents .innerHTML to blank as well as through
  // removeChild. Test removing then reattaching them to the page, as well
  // as testing changing their @data property while unattached.
  
  // TODO: have more tests with CDATA content, including setting it, getting
  // it, working with append/remove DOM operations, etc.
}

function testRedraw() {
  // Tests to make sure the suspendRedraw/unsuspendRedraw system is working
  console.log('Testing suspend/unsuspendRedraw...');
  
  // support common use cases
  
  // create a bunch of elements and add them to the DOM
  svg = getRoot('svg2');
  // create pop1 and pop2 container elements _before_ suspendRedraw
  group = getDoc('svg2').createElementNS(svgns, 'g');
  group.id = 'pop1';
  group.setAttribute('transform', 'scale(0.25) rotate(90) translate(-100, -500)');
  svg.appendChild(group);
  group = getDoc('svg2').createElementNS(svgns, 'g');
  group.id = 'pop2';
  group.setAttribute('transform', 'scale(0.25) rotate(270) translate(-350, -110)');
  svg.appendChild(group);
  // now suspend things
  suspendID1 = svg.suspendRedraw(5000);
  assertExists('suspendID1 should exist', suspendID1);
  for (i = 0; i < 100; i++) {
    rect = document.createElementNS(svgns, 'rect');
    rect.setAttribute('x', 445 - (5 * i));
    rect.setAttribute('y', 0);
    rect.setAttribute('id', 'pop1_' + i);
    rect.setAttribute('width', 5);
    rect.setAttribute('height', 0);
    rect.addEventListener('mouseover', function(evt) { 
      console.log('mouseover for pop1: ' + evt.target.id);
      assertExists('this.id should exist', this.id);
      assertExists('evt.target should exist', evt.target);
      assertEquals('evt.target.id == ' + this.id, this.id, evt.target.id);
    }, false);
    rect.addEventListener('mouseout', function(evt) { 
      console.log('mouseout for pop1: ' + evt.target.id);
      assertExists('this.id should exist', this.id);
      assertExists('evt.target should exist', evt.target);
      assertEquals('evt.target.id == ' + this.id, this.id, evt.target.id);
    }, false);
    getDoc('svg2').getElementById('pop1').appendChild(rect);    
    rect = document.createElementNS(svgns, 'rect');
    rect.setAttributeNS(null, 'x', 0 + (5 * i));
    rect.setAttributeNS(null, 'y', 120);
    rect.setAttributeNS(null, 'id','pop2_' + i);
    rect.setAttributeNS(null, 'width', 5);
    rect.setAttributeNS(null, 'height', 0);
    rect.addEventListener('mouseover', function(evt) { 
      console.log('mouseover for pop2: ' + evt.target.id);
      assertExists('this.id should exist', this.id);
      assertExists('evt.target should exist', evt.target);
      assertEquals('evt.target.id == ' + this.id, this.id, evt.target.id);
    }, false);
    rect.addEventListener('mouseout', function(evt) { 
      console.log('mouseout for pop2: ' + evt.target.id);
      assertExists('this.id should exist', this.id);
      assertExists('evt.target should exist', evt.target);
      assertEquals('evt.target.id == ' + this.id, this.id, evt.target.id);
    }, false);
    getDoc('svg2').getElementById('pop2').appendChild(rect);
  }
  // before unsuspending, loop around trying to set the fill and height
  // and make sure the DOM is still around
  for (i = 0; i < 100; i++)	{
    rect1 = getDoc('svg2').getElementById('pop1_' + i);
    assertExists('pop1_' + i + ' should exist', rect1);
    rect2 = getDoc('svg2').getElementById('pop2_' + i);
    assertExists('pop2_' + i + ' should exist', rect2);
    // make sure the earlier set values are correct
    assertEquals('pop1_' + i + '.getAttribute(y) == 0', 0,
                 rect1.getAttribute('y'));
    assertEquals('pop1_' + i + '.getAttribute(width) == 5', 5,
                 rect1.getAttribute('width', 5));
    // set the new values
    rect1.setAttribute('height', (Math.random() * 700) / 2.8);
    rect2.setAttribute('height', (Math.random() * 700) / 2.8);
    rect1.setAttributeNS(null, 'fill', '#333366');
    rect2.style.fill = '#660066';
    // make sure they stick
    assertEqualsAny('pop1_' + i + '.getAttribute(fill) == #333366',
                    ['#333366'], rect1.getAttribute('fill'));
    assertEqualsAny('pop1_' + i + '.getAttribute(fill) == #333366',
                    ['#333366'], rect1.getAttribute('fill'));
    assertEqualsAny('pop2_' + i + '.style.fill == #660066 or rgb(102, 0, 102)',
                    ['#660066', 'rgb(102, 0, 102)'], rect2.style.fill);
  }
  // now unsuspend things
  svg.unsuspendRedraw(suspendID1);
  // make sure values are correct post-suspend
  for (i = 0; i < 100; i++)	{
    rect1 = getDoc('svg2').getElementById('pop1_' + i);
    assertExists('post suspend: pop1_' + i + ' should exist', rect1);
    rect2 = getDoc('svg2').getElementById('pop2_' + i);
    assertExists('post suspend: pop2_' + i + ' should exist', rect2);
    // make sure the earlier set values are correct
    assertEquals('post suspend: pop1_' + i + '.getAttribute(y) == 0', 0,
                 rect1.getAttribute('y'));
    assertEquals('post suspend: pop1_' + i + '.getAttribute(width) == 5', 5,
                 rect1.getAttribute('width', 5));
    // make sure they stick
    assertEqualsAny('post suspend: pop1_' + i 
                    + '.getAttribute(fill) == #333366',
                    ['#333366'], rect1.getAttribute('fill'));
    assertEqualsAny('post suspend: pop2_' + i 
                    + '.style.fill == #660066 or rgb(102, 0, 102)',
                    ['#660066', 'rgb(102, 0, 102)'], rect2.style.fill);
  }
  // set a value post suspend to make sure it registers
  rect1 = getDoc('svg2').getElementById('pop1_50');
  rect1.style.fill = 'yellow';
  rect1.setAttribute('width', 25);
  rect1.setAttribute('height', 200);
  console.log('SECOND IMAGE: There should be two small groups of multiple '
              + 'horizontal lines of varying lengths near the upper-left, one '
              + 'violet and the other navy blue. There should be a thicker '
              + 'yellow line that was changed post-suspend. Also run your '
              + 'mouse over both sets of lines  and make sure that mouse over '
              + 'and out events fire -- you should see console.log messages '
              + 'print');
  
  // remove elements
  svg = getRoot('svg2');
  suspendID1 = svg.suspendRedraw(5000);
  // dynamically created
  circle = getDoc('svg2').createElementNS(svgns, 'circle');
  circle.setAttribute('cx', 300);
  circle.setAttribute('cy', 300);
  circle.style.fill = 'green';
  circle.id = 'suspendRedraw2';
  circle.setAttribute('r', 100);
  svg.appendChild(circle);
  svg.removeChild(circle);
  // make sure repeated adding and removing works
  svg.appendChild(circle);
  svg.removeChild(circle);
  // already in markup
  circle = getDoc('svg2').getElementById('suspendRedraw1');
  circle.parentNode.removeChild(circle);
  // unsuspend and make sure things are gone
  svg.unsuspendRedraw(suspendID1);
  assertNull('suspendRedraw1 should not exist',
             getDoc('svg2').getElementById('suspendRedraw1'));
  assertNull('suspendRedraw2 should not exist',
             getDoc('svg2').getElementById('suspendRedraw2'));
  // change a value on the detached node and make sure nothing bad happens
  circle.setAttribute('fill', 'red');
  console.log('SECOND IMAGE: There should _not_ be either a green or purple '
              + 'circle');
  
  // change the text value of elements; have two suspendRedraws as well;
  // use unsuspendRedrawAll() to clear them out
  svg = getRoot('svg2');
  suspendID1 = svg.suspendRedraw(300);
  suspendID2 = svg.suspendRedraw(400);
  assertExists('suspendID2 should exist', suspendID2);
  // dynamically created
  text = getDoc('svg2').createElementNS(svgns, 'text');
  text.setAttribute('x', 210);
  text.setAttribute('y', 190);
  text.style.fontSize = '24px';
  text.style.fill = 'red';
  text.appendChild(getDoc('svg2').createTextNode('Made during suspend', true));
  svg.appendChild(text);
  // already in markup
  text = getDoc('svg2').getElementById('suspendRedraw3');
  assertExists('suspendRedraw3 should exist', text);
  text.firstChild.nodeValue = 'Set during suspend1';
  text.lastChild.nodeValue = 'Set during suspend2';
  text.childNodes[0].data = 'Set during suspend3';
  // unsuspend and check values
  svg.unsuspendRedrawAll();
  text = svg.lastChild;
  assertEquals('svg2 lastChild should be TEXT element',
               'text', text.nodeName);
  assertEquals('dynamically created text nodeValue == "Made during suspend"',
               'Made during suspend', text.firstChild.textContent);
  text = getDoc('svg2').getElementById('suspendRedraw3');
  assertEquals('suspendRedraw3.childNodes[last child].data == '
               + '"Set during suspend3"', 'Set during suspend3',
               text.childNodes[text.childNodes.length - 1].data);
  console.log('SECOND IMAGE: You should see the text "Made during suspend" and '
              + '"Set during suspend3"');
  
  // replace another element
  svg = getRoot('svg2');
  suspendID1 = svg.suspendRedraw(200);
  circle = getDoc('svg2').createElementNS(svgns, 'circle');
  circle.setAttribute('cx', 300);
  circle.setAttribute('cy', 300);
  circle.setAttribute('fill', 'brown');
  circle.setAttribute('r', 50);
  svg.appendChild(circle);
  rect = getDoc('svg2').createElementNS(svgns, 'rect');
  rect.setAttribute('x', 300);
  rect.setAttribute('y', 300);
  rect.setAttribute('width', 50);
  rect.setAttribute('height', 50);
  rect.setAttribute('fill', 'yellow');
  svg.appendChild(rect);
  svg.replaceChild(rect, circle);
  svg.unsuspendRedraw(suspendID1);
  // make sure changing the color of the replaced element doesn't do bad
  // things
  circle.setAttribute('fill', 'orange');
  rect.setAttribute('fill', 'blue');
  console.log('SECOND IMAGE: You should see a blue rectangle, and should _not_ '
              + 'see a brown or orange circle');
  
  // fetch the value of some elements that are in the markup
  svg = getRoot('svg2');
  suspendID1 = svg.suspendRedraw(200);
  rect = getDoc('svg2').getElementById('rect5690');
  assertExists('rect5690 should exist during suspendRedraw', rect);
  assertEqualsAny('rect5690.width == 568.43536', 
                  ['568.43536'], rect.getAttribute('width'));
  svg.unsuspendRedrawAll();
  
  // commented out until Issue 207 is addressed:
  // http://code.google.com/p/svgweb/issues/detail?id=207
  /*
  // do transforms on an image while in a suspendRedraw
  svg = getRoot('svg11242');
  suspendID1 = svg.suspendRedraw(500);
  image = getDoc('svg11242').createElementNS(svgns, 'image');
  image.setAttributeNS(xlinkns, 'xlink:href', 'balloon.jpg');
  image.setAttribute('x', 0);
  image.setAttribute('y', 0);
  image.setAttribute('width', '100px');
  image.setAttribute('height', '100px');
  image.style.opacity = 0.8;
  svg.appendChild(image);
  image.setAttribute('transform', 'translate(450, 100) rotate(90)');
  svg.unsuspendRedraw(suspendID1);
  console.log('SECOND IMAGE: You should see an image of balloons rotated 90 '
              + 'degrees near the end of the sword');*/
  
  // do getElementsByTagNameNS inside suspendRedraw
  svg = getRoot('svg11242');
  suspendID1 = svg.suspendRedraw(500);
  images = getDoc('svg11242').getElementsByTagNameNS(svgns, 'image');
  assertEquals('There should be 2 images in svg11242', 2, images.length);
  assertEquals('images[0].nodeName == image', 'image', images[0].nodeName);
  assertEquals('images[1].nodeName == image', 'image', images[1].nodeName);
  svg.unsuspendRedraw(suspendID1);
  
  // call forceRedraw while things are suspended
  svg = getRoot('svg2');
  svg.suspendRedraw(1000 * 10); // 10 seconds
  text = getDoc('svg2').createElementNS(svgns, 'text');
  text.setAttribute('x', 200);
  text.setAttribute('y', 100);
  text.style.fontSize = '18px';
  text.style.fill = 'red';
  text.appendChild(getDoc('svg2').createTextNode('forceRedraw', 
                   true));
  svg.appendChild(text);
  svg.forceRedraw();
  console.log('SECOND IMAGE: You should see the text "forceRedraw"');
  svg.unsuspendRedrawAll();
  
  // modify the contents _inside_ of an object in the middle of a suspendRedraw
  // NOTE: this test is inside of the onload handler for dynamic2 above inside
  // of testCreateSVGObject()
  
  // commented out until Issue 145 is addressed:
  // http://code.google.com/p/svgweb/issues/detail?id=145
  /*
  // create SMIL elements _inside_ of a suspendRedraw
  // NOTE: Safari has a known bug where it won't animate this:
  // Bug 20028 - https://bugs.webkit.org/show_bug.cgi?id=20028 
  svg = getRoot('svg2');
  svg.suspendRedraw(500);
  rect = getDoc('svg2').createElementNS(svgns, 'rect');
  rect.setAttribute('x', 300);
  rect.setAttribute('y', 300);
  rect.setAttribute('width', 50);
  rect.setAttribute('height', 50);
  rect.setAttribute('fill', '#0f5');
  rect.setAttribute('stroke', '#085');
  rect.setAttribute('stroke-width', '4');
  anim = getDoc('svg2').createElementNS(svgns, 'animate');
  anim.setAttribute('attributeName', 'x');
  anim.setAttribute('calcMode', 'linear');
  anim.setAttribute('additive', 'replace');
  anim.setAttribute('accumulate', 'none');
  anim.setAttribute('from', 300);
  anim.setAttribute('to', 220);
  anim.setAttribute('begin', '2s; 5s');
  anim.setAttribute('dur', '2s');
  anim.setAttribute('fill', 'remove');
  rect.appendChild(anim);
  svg.appendChild(rect);
  svg.unsuspendRedrawAll();
  console.log('SECOND IMAGE: You should see a green rectangle animating');
  
  // create another SMIL element that is activated by a mouse click
  svg = getRoot('svg2');
  svg.suspendRedraw(500);
  rect = getDoc('svg2').createElementNS(svgns, 'rect');
  rect.setAttribute('x', 200);
  rect.setAttribute('y', 300);
  rect.setAttribute('width', 20);
  rect.setAttribute('height', 20);
  rect.setAttribute('fill', 'red');
  rect.setAttribute('stroke', '#085');
  rect.setAttribute('stroke-width', '4');
  rect.id = 'animateMe';
  anim = getDoc('svg2').createElementNS(svgns, 'animate');
  anim.setAttribute('attributeName', 'x');
  anim.setAttribute('calcMode', 'linear');
  anim.setAttribute('additive', 'replace');
  anim.setAttribute('accumulate', 'none');
  anim.setAttribute('from', 200);
  anim.setAttribute('to', 100);
  anim.setAttribute('begin', 'animateMe.click');
  anim.setAttribute('dur', '10s');
  anim.setAttribute('fill', 'freeze');
  rect.appendChild(anim);
  svg.appendChild(rect);
  svg.unsuspendRedrawAll();
  console.log('SECOND IMAGE: Click on the red rectangle to start it '
              + 'animating');*/
}

function testBugFixes() {
  // Test assertions for bug fixes
  console.log('Testing bug fixes...');

  // make sure that getElementsByTagNameNS works correctly
  // after an insertBefore, after a removeChild, and after a replaceChild
  svg = getRoot('svg2');
  metadata = getDoc('svg2').getElementById('metadata7');
  // testing removeChild + getElementsByTagNameNS
  svg.removeChild(metadata);
  matches = getDoc('svg2').getElementsByTagNameNS(rdf_ns, 'RDF');
  assertEquals('rdf matches.length == 0', 0, matches.length);
  // testing replaceChild + getElementsByTagNameNS
  group = getDoc('svg2').createElementNS(svgns, 'g');
  svg.appendChild(group);
  svg.replaceChild(metadata, group);
  matches = getDoc('svg2').getElementsByTagNameNS(rdf_ns, 'RDF');
  assertEquals('rdf matches.length == 1', 1, matches.length);
  svg.removeChild(metadata);
  matches = getDoc('svg2').getElementsByTagNameNS(rdf_ns, 'RDF');
  assertEquals('rdf matches.length == 0', 0, matches.length);
  // testing insertBefore + getElementsByTagNameNS
  group = getDoc('svg2').createElementNS(svgns, 'g');
  svg.appendChild(group);
  svg.insertBefore(metadata, group);
  matches = getDoc('svg2').getElementsByTagNameNS(rdf_ns, 'RDF');
  assertEquals('rdf matches.length == 1', 1, matches.length);
  svg.removeChild(metadata);
  
  // test fixes for Issue 178: Element.style.* access doesn't work for 
  // Firefox Native under some conditions:
  // http://code.google.com/p/svgweb/issues/detail?id=178
  
  // make sure svgElement.style.* access works for elements that are in the
  // page's markup itself
  rect1 = getDoc('svg11242').getElementById('testStyleRect');
  assertExists('testStyleRect in svg2 should exist', rect1);
  assertEqualsAny('rect1.style.fill == #ffffff or #FFFFFF '
                  + 'or rgb(255, 255, 255)', 
                  ['#ffffff', '#FFFFFF', 'rgb(255, 255, 255)'], 
                  rect1.style.fill);
  rect1.style.fill = 'green';
  assertEqualsAny('rect1.style.fill == green or #008000', 
                  ['green', '#008000'], rect1.style.fill);
  console.log('THIRD IMAGE: There should be a rotated green rectangle near the '
              + 'bottom of the image');
  
  // grab a normal HTML element from the page; make sure that 
  // htmlElement.style.foo still works after our patching
  elem = document.getElementById('testHTMLH1');
  assertExists('testHTMLH1 should exist', elem);
  // IE gives the border dimensions in a different order
  assertEqualsAny('testHTMLH1.style.border == '
                  + '"3px solid black" or "black 3px solid"',
                  ['3px solid black', 'black 3px solid'], elem.style.border);
  elem.style.border = '2px dashed purple';
  assertEqualsAny('testHTMLH1.style.border == '
                  + '"3px solid black" or "purple 2px dashed"',
                  ['2px dashed purple', 'purple 2px dashed'], elem.style.border);
  console.log('HTML: There should be a purple dashed box around the HTML '
              + 'H1 element that says "Test HTML H1"');
              
  // on an HTML element, try to do an SVG style property that should not be 
  // settable, such as htmlElement.style.stroke. Make sure that nothing happens 
  // and an error doesn't happen
  elem = document.getElementById('testHTMLH1');
  assertEqualsAny('testHTMLH1.style.fill == "" or undefined', ["", undefined], 
                  elem.style.fill);
  elem.style.fill = 'red';
  // Safari natively stores the value, even though its an unknown CSS property;
  // just make sure we are mimicing Safaris behavior on this one; when using
  // the Flash renderer we allow this to also just be undefined as well
  assertEqualsAny('testHTMLH1.style.fill == red or #FF0000 '
                  + 'or rgb(255, 0, 0) or undefined', 
                  ['red', '#FF0000', 'rgb(255, 0, 0)', undefined], 
                  elem.style.fill);
                  
  // a test where we try to set an HTML style property, such as
  // style.backgroundColor, on an _SVG_ element. Make sure nothing happens and that an
  //error is not thrown
  rect1 = getDoc('svg11242').getElementById('testStyleRect');
  rect1.style.backgroundColor = 'purple';
  rect1.style.fontSize = '12pt';

  // end of tests for Issue 178
  
  // TODO: Have entities in my SVG source (i.e. &amp;). Also have entities
  // in <text> node values, and fetch them from Flash to ensure that they
  // don't get munged
  
  // TODO: Have nested SVG elements in an document, and get them by ID
  // and by tag name and make sure they show up correctly in DOM (gaussian2.svg
  // for example)
}

function testUnload() {
  // manually call unload listener to make sure no exceptions fire;
  // on browsers other than Internet Explorer this is a no-op
  // TODO: commenting out right now because it deletes the SVG rendering
  // on the screen. Uncomment when we have other tests that do bitmap
  // testing or visual tests, and we don't need the tests in this file
  // to be visually inspected.
  /*
  console.log('Testing window.unload listener...');
  if (svgweb.getHandlerType() == 'flash') {
    // TODO: Iterate over each OBJECT and make sure it's document overrides
    // are removed for IE
    exp = null;
    // save document.getElementById and createTextNode so we can use it 
    // for displaying our results with console.log; our unload listener 
    // will clear these out to prevent memory leaks!
    var getElementById, createTextNode;
    if (document._getElementById) { // IE
      getElementById = document._getElementById;
      createTextNode = document._createTextNode;
    } else { // non-IE browsers
      getElementById = document.getElementById;
      createTextNode = document.createTextNode;
    }
  
    try {
      svgweb._fireUnload();
    } catch (e) {
      exp = e;
    }
    document.getElementById = getElementById;
    document.createTextNode = createTextNode;
    getElementById = null; // memory leaks
    createTextNode = null;
    if (exp) {
      console.log(exp.message);
    }
    assertNull('Window.unload should run without an exception', exp);
  }*/
}