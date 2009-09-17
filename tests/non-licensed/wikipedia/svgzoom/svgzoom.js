(function(){ // hide everything externally to avoid name collisions

// whether to display debugging output
var svgDebug = true;

// whether we are locally debugging (i.e. the page is downloaded to our
// hard drive and served from a local server to ease development)
var localDebug = true;

// the full URL to where svg.js is located
var svgSrcURL;
if (localDebug) {
  svgSrcURL = 'http://brad.com:8080/src/svg.js';
} else {
  svgSrcURL = 'http://codinginparadise.org/projects/svgweb-staging/src/svg.js';
}

// whether the pan and zoom UI is initialized
var svgUIReady = false;

// a reference to the SVG OBJECT on the page
var svgObject;

// a reference to our zoom and pan controls
var svgControls;

// a reference to our SVG root tag
var svgRoot;

// the URL to the proxy from which we can fetch SVG images within the same
// domain as this page is served from
// TODO: define

// the location of our images
var imageBundle;
if (localDebug) {
  // for local debugging
  imageBundle = {
    'searchtool': 'http://brad.com:8080/tests/non-licensed/wikipedia/svgzoom/svgzoom-images/searchtool.png',
    'controls-north-mini': 'http://brad.com:8080/tests/non-licensed/wikipedia/svgzoom/svgzoom-images/north-mini.png',
    'controls-west-mini': 'http://brad.com:8080/tests/non-licensed/wikipedia/svgzoom/svgzoom-images/west-mini.png',
    'controls-east-mini': 'http://brad.com:8080/tests/non-licensed/wikipedia/svgzoom/svgzoom-images/east-mini.png',
    'controls-south-mini': 'http://brad.com:8080/tests/non-licensed/wikipedia/svgzoom/svgzoom-images/south-mini.png',
    'controls-zoom-plus-mini': 'http://brad.com:8080/tests/non-licensed/wikipedia/svgzoom/svgzoom-images/zoom-plus-mini.png',
    'controls-zoom-world-mini': 'http://brad.com:8080/tests/non-licensed/wikipedia/svgzoom/svgzoom-images/zoom-world-mini.png',
    'controls-zoom-minus-mini': 'http://brad.com:8080/tests/non-licensed/wikipedia/svgzoom/svgzoom-images/zoom-minus-mini.png'
  };
} else {
  imageBundle = {
    'searchtool': 'http://codinginparadise.org/projects/svgzoom/svgzoom-images/searchtool.png',
    'controls-north-mini': 'http://codinginparadise.org/projects/svgzoom/svgzoom-images/controls-north-mini.png',
    'controls-west-mini': 'http://codinginparadise.org/projects/svgzoom/svgzoom-images/controls-west-mini.png',
    'controls-east-mini': 'http://codinginparadise.org/projects/svgzoom/svgzoom-images/controls-east-mini.png',
    'controls-south-mini': 'http://codinginparadise.org/projects/svgzoom/svgzoom-images/controls-south-mini.png',
    'controls-zoom-plus-mini': 'http://codinginparadise.org/projects/svgzoom/svgzoom-images/controls-zoom-plus-mini.png',
    'controls-zoom-world-mini': 'http://codinginparadise.org/projects/svgzoom/svgzoom-images/controls-zoom-world-mini.png',
    'controls-minus-mini': 'http://codinginparadise.org/projects/svgzoom/svgzoom-images/controls-minus-mini.png'
  };
}

// determines if we are at a Wikimedia Commons detail page for an SVG file?
function isSVGPage() {
  if (wgNamespaceNumber == 6 && wgTitle && wgTitle.indexOf('.svg') != -1
      && wgAction == 'view') {
    return true;
  } else {
    return false;
  }
}

// inserts the SVG Web library for IE into the page
function insertSVGWeb() {
   document.write('<script type="text/javascript" '
                  + 'src="' + svgSrcURL + '" '
                  + 'data-path="../../../../src" ' /* Note: remove before production */
                  + 'data-debug="' + svgDebug + '"></script>');
}

// adds a button that when pressed turns on the zoom and pan UI
function addStartButton() {
   // are we already present? user could have hit back button on an old loaded page
   if (document.getElementById('SVGZoom.startButton')) {
     return;
   }

   // insert ourselves beside the SVG thumbnail area
   var info = getSVGInfo();
   var thumbnail = info.fileNode.childNodes[0].childNodes[0];
   // make the container element we will go into a bit larger to accommodate the icon
   var infoWidth = Number(String(info.width).replace('px', ''));
   thumbnail.style.width = (infoWidth + 30) + 'px';
   var img = document.createElement('img');
   img.id = 'SVGZoom.startButton';
   img.src = imageBundle['searchtool'];
   img.setAttribute('width', '30px');
   img.setAttribute('height', '30px');
   img.style.position = 'absolute';
   img.style.cursor = 'pointer';
   img.onclick = initUI;
   thumbnail.appendChild(img);
}

// adds the pan and zoom UI and turns the PNG into an SVG object
function initUI() {
  console.log('initUI');
  if (svgUIReady) { // already initialized
    return;
  }
  
  svgUIReady = true;
  
  // remove magnifying glass icon
  var startButton = document.getElementById('SVGZoom.startButton');
  startButton.parentNode.removeChild(startButton);
  
  // get the thumbnail container and make it invisible
  var info = getSVGInfo();
  var thumbnail = info.fileNode.childNodes[0].childNodes[0];
  var oldPNG = thumbnail.childNodes[0];
  oldPNG.style.visibility = 'hidden';
  oldPNG.style.zIndex = -1000;
  
  // reveal the SVG object and controls
  svgObject.parentNode.style.zIndex = 1000;
  svgControls.style.display = 'block';
  
  // store a reference to the SVG root to make subsequent accesses faster
  svgRoot = svgObject.contentDocument.rootElement;
  
  // make the cursor a hand when over the SVG
  svgRoot.setAttribute('cursor', 'pointer');
  // TODO: Get hand cursor showing up in Flash
  
  // add drag listeners on the SVG root
  svgRoot.addEventListener('mousedown', mouseDown, false);
  svgRoot.addEventListener('mousemove', mouseMove, false);
  svgRoot.addEventListener('mouseup', mouseUp, false);
}

// Creates the SVG OBJECT during page load so that when we swap the PNG
// thumbnail and the SVG OBJECT it happens much faster
function createSVGObject() {
  var info = getSVGInfo();
  var thumbnail = info.fileNode.childNodes[0].childNodes[0];
  
  // create the SVG OBJECT that will replace our thumbnail container
  var obj = document.createElement('object', true);
  obj.setAttribute('type', 'image/svg+xml');
  obj.setAttribute('data', info.url);
  obj.setAttribute('width', info.width);
  obj.setAttribute('height', info.height);
  obj.addEventListener('load', function() {
    // store a reference to the SVG OBJECT
    svgObject = this;
    
    // add our magnification icon
    addStartButton();
    
    // create the controls
    svgControls = createControls();
    svgControls.style.display = 'none';
    
    // now place the controls on top of the SVG object
    thumbnail.appendChild(svgControls);
    
    // prevent IE memory leaks
    thumbnail = obj = null;
  }, false);
  // position object behind the PNG image; do it in a DIV to avoid any
  // strange style + OBJECT interactions
  var container = document.createElement('div');
  container.style.zIndex = -1000;
  container.style.position = 'absolute';
  container.style.top = '0px';
  container.style.left = '0px';
  thumbnail.appendChild(container);
  svgweb.appendChild(obj, container);
}

// Returns a DIV ready to append to the page with our zoom and pan controls
function createControls() {
  var controls = document.createElement('div');
  controls.id = 'SVGZoom.controls';
  controls.innerHTML = 
    '<div style="position: absolute; left: 4px; top: 4px; z-index: 1004;" unselectable="on">'
    + '<div id="SVGZoom.panup" style="position: absolute; left: 13px; top: 4px; width: 18px; height: 18px;">'
    + '  <img id="SVGZoom.panup.innerImage" style="position: relative; width: 18px; height: 18px;" '
          + 'src="' + imageBundle['controls-north-mini'] + '"/>'
    + '</div>'
    + '<div id="SVGZoom.panleft" style="position: absolute; left: 4px; top: 22px; width: 18px; height: 18px;">'
    + '  <img id="SVGZoom.panleft.innerImage" style="position: relative; width: 18px; height: 18px;" '
          + 'src="' + imageBundle['controls-west-mini'] + '"/>'
    + '</div>'
    + '<div id="SVGZoom.panright" style="position: absolute; left: 22px; top: 22px; width: 18px; height: 18px;">'
    + '  <img id="SVGZoom.panright.innerImage" style="position: relative; width: 18px; height: 18px;" '
          + 'src="' + imageBundle['controls-east-mini'] + '"/>'
    + '</div>'
    + '<div id="SVGZoom.pandown" style="position: absolute; left: 13px; top: 40px; width: 18px; height: 18px;">'
    + '  <img id="SVGZoom.pandown.innerImage" style="position: relative; width: 18px; height: 18px;" '
          + 'src="' + imageBundle['controls-south-mini'] + '"/>'
    + '</div>'
    + '<div id="SVGZoom.zoomin" style="position: absolute; left: 13px; top: 63px; width: 18px; height: 18px;">'
    + '  <img id="SVGZoom.zoomin.innerImage" style="position: relative; width: 18px; height: 18px;" '
          + 'src="' + imageBundle['controls-zoom-plus-mini'] + '"/>'
    + '</div>'
    + '<div id="SVGZoom.zoomworld" style="position: absolute; left: 13px; top: 81px; width: 18px; height: 18px;">'
    + '  <img id="SVGZoom.zoomworld.innerImage" style="position: relative; width: 18px; height: 18px;" '
          + 'src="' + imageBundle['controls-zoom-world-mini'] + '"/>'
    + '</div>'
    + '<div id="SVGZoom.zoomout" style="position: absolute; left: 13px; top: 99px; width: 18px; height: 18px;">'
    + '  <img id="SVGZoom.zoomout.innerImage" style="position: relative; width: 18px; height: 18px;" '
          + 'src="' + imageBundle['controls-zoom-minus-mini'] + '"/>'
    + '</div>'
    + '</div>';
    
  // attach event handlers
  controls.childNodes[0].childNodes[0].onclick = panUp;
  controls.childNodes[0].childNodes[1].onclick = panLeft;
  controls.childNodes[0].childNodes[2].onclick = panRight;
  controls.childNodes[0].childNodes[3].onclick = panDown;
  controls.childNodes[0].childNodes[4].onclick = zoomIn;
  controls.childNodes[0].childNodes[5].onclick = zoomWorld;
  controls.childNodes[0].childNodes[6].onclick = zoomOut;
  
  return controls;
}

function panUp() {
  modifyViewBox(function(vb) {
    vb[1] = parseFloat(vb[1]) + 25.0;
  });
}

function panLeft() {
  modifyViewBox(function(vb) {
    vb[0] = parseFloat(vb[0]) + 25.0;
  });
}

function panRight() {
  modifyViewBox(function(vb) {
    vb[0] = parseFloat(vb[0]) - 25.0;
  });
}

function panDown() {
  modifyViewBox(function(vb) {
    vb[1] = parseFloat(vb[1]) - 25.0;
  });
}

function zoomIn() {
  modifyViewBox(function(vb) {
    vb[2] = parseFloat(vb[2]) / 1.1;
    vb[3]=parseFloat(vb[3]) / 1.1;
  });
}

function zoomWorld() {
  // TODO: Implement
}

function zoomOut() {
  modifyViewBox(function(vb) {
    vb[2] = parseFloat(vb[2]) * 1.1;
    vb[3] = parseFloat(vb[3]) * 1.1;
  });
}

function modifyViewBox(modFunc) {
    var viewBox = svgObject.contentDocument.documentElement.getAttribute('viewBox');
    if (typeof(viewBox) != 'string' 
        || !viewBox.match(/\s*\S+\s*\S+\s*\S+\s*\S+\s*/)) {
        var width = svgObject.getAttribute('width');
        var height = svgObject.getAttribute('height');
        viewBox = '0 0 ' + Math.round(width) + ' ' + Math.round(height);
    }
    
    viewBox = viewBox.replace(/^\s+/, '');
    var vbvals = viewBox.split(/\s+/);
    modFunc(vbvals);
    viewBox = Math.round(vbvals[0]) + ' ' + Math.round(vbvals[1]) + ' ' + 
              Math.round(vbvals[2]) + ' ' + Math.round(vbvals[3]);
    svgObject.contentDocument.rootElement.setAttribute('viewBox', viewBox);
}

// variables used for dragging
var mouseOffsetX = 0;
var mouseOffsetY = 0;
var dragX = 0;
var dragY = 0;
var inverseRootCTM;
var dragging = false; 
 
function mouseDown(evt) {
  dragging = true;
  
  var p = svgRoot.createSVGPoint();
  p.x = evt.clientX;
  p.y = evt.clientY;
     
  var rootCTM = svgRoot.getScreenCTM();
  inverseRootCTM = rootCTM.inverse();

  p = p.matrixTransform(inverseRootCTM);
         
  mouseOffsetX = p.x - dragX;
  mouseOffsetY = p.y - dragY;
}

function mouseMove(evt) {
  if (!dragging) {
     return;
  }
  
  var p = svgRoot.createSVGPoint();
  p.x = evt.clientX;
  p.y = evt.clientY;

  p = p.matrixTransform(inverseRootCTM);
  p.x -= mouseOffsetX;
  p.y -= mouseOffsetY;

  dragX = p.x;
  dragY = p.y;

  modifyViewBox(function(vb) {
    vb[0] = -p.x;
    vb[1] = -p.y;
    
    root = null; // prevent IE memory leaks
  }); 
}

function mouseUp(evt) { 
  mouseOffsetX = 0;
  mouseOffsetY = 0;
  dragging = false;
}

// Returns a data structure that has info about the SVG file on this page, including:
// url - filename and URL necessary to fetch the SVG file
// width and height - the width and height to make the SVG file
// fileNode - the DOM node that has the top level PNG thumbnail in it to replace
// imgNode - the actual IMG tag that has the PNG thumbnail inside of it
// Note that this method returns null if there is no file node on the page.
function getSVGInfo() {
  var fileNode = document.getElementById('file');
  if (!fileNode) {
    return null;
  }
  
  var url = fileNode.childNodes[0].childNodes[0].childNodes[0].href;
  var imgNode = fileNode.getElementsByTagName('img')[0];
  var width = imgNode.getAttribute('width');
  var height = imgNode.getAttribute('height');

  return { url: url, fileNode: fileNode, imgNode: imgNode, 
           width: width, height: height };
}
  

// called when the page is loaded and ready to be manipulated
function pageLoaded() {
  // the Image Annotation Gadget needs to load before us, since it modifies the
  // DOM in a similar location
  var intervalID = window.setInterval(
    function() {
      if (document.getElementById('ImageAnnotationAddButton')) {
        window.clearInterval(intervalID);
        createSVGObject();
      }
    }, 50);
}

if (isSVGPage()) {
  insertSVGWeb();
  addOnloadHook(pageLoaded);
}

// hide internal implementation details inside of a closure
})();
