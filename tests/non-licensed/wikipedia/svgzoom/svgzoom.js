// whether to display debugging output
var svgDebug = true;

// the full URL to where svg.js is located
//var svgSrcURL = 'http://codinginparadise.org/projects/svgweb-staging/src/svg.js';
// for debugging
var svgSrcURL = 'http://brad.com:8080/src/svg.js';

// whether the pan and zoom UI is initialized
var svgUIReady = false;

// the location of our images
/*var imageBundle = {
  'searchtool': 'http://codinginparadise.org/projects/svgzoom/svgzoom-images/searchtool.png',
  'controls-north-mini': 'http://codinginparadise.org/projects/svgzoom/svgzoom-images/controls-north-mini.png',
  'controls-west-mini': 'http://codinginparadise.org/projects/svgzoom/svgzoom-images/controls-west-mini.png',
  'controls-east-mini': 'http://codinginparadise.org/projects/svgzoom/svgzoom-images/controls-east-mini.png',
  'controls-south-mini': 'http://codinginparadise.org/projects/svgzoom/svgzoom-images/controls-south-mini.png',
  'controls-zoom-plus-mini': 'http://codinginparadise.org/projects/svgzoom/svgzoom-images/controls-zoom-plus-mini.png',
  'controls-zoom-world-mini': 'http://codinginparadise.org/projects/svgzoom/svgzoom-images/controls-zoom-world-mini.png',
  'controls-minus-mini': 'http://codinginparadise.org/projects/svgzoom/svgzoom-images/controls-minus-mini.png'
};*/
// for debugging
var imageBundle = {
  'searchtool': 'http://brad.com:8080/tests/non-licensed/wikipedia/svgzoom/svgzoom-images/searchtool.png',
  'controls-north-mini': 'http://brad.com:8080/tests/non-licensed/wikipedia/svgzoom/svgzoom-images/north-mini.png',
  'controls-west-mini': 'http://brad.com:8080/tests/non-licensed/wikipedia/svgzoom/svgzoom-images/west-mini.png',
  'controls-east-mini': 'http://brad.com:8080/tests/non-licensed/wikipedia/svgzoom/svgzoom-images/east-mini.png',
  'controls-south-mini': 'http://brad.com:8080/tests/non-licensed/wikipedia/svgzoom/svgzoom-images/south-mini.png',
  'controls-zoom-plus-mini': 'http://brad.com:8080/tests/non-licensed/wikipedia/svgzoom/svgzoom-images/zoom-plus-mini.png',
  'controls-zoom-world-mini': 'http://brad.com:8080/tests/non-licensed/wikipedia/svgzoom/svgzoom-images/zoom-world-mini.png',
  'controls-zoom-minus-mini': 'http://brad.com:8080/tests/non-licensed/wikipedia/svgzoom/svgzoom-images/zoom-minus-mini.png'
};

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
                  + 'src="' + svgSrcURL + '"'
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
   thumbnail.style.width = (Number(info.width.replace('px', '')) + 30) + 'px';
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
  
  // make the container element slightly smaller again now that the
  // magnifying glass icon is gone
  var info = getSVGInfo();
  var thumbnail = info.fileNode.childNodes[0].childNodes[0];
  thumbnail.style.width = (Number(info.width.replace('px', '')) - 30) + 'px';
  
  // create the controls
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
    
    // now place the controls on top of the SVG object
    thumbnail.appendChild(controls);
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
  var imgNode = fileNode.getElementsByTagName('img')[0];
  var width = imgNode.getAttribute('width');
  var height = imgNode.getAttribute('height');

  return { fileNode: fileNode, imgNode: imgNode, width: width, height: height };
}
  

// called when the page is loaded and ready to be manipulated
function pageLoaded() {
  // the Image Annotation Gadget needs to load before us, since it modifies the
  // DOM in a similar location
  var intervalID = window.setInterval(
    function() {
      if (document.getElementById('ImageAnnotationAddButton')) {
        window.clearInterval(intervalID);
        addStartButton();
      }
    }, 50);
}

if (isSVGPage()) {
  insertSVGWeb();
  addOnloadHook(pageLoaded);
}
