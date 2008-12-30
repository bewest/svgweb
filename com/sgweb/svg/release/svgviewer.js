/*
Copyright (c) 2008 Richard R. Masters

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

/*------------------------------------------------------------*\
  svgviewer is the global namespace that represents the
  entry point for creating svg objects and looking them up.

  An SVGFlashHandler is the class which is used to create
  the flash object html and handles communication with
  the flash object.

  An SVGNode represents an instance of a sprite.

\*------------------------------------------------------------*/

var svgviewer = {};
svgviewer.svgHandlers = {};

svgviewer.suppressLog= ((typeof(console)=="undefined") || (typeof(console.info) == "undefined"));
svgviewer.info = function(logString) {
    if (svgviewer.suppressLog) {
        return;
    }
    console.info(logString);
}
svgviewer.error = svgviewer.info;


svgviewer.createSVG = function ( params ) {
    if (typeof(params.parentId) == "undefined") {
        svgviewer.error('svgviewer.js: createSVG: no parentId');
        return;
    }
    if (typeof(params.sourceType) == "undefined") {
        svgviewer.error('svgviewer.js: createSVG: no sourceType');
        return;
    }
    if (typeof(params.svgURL) == "undefined") {
        svgviewer.error('svgviewer.js: createSVG: no svgURL');
        return;
    }
    if (params.sourceType == "inline_script" && 
        typeof(params.svgId) == "undefined") {
        svgviewer.error('svgviewer.js: createSVG: no svgId');
        return;
    }
    if (params.sourceType == "url_script" && 
        typeof(params.svgId) == "undefined") {
        svgviewer.error('svgviewer.js: createSVG: no svgId');
        return;
    }

    var svgHandler = new SVGFlashHandler(params);
    svgviewer.svgHandlers[svgHandler.uniqueId] = svgHandler;

    svgHandler.createSVGHTML();
    return svgHandler;
}
svgviewer.clientWidth=function() {
    return (window.innerWidth > 0) ? window.innerWidth :
            ((document.documentElement && (document.documentElement.clientWidth > 0)) ? document.documentElement.clientWidth :
             document.body.clientWidth);
}
svgviewer.clientHeight=function() {
    return (window.innerHeight > 0) ? window.innerHeight :
            ((document.documentElement && (document.documentElement.clientHeight > 0)) ? document.documentElement.clientHeight :
             document.body.clientHeight);
}

svgviewer.inBrowserString = function(browserString) {
    if (typeof(navigator) == "undefined") {
        return false;
    }
    if (typeof(navigator.userAgent) != "string") {
        return false;
    }
    if (navigator.userAgent.indexOf(browserString) != -1) {
        return true;
    }
    return false;
}

svgviewer.addEvent = function( obj, type, fn )
{
    if (obj.addEventListener)
        obj.addEventListener( type, fn, false );
    else if (obj.attachEvent)
    {
        obj["e"+type+fn] = fn;
        obj[type+fn] = function() { obj["e"+type+fn]( window.event ); }
        obj.attachEvent( "on"+type, obj[type+fn] );
    }
}

svgviewer.removeEvent = function ( obj, type, fn )
{
    if (obj.removeEventListener)
        obj.removeEventListener( type, fn, false );
    else if (obj.detachEvent)
    {
        obj.detachEvent( "on"+type, obj[type+fn] );
        obj[type+fn] = null;
        obj["e"+type+fn] = null;
    }
}

function receiveFromFlash(flashMsg) {
    var svgHandler = svgviewer.svgHandlers[flashMsg.uniqueId];
    if (svgHandler) {
        svgHandler.onMessage(flashMsg);
    }
}

/* end svgviewer global functions */



/*
 *  Class SVGFlashHandler
 */

function SVGFlashHandler(params) {
    this.svgScript = '';
    this.parentId = params.parentId;
    this.sourceType = params.sourceType;
    this.svgURL = params.svgURL;
    this.svgNodes = {};

    // debug
    if (typeof(params.debug) != "undefined") {
        this.debug = params.debug;
    }
    else {
        this.debug = false;
    }

    if (typeof(params.sizeToSVG) != "undefined") {
        this.sizeToSVG = params.sizeToSVG;
    }
    else {
        this.sizeToSVG = false;
    }

    if (   (typeof(params.width) == "undefined")
        || (typeof(params.height) == "undefined") ) {
        this.width= 2048;
        this.height= 1024;
        this.sizeToSVG = true;
    }
    else {
        this.width = params.width ;
        this.height = params.height ;
    }

    if (typeof(params.scaleMode) != "undefined") {
        this.scaleMode = params.scaleMode;
    }
    else {
        this.scaleMode = "showAll_svg";
    }
    // uniqueId
    if (typeof(params.uniqueId) != "undefined") {
        this.uniqueId = params.uniqueId;
    }
    else {
        this.uniqueId = 'rand' + Math.random();
    }
    this.objectId = params.uniqueId + 'Obj';

    if (typeof(params.svgId) != "undefined") {
        this.svgId = params.svgId;
    }

    if (typeof(params.renderer) != "undefined") {
        var renderers = params.renderer.split(/\s*,\s*/)
        var currentIndex=0;
        while (currentIndex < renderers.length && !this.renderer) {
            switch (renderers[currentIndex]) {
                case 'native':
                    if (!svgviewer.inBrowserString('MSIE')) {
                        this.renderer=renderers[currentIndex];
                    }
                    break;
                case 'svgviewer':
                    this.renderer=renderers[currentIndex];
                    break;
                default:
                    break;
            }
            currentIndex++;
        }
        if (!this.renderer) {
            this.renderer = 'svgviewer';
        }
    }
    else {
        this.renderer = "svgviewer";
    }

    if (this.debug) {
        svgviewer.info('svgviewer.js: renderer is: ' + this.renderer);
    }

    // scaleX
    if (typeof(params.scaleX) != "undefined") {
        this.scaleX= params.scaleX;
    }
    else {
        this.scaleX=1.0;
    }

    // scaleY
    if (typeof(params.scaleY) != "undefined") {
        this.scaleY= params.scaleY;
    }
    else {
        this.scaleY=1.0;
    }

    // translateX
    if (typeof(params.translateX) != "undefined") {
        this.translateX= params.translateX;
    }
    else {
        this.translateX=0;
    }

    // translateY
    if (typeof(params.translateY) != "undefined") {
        this.translateY= params.translateY;
    }
    else {
        this.translateY=0;
    }

    // bgcolor
    if (typeof(params.bgcolor) != "undefined") {
        this.bgcolor = params.bgcolor;
    }
    else {
        this.bgcolor = '';
    }

    // transparent
    if (typeof(params.transparent) != "undefined") {
        this.transparent = params.transparent;
    }
    else {
        this.transparent = false;
    }

    if (typeof(params.onLoad) == "function") {
        this.onLoadCallback = params.onLoad;
    }

}

SVGFlashHandler.prototype.createSVGHTML = function() {
    if (this.renderer == 'native') {
        return this.createNativeHTML();
    }
    return this.createFlashHTML();
}

SVGFlashHandler.prototype.createNativeHTML = function() {
    var svgObject = document.createElement('object');
    svgObject.setAttribute('type', 'image/svg+xml');
    svgObject.setAttribute('data', this.svgURL);
    svgObject.setAttribute('style', 'overflow:hidden');
    svgObject.setAttribute('width', this.width);
    svgObject.setAttribute('height', this.height);
    var parentNode = document.getElementById(this.parentId);
    parentNode.appendChild(svgObject);
}

SVGFlashHandler.prototype.createFlashHTML = function() {

    var bgcolor ='';
    if (this.bgcolor != '') {
        bgcolor = ' bgcolor="' + this.bgcolor + '"';
    }
    var transparent ='';
    if (this.transparent) {
        transparent = ' wmode="transparent" ';
    }


    var flashVars = '"' +
        'uniqueId=' + this.uniqueId +
        '&sourceType=' + this.sourceType +
        '&svgURL=' + this.svgURL +
        '&scaleMode=' + this.scaleMode +
        '&translateX=' + this.translateX + 
        '&translateY=' + this.translateY + 
        '&scaleX=' + this.scaleX +
        '&scaleY=' + this.scaleY +
        '&debug=' + this.debug;
    if (typeof(this.svgId) != "undefined") {
        flashVars = flashVars  + '&svgId=' + this.svgId;
    }
    flashVars = flashVars  + '"';

    var html='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" ' +
        '        codebase="" id="' + this.objectId + '" ' + 
        '        width="' + this.width + '" height="' + this.height + '" style="float: left;"> ' +
        '    <param name="AllowScriptAccess" value="always"/> ' +
        '    <param name="movie" value="svgviewer.swf"/> ' +
        '    <param name="FlashVars" value=' + flashVars + '/> ' +
        (this.transparent ? '    <param name="wmode" value="transparent"/> ' : '') +
        '    <embed  name="' + this.objectId + '" play="false" ' +
        '            swliveconnect="true" AllowScriptAccess="always" ' +
        '            src="svgviewer.swf" quality="high" ' + transparent + bgcolor +
        '            width="' + this.width + '" height="' + this.height + '"' +
        '            type="application/x-shockwave-flash" ' +
        '            FlashVars=' + flashVars + '> ' +
        '    </embed> ' +
        '</object> ';

    var node = document.getElementById(this.parentId);
    if (node) {
        node.innerHTML = html;
    }
}


SVGFlashHandler.prototype.sendToFlash = function(flashMsg) {
   flashMsg.uniqueId = this.uniqueId;
   if (typeof(this.flashObj) == "undefined") {
      this.flashObj = this.getFlashObject();
   }
   var retval = null;
   try {
       retval = this.flashObj.sendToFlash(flashMsg);
   }
   catch(e) {
   }
   return retval;
}

SVGFlashHandler.prototype.onMessage = function(flashMsg) {
    if (flashMsg.type == 'event') {
        this.onEvent(flashMsg);
        return;
    }
    if (flashMsg.type == 'log') {
        this.onLog(flashMsg);
        return;
    }
    if (flashMsg.type == 'script') {
        this.onScript(flashMsg);
        return;
    }
}

SVGFlashHandler.prototype.onLog = function(flashMsg) {
    svgviewer.info(flashMsg.logString);
}


SVGFlashHandler.prototype.onEvent = function(flashMsg) {
    if (flashMsg.eventType == 'onLoad') {
        this.onLoad(flashMsg);
        return;
    }
    if (flashMsg.eventType == 'onStartup') {
        this.onStartup(flashMsg);
        return;
    }
    if (flashMsg.eventType.substr(0,5) == 'mouse') {
        this.onMouseEvent(flashMsg);
        return;
    }
}

SVGFlashHandler.prototype.onMouseEvent = function(flashMsg) {
    var element = this.getElementById(flashMsg.elementId);
    // xxx need to compute proper coordinates
    var myEvent = { target: element, 
                    clientX: flashMsg.screenX,
                    clientY: flashMsg.screenY,
                    screenX: flashMsg.screenX,
                    screenY: flashMsg.screenY,
                    preventDefault: function() { this.returnValue=false; }
                  };

    var handlers;
    if (flashMsg.parentId) {
        var parentElem = this.getElementById(flashMsg.parentId);
        handlers = parentElem.eventHandlers[flashMsg.eventType];
    }
    else {
        handlers = element.eventHandlers[flashMsg.eventType];
    }
    for (var i in handlers) {
        var handler = handlers[i];
        handler(myEvent);
    }
}



/*
 * 
 * The flash control actionscript calls this on startup.
 * We use this to know the flash control is ready for activity.
 * 
 */

SVGFlashHandler.prototype.onStartup = function(flashMsg) {
    // Recording the flash object was deferred until it actually exists!
    this.flashObj = this.getFlashObject();

    /**
     If the type is inline_script, that means that the SVG is available
     in the local DOM within a script tag. Also, since this message is being received,
     the javascript interface is available. Therefore, an optimzation can be performed.
     In this case, the flash control leaves control to the browser (this code)
     and we pull the SVG directly from the DOM and pass it to flash through the available
     javascript interface. This avoids having the flash control pulling the data using
     a URLRequest which is, theoretically, much more expensive.

     Note that this provides a simple example of how to load SVG on the fly from a string.
    **/
    if (this.sourceType == 'inline_script') {
        var svgText = document.getElementById(this.svgId).innerHTML;
        this.sendToFlash({type: 'load', sourceType: 'string', svgString: svgText});
    }

}

SVGFlashHandler.prototype.onLoad = function(flashMsg) {
    var getRootMsg = this.sendToFlash({type: 'invoke', method: 'getRoot'});
    this.documentElement = new SVGNode(this);
    this.documentElement.elementId = getRootMsg.elementId;
    this.rootElement = this.documentElement;

    // resize to the <svg> width
    svgviewer.info("svg w,h=" + flashMsg.width + "," + flashMsg.height);
    if (this.sizeToSVG) {
        if (   (this.flashObj.width != flashMsg.width)
            || (this.flashObj.height != flashMsg.height) ) {
            this.flashObj.parentNode.style.visibility='hidden';
            this.flashObj.width = flashMsg.width;
            this.flashObj.height = flashMsg.height;
            this.width = flashMsg.width;
            this.height = flashMsg.height;
            setTimeout('svgviewer.svgHandlers["' + this.uniqueId + '"].flashObj.parentNode.setStyleAttribute("visibility","visible");', 10);
        }
    }

    if (this.onLoadCallback) {
        this.onLoadCallback(flashMsg);
    }

    this.svgScript = this.svgScript + flashMsg.onLoad;

    if (svgviewer.inBrowserString("MSIE")) {
        window.execScript(this.svgScript);
    }
    else {
        setTimeout('eval(window.svgviewer.svgHandlers["' + this.uniqueId + '"].svgScript);', 100);
    }
}

SVGFlashHandler.prototype.getSVGDocument = function() {
    if (this.renderer == 'svgviewer') {
        return this;
    }
    if (this.renderer == 'native') {
        return document.getElementById(this.parentId).childNodes[0].contentDocument;
    }
}

SVGFlashHandler.prototype.getXML = function() {
    var getXMLMsg = this.sendToFlash({type: 'invoke', method: 'getXML'});
    return getXMLMsg.xmlString.split(';_SVGNL_;').join('\\n');
}

/*
 * onScript
 *
 */
SVGFlashHandler.prototype.scriptReplacements = [
      { pattern: ';_SVGNL_;', replacement: '\\n' },
      { pattern: 'document.createElementNS',
        replacement: 'svgviewer.svgHandlers["_SVG_UNIQ_ID_"].createElementNS' },
      { pattern: 'document.documentElement',
        replacement: 'svgviewer.svgHandlers["_SVG_UNIQ_ID_"].documentElement' },
      { pattern: 'document.getElementById',
        replacement: 'svgviewer.svgHandlers["_SVG_UNIQ_ID_"].getElementById' },
      { pattern: 'document.createTextNode',
        replacement: 'svgviewer.svgHandlers["_SVG_UNIQ_ID_"].createTextNode' } 
      ];


SVGFlashHandler.prototype.onScript = function(flashMsg) {
    var svgScript = flashMsg.script;
    for (var i in this.scriptReplacements) {
        var repObj = this.scriptReplacements[i];
        var replaceStr = repObj.replacement.split('_SVG_UNIQ_ID_').join(flashMsg.uniqueId);
        svgScript = svgScript.split(repObj.pattern).join(replaceStr);
    }
    svgScript=svgScript.replace(/const(\s*\S+\s*=)/g, 'var$1');
    // xxx should use new getter/setter syntax if this is ie8 or higher.
    // This is unreliable until then.
    if (svgviewer.inBrowserString("MSIE")) {
        svgScript=svgScript.replace(/([\S]*).style.visibility\s*=\s*(\S+);/g, '$1.setStyleAttribute("visibility",$2);');
        svgScript=svgScript.replace(/([\S]*).style.opacity\s*=\s*(\S+);/g, '$1.setStyleAttribute("opacity",$2);');
        svgScript=svgScript.replace(/([\S]*).style.stroke\s*=\s*(\S+);/g, '$1.setStyleAttribute("stroke",$2);');
        svgScript=svgScript.replace(/([\S]*).style.fill\s*=\s*(\S+);/g, '$1.setStyleAttribute("fill",$2);');
    
        svgScript=svgScript.replace(/.style.visibility/g, '.getStyleAttribute("visibility")');
        svgScript=svgScript.replace(/.style.opacity/g, '.getStyleAttribute("opacity")');
        svgScript=svgScript.replace(/.style.stroke/g, '.getStyleAttribute("stroke")');
        svgScript=svgScript.replace(/.style.fill/g, '.getStyleAttribute("fill")');
    }
    this.svgScript = this.svgScript + svgScript;
}


// Used by onLoad
SVGFlashHandler.prototype.getFlashObject = function() {
    if (window.document[this.objectId]) {
        if (document[this.objectId].length != undefined) {
            return document[this.objectId][1];
        }
        return document[this.objectId];
    }
    if (navigator.appName.indexOf("Microsoft Internet")==-1) {
        if (document.embeds && document.embeds[this.objectId]) {
            return document.embeds[this.objectId]; 
        }
    }
    else {
        return document.getElementById(this.objectId);
    }
}

SVGFlashHandler.prototype.getElementById = function(elementId) {
   // We may have a local copy if we have created the object from
   // script or if we have looked up the object before.
   if (typeof(this.svgNodes[elementId]) != "undefined") {
       // XXX should refresh attributes from the flash version
       // (animations could change getter/setter values)
       return this.svgNodes[elementId];
   }

   var returnMsg = this.sendToFlash({ type: 'invoke', method: 'getElementById',
                                      elementId: elementId
                                    });
   if (!returnMsg) {
       return null;
   }
   // This is the first time we have looked up the object, so cache the object
   // XXX should refresh from flash (animations could change getter/setter values)
   var svgNode = new SVGNode(this);
   svgNode.elementId = returnMsg.elementId;
   svgNode.id = returnMsg.elementId;
   this.svgNodes[elementId] = svgNode;
   return svgNode;
}


SVGFlashHandler.prototype.setTransform = function(transformParam) {
   var returnMsg = this.sendToFlash({ type: 'invoke', method: 'setTransform',
                                      transform: transformParam
                                    });
}

SVGFlashHandler.prototype.createElementNS = function(elementNS, elementType) {
   var svgNode = new SVGNode(this);
   svgNode.elementId = 'rand' + Math.random();
   var returnMsg = this.sendToFlash({ type: 'invoke', method: 'createElementNS',
                                      elementType: elementType, 
                                      elementId: svgNode.elementId
                                    });

   this.svgNodes[svgNode.elementId] = svgNode;
   return svgNode;
}

SVGFlashHandler.prototype.createTextNode = function(elementText) {
   var svgNode = new SVGNode(this);
   svgNode.elementId = 'rand' + Math.random();
   var returnMsg = this.sendToFlash({ type: 'invoke', method: 'createTextNode',
                                      elementId: svgNode.elementId,
                                      text: elementText
                                    });
   return svgNode;

}
/*
 *  Class SVGNode
 *
 */
function SVGNode(svgHandler) {
    this.svgHandler = svgHandler;
    this.eventHandlers = {};
    this.childNodes = [];
    this.childNodes.item = function(i) { return this[i]; };
    var svgNode=this;
    this.style = { node: svgNode };
    if (!svgviewer.inBrowserString("MSIE")) {
        this.style.__defineGetter__("opacity", function(){
            return this.node.getAttribute('opacity');
        });
        this.style.__defineSetter__("opacity", function(newOpacity){
            this.node.setAttribute('opacity', newOpacity);
        });
        this.style.__defineGetter__("visibility", function(){
            return this.node.getAttribute('visibility');
        });
        this.style.__defineSetter__("visibility", function(newVisibility){
            this.node.setAttribute('style', 'visibility:' + newVisibility);
        });
    }

}

SVGNode.prototype.sendToFlash = function(flashMsg) {
    return this.svgHandler.sendToFlash(flashMsg);
}

SVGNode.prototype.createElementNS = function(elementNS, elementType) {
    return this.svgHandler.createElementNS(elementNS, elementType);
}

SVGNode.prototype.getElementById = function(elementId) {
    return this.svgHandler.getElementById(elementId);
}

SVGNode.prototype.createTextNode = function(elementText) {
    return this.svgHandler.createTextNode(elementText);
}

SVGNode.prototype.setAttribute = function(attrName, attrValue) {
    this.sendToFlash({ type: 'invoke', method: 'setAttribute',
                       elementId: this.elementId,
                       attrName: attrName, attrValue: attrValue });
    if (attrName == 'id') {
        this.elementId = attrValue;
        this.id = attrValue;
        this.svgHandler.svgNodes[attrValue] = this;
    }
}
SVGNode.prototype.setStyleAttribute = function(attrName, attrValue) {
    this.sendToFlash({ type: 'invoke', method: 'setAttribute',
                       elementId: this.elementId,
                       applyToStyle: true,
                       attrName: attrName, attrValue: attrValue });
    if (attrName == 'id') {
        this.elementId = attrValue;
        this.id = attrValue;
        this.svgHandler.svgNodes[attrValue] = this;
    }
}
SVGNode.prototype.setAttributeNS = function(NS, attrName, attrValue) {
    this.setAttribute(attrName, attrValue);
}

SVGNode.prototype.getStyleAttribute = function(attrName) {
   var returnMsg = this.sendToFlash({ type: 'invoke', method: 'getAttribute',
                                      elementId: this.elementId,
                                      getFromStyle: true,
                                      attrName: attrName });
   if (!returnMsg) {
       return null;
   }
   return returnMsg.attrValue;
}

SVGNode.prototype.getAttribute = function(attrName) {
   var returnMsg = this.sendToFlash({ type: 'invoke', method: 'getAttribute',
                                      elementId: this.elementId,
                                      attrName: attrName });
   if (!returnMsg) {
       return null;
   }
   return returnMsg.attrValue;
}

SVGNode.prototype.addEventListener = function(eventTypeParam, eventListener, captureFlag) {
   if (eventTypeParam == 'keydown') {
       svgviewer.addEvent(window.document, eventTypeParam, 
                          (function(myListener) {
                              return function(myEvent) {
                                  if (!myEvent.preventDefault) {
                                      myEvent.preventDefault=function() { this.returnValue=false;};
                                  }
                                  myListener(myEvent);
                              }
                          })(eventListener) );
       return;
   }

   if (typeof(this.eventHandlers[eventTypeParam]) == 'undefined') {
       this.eventHandlers[eventTypeParam] = [ eventListener ];
   }
   else {
       this.eventHandlers[eventTypeParam].push(eventListener);
   }
   this.sendToFlash({ type: 'invoke', method: 'addEventListener',
                      elementId: this.elementId,
                      eventType: eventTypeParam });
}

SVGNode.prototype.unsuspendRedraw = function(dummy) {
}

SVGNode.prototype.suspendRedraw = function(dummy) {
}

SVGNode.prototype.appendChild = function(childNode) {
   childNode.parentNode = this;
   this.sendToFlash({ type: 'invoke', method: 'appendChild',
                      elementId: this.elementId,
                      childId: childNode.elementId });
   this.childNodes.push(childNode);
}

SVGNode.prototype.removeChild = function(childNode) {
   // xxx not implemented
   this.sendToFlash({ type: 'invoke', method: 'removeChild',
                      elementId: this.elementId,
                      childId: childNode.elementId });
   for (i in this.childNodes) {
       if (childNode == this.childNodes[i]) {
           this.childNodes.splice(i, 1);
           return;
       }
   }
}

