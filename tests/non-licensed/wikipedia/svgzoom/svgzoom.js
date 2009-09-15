// the full URL to where svg.js is located
//var svgSrcURL = 'http://codinginparadise.org/projects/svgweb-staging/src/svg.js';
// for debugging
var svgSrcURL = 'http://brad.com:8080/src/svg.js';

// whether to display debugging output
var svgDebug = true;

// location of magnifying glass icon; based on
// http://commons.wikimedia.org/wiki/File:Gnome-searchtool.svg
var glassURL = 'http://codinginparadise.org/projects/svgzoom/images/searchtool.png';

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
   if (document.getElementById('ZoomStartButton')) {
     return;
   }

   // insert ourselves beside the SVG thumbnail area
   var info = getSVGInfo();
   var thumbnail = info.fileNode.childNodes[0].childNodes[0];
   // make the container element we will go into a bit larger to accommodate the icon
   thumbnail.style.width = (Number(info.width.replace('px', '')) + 30) + 'px';
   var img = document.createElement('img');
   img.id = 'ZoomStartButton';
   img.src = glassURL;
   img.setAttribute('width', '30px');
   img.setAttribute('height', '30px');
   img.style.position = 'relative';
   thumbnail.appendChild(img);
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
  //insertSVGWeb();
  //addOnloadHook(pageLoaded);
}
