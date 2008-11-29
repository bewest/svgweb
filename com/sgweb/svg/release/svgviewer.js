
var svgviewer = {}


svgviewer.suppressLog= ((typeof(console)=="undefined") || (typeof(console.info) == "undefined"));

svgviewer.info = function(logString) {
    if (svgviewer.suppressLog) {
        return;
    }
    console.info(logString);
}


svgviewer.getFlashMovieObject = function(movieName)
{
  if (window.document[movieName]) 
  {
    if(document[movieName].length != undefined){
        return document[movieName][1];
    }
    return document[movieName];
  }
  if (navigator.appName.indexOf("Microsoft Internet")==-1)
  {
    if (document.embeds && document.embeds[movieName])
      return document.embeds[movieName]; 
  }
  else // if (navigator.appName.indexOf("Microsoft Internet")!=-1)
  {
    return document.getElementById(movieName);
  }
}

svgviewer.svgParamsDict = {}


svgviewer.createSVGFlashObject = function ( params ) {
    var bgcolor = '';
    
    if (typeof(params.uniqueId) == "undefined") {
        return;
    }
    if (typeof(params.parentDivId) == "undefined") {
        return;
    }
    if (typeof(params.scaleX) == "undefined") {
        params.scaleX=1.0;
    }
    if (typeof(params.scaleY) == "undefined") {
        params.scaleY=1.0;
    }
    if (typeof(params.translateX) == "undefined") {
        params.translateX=0;
    }
    if (typeof(params.translateY) == "undefined") {
        params.translateY=0;
    }
    if (typeof(params.bgcolor) != "undefined") {
        bgcolor = 'bgcolor=' + params.bgcolor;
    }
    if (typeof(params.debug) == "undefined") {
        params.debug = false;
    }
    params.objectId = params.parentDivId + 'Obj';

    // Record the object parameters
    svgviewer.svgParamsDict[params.uniqueId] = params;


    var oldAspectRes = 2048.0 / 1024.0;
    var newAspectRes = params.objectWidth / params.objectHeight;
    var cropWidth;
    var cropHeight;
    if (newAspectRes > oldAspectRes) {
       cropWidth = params.objectHeight * oldAspectRes;
       cropHeight = params.objectHeight;
    }
    else {
       cropWidth = params.objectWidth;
       cropHeight = params.objectWidth / oldAspectRes;
    }

    var borderX = params.objectWidth - cropWidth;
    var borderY = params.objectHeight - cropHeight;
    var translateX =  (-(borderX / 2.0) + params.translateX);
    var translateY =  (-(borderY / 2.0) + params.translateY);
    translateX = translateX * 2048 / cropWidth;
    translateY = translateY * 2048 / cropWidth;

    var node = document.getElementById(params.parentDivId);
    if (node) {
        var flashVars = 
            '"' +
            'uniqueId=' + params.uniqueId +
            '&translateX=' + translateX + 
            '&translateY=' + translateY + 
            '&scaleX=' + ((2048.0 / cropWidth)*params.scaleX) +
            '&scaleY=' + ((1024.0 / cropHeight)*params.scaleY) +
            '&sourceType=' + params.sourceType +
            '&svgURL=' + params.svgURL +
            '&debug=' + params.debug;
        if (typeof(params.svgId) != "undefined") {
            flashVars = flashVars  + '&svgId=' + params.svgId;
        }
        flashVars = flashVars  + '"';
        //SVGLog.info(flashVars);
        node.innerHTML = 
            '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" ' +
            '        codebase="" id="' + params.objectId + '" ' + 
            '        width=' + params.objectWidth + ' height=' + params.objectHeight + ' style="float: left"> ' +
            '    <param name=AllowScriptAccess value="always"/> ' +
            '    <param name=movie value="svgviewer.swf"> ' +
            '    <param name=FlashVars value=' + flashVars + '> ' +
            '    <param name="wmode" value="transparent"> ' +
            '    <embed  name="' + params.objectId + '" play=false ' +
            '            swliveconnect="true" AllowScriptAccess="always" ' +
            '            src="svgviewer.swf" quality=high ' + bgcolor + 
            '            width=' + params.objectWidth + ' height=' + params.objectHeight +
            '            type="application/x-shockwave-flash" ' +
            '            FlashVars=' + flashVars + '> ' +
            '    </embed> ' +
            '</object> ';

    }
}

function receiveFromFlash(flashMsg) {
    if (flashMsg.type == 'event') {
        // The flash control actionscript calls this on startup.
        // We use this to know the flash control is ready for activity.
        if (flashMsg.eventType == 'onLoad') {
            var svgString;
            var params = svgviewer.svgParamsDict[flashMsg.uniqueId];
            /**
             If the type is inline_script, that means that the SVG is available
             in the local DOM within a script tag. Also, since this message is being received,
             the javascript interface is available, therefore, an optimzation can be performed.
             In this case, the flash control leaves control to the browser (this code)
             and we pull the SVG directly from the DOM and pass it to flash through the available
             javascript interface. This avoids having the flash control pulling the data using
             a URL load routine which is, theoretically, much more expensive.

             Note that this provides a simple example of how to load SVG on the fly from a string.
            **/
            if (params.sourceType == 'inline_script') {
                var flashSVG = svgviewer.getFlashMovieObject(params.objectId);
                svgString = document.getElementById(params.svgId).innerHTML;
                flashSVG.sendToFlash({type: 'load', sourceType: 'string', svgString: svgString});
            }
        }
        return;
    }
    if (flashMsg.type == 'log') {
        svgviewer.info(flashMsg.logString);
        return;
    }
}

