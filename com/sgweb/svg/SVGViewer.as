/*
 Copyright (c) 2009 by contributors:

 * James Hight (http://labs.zavoo.com/)
 * Richard R. Masters

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

/*

SVGViewer is a flash sprite which is the parent for a tree of SVGNodes
which are sprites initialized from XML. The top most SVGNode is an SVGRoot.

The xml is parsed and xml children are walked when the object is rendered.
Child SVGNodes are added and when they are rendered, their xml is walked
and so on.

*/


package com.sgweb.svg
{
    
    import com.sgweb.svg.core.SVGNode;
    import com.sgweb.svg.nodes.SVGSVGNode;
    import com.sgweb.svg.nodes.SVGGroupNode;
    
    import flash.display.Sprite;
    import flash.display.StageScaleMode;
    import flash.display.LoaderInfo;
    import flash.events.Event;
    import flash.events.MouseEvent;
    import flash.geom.Transform;
    import flash.geom.Matrix;
    import flash.external.ExternalInterface;
    import flash.net.URLLoader;
    import flash.net.URLRequest;
    import flash.xml.XMLNode;
    import flash.xml.XMLNodeType;

    import mx.core.Singleton;
    import flash.system.ApplicationDomain;

    [SWF(frameRate="24", width="2048", height="1024")]
    /**
     * Flex container for the SVG Renderer
     **/
    public class SVGViewer extends Sprite
    {
        private var _svgRoot:SVGSVGNode;
        private var html:String;
        private var js_uniqueId:String = "";
        private var js_createdElements:Object = {};
        private var js_createdTextNodes:Object = {};
        private var js_savedXML:String = "";
        private var myXMLLoader:URLLoader= new URLLoader ();
        private var myHTMLLoader:URLLoader= new URLLoader ();

        protected var sourceTypeParam:String = "";
        protected var svgURLParam:String = "";
        protected var svgIdParam:String = "";
        public var scaleModeParam:String = "showAll_svg";
        protected var renderStartTime:Number;
        protected var debugEnabled:Boolean = false;
        protected var scriptSentToJS:Boolean = false;

        public function SVGViewer():void {
            XML.ignoreProcessingInstructions = false;
            XML.ignoreComments = false;
            super();
            this.addEventListener(Event.ADDED_TO_STAGE, addedToStage);
        }
        
        /*
           The width and height that is used is the size of the coordinate space that
           flash is using for scaling. The coordinate space comes from the SWF directive
           (2048 x 1024) at the top of this file. However, if the scaleModeParam is
           showAll_svg, then we use flash noScale mode and the size of the coordinate space
           is the size of the flash object.
        */
        public function getWidth():Number {
            if (this.scaleModeParam == "showAll_svg") {
                return this.stage.stageWidth;
            }
            else {
                return 2048.0
            }
        }

        public function getHeight():Number {
            if (this.scaleModeParam == "showAll_svg") {
                return this.stage.stageHeight;
            }
            else {
                return 1024.0;
            }
        }

        public function debug(debugMessage:String):void {
            if (this.debugEnabled) {
                try {
                    ExternalInterface.call("receiveFromFlash", { type: 'log',
                                                                 uniqueId: this.js_uniqueId,
                                                                 logString: debugMessage
                                                               } );
                }
                catch(error:SecurityError) {
                }
            }
        }
        public function handleOnLoad():void {
            this.debug("render time: " + ( (new Date()).valueOf()  - this.renderStartTime) + "ms");
            var onLoadHandler:String = '';
            if (this._svgRoot.xml.@onload) {
                onLoadHandler = this._svgRoot.xml.@onload;
            }
            try {
                ExternalInterface.call("receiveFromFlash", { type: 'event',
                                                             eventType: "onLoad",
                                                             width: this._svgRoot.getWidth(),
                                                             height: this._svgRoot.getHeight(),
                                                             uniqueId: this.js_uniqueId,
                                                             onLoad: onLoadHandler } );
            }
            catch(error:SecurityError) {
            }
        }
        public function handleScript(script:String):void {
            if (!this.scriptSentToJS) {           
                try {
                    ExternalInterface.call("receiveFromFlash", { type: 'script',
                                                                 uniqueId: this.js_uniqueId,
                                                                 script: script } );
                }
                catch(error:SecurityError) {
                }
                this.scriptSentToJS=true;
            }
        }

        /**
         * @public
         **/
        public function xmlLoaded(event : Event):void {
            this.debug("xml is loaded. length: "+ String(event.target.data).length);
            this.renderStartTime =  (new Date()).valueOf();
            this.js_savedXML = event.target.data;
            var dataXML:XML = new XML(SVGViewer.expandEntities(event.target.data));
            this._svgRoot = new SVGSVGNode(null, dataXML);
            this.addChild(this._svgRoot);
        }

        public static function expandEntities(xmlString:String):String {
            var entityMap:Object = {};
            for each(var myMatch:String in xmlString.match(/.*<!ENTITY\s+(\S+)\s+"([^"]*)"\s*>/mg) ) {
                 var parts:Array = myMatch.match(/.*<!ENTITY\s+(\S+)\s+"([^"]*)"\s*>/m);
                 entityMap[parts[1]]=parts[2];
            }
            for (var myEntity:String in entityMap) {
                xmlString = xmlString.split("&" + myEntity + ";").join(entityMap[myEntity]);
            }
            return xmlString;
        }

        public function htmlLoaded(event : Event):void {
            this.renderStartTime =  (new Date()).valueOf();
            var svgString:String="";
            var svgCopying:Boolean=false;
            var svgStartString1:String= 'id="'+this.svgIdParam+'"';
            var svgStartString2:String= "id='"+this.svgIdParam+"'";
            var svgEndString:String="</svg>";

            this.html = event.target.data;
            this.html = this.html.replace('\\n', '\\\\n');
            var htmlStrings:Object = this.html.split('\n');
            for (var i:String in htmlStrings) {
                if (svgCopying) {
                    svgString += (htmlStrings[i] + "\n");
                    if (htmlStrings[i].indexOf(svgEndString) != -1) {
                        svgCopying=false;
                    }
                }
                if (htmlStrings[i].indexOf(svgStartString1) != -1) {
                    svgCopying=true;
                }
                if (htmlStrings[i].indexOf(svgStartString2) != -1) {
                    svgCopying=true;
                }
            }
            this.js_savedXML = svgString;
            var dataXML:XML = new XML(SVGViewer.expandEntities(svgString));
            this._svgRoot = new SVGSVGNode(null, dataXML);
            this.addChild(this._svgRoot);
 
            // notify browser javascript that we are loaded
            try {
                var result:Object = ExternalInterface.call("receiveFromFlash",
                    { type: 'event', eventType: 'onLoad', uniqueId: this.js_uniqueId } );
            }
            catch(error:SecurityError) {
                var myURL:String = this.root.loaderInfo.loaderURL;
                var debugstr:String = "Security Error on ExternalInterface.call(...). ";
                if (myURL.substring(0,4) == "file") {
                    debugstr += "This is expected when loaded from a local file.";
                }
                this.debug(debugstr);
            }
        }

        public function loadSVGString(svgString:String):void {
            this.renderStartTime =  (new Date()).valueOf();
            this.js_savedXML = svgString;
            var dataXML:XML = new XML(SVGViewer.expandEntities(svgString));
            this._svgRoot = new SVGSVGNode(null, dataXML);
            this.addChild(this._svgRoot);
        }

        public function loadSVGURL():void {
            this.debug("Doing loadSVGURL for this URL: " + this.svgURLParam);
            var myXMLURL : URLRequest = new URLRequest (this.svgURLParam);
            this.myXMLLoader.addEventListener (Event.COMPLETE, xmlLoaded);
            try
            {
                this.myXMLLoader.load(myXMLURL);
            }
            catch (error:ArgumentError)
            {
                this.debug("An ArgumentError has occurred.");
            }
            catch (error:SecurityError)
            {
                this.debug("A SecurityError has occurred.");
            }
        }

        public function loadHTMLURL():void {
            var myHTMLURL : URLRequest = new URLRequest (this.svgURLParam);
            this.myHTMLLoader.addEventListener (Event.COMPLETE, htmlLoaded);
            try
            {
                this.myHTMLLoader.load(myHTMLURL);
            }
            catch (error:ArgumentError)
            {
                this.debug("An ArgumentError has occurred.");
            }
            catch (error:SecurityError)
            {
                this.debug("A SecurityError has occurred.");
            }
        }

        private function resizeListener (e:Event):void {
            this.transformViewer();
            this._svgRoot.invalidateDisplay();
        }

        protected function transformViewer():void {
            // noScale mode centers the object within the 2048x1024 scale.
            // transformViewer() reverses that so that we start with the
            // proper zero coordinate.
            if (this.scaleModeParam == "showAll_svg" || this.scaleModeParam == "noScale") {
                var newMatrix:Matrix = new Matrix();
                newMatrix.translate( (2048.0 - this.stage.stageWidth) / 2, (1024.0 - this.stage.stageHeight) / 2);
                this.transform.matrix = newMatrix;
            }
        }

        private function addedToStage(event:Event = null):void {
            stage.addEventListener(Event.RESIZE, resizeListener);

            var outerthis:SVGViewer = this;
            //this.debug("Got addedToStage event.");
            var myURL:String = this.root.loaderInfo.loaderURL;
            if (ExternalInterface.available) {
                this.debug("External interface may be available.");

                // process the parameters to get the unique id
                var paramsObj:Object = LoaderInfo(this.root.loaderInfo).parameters;
                var item:String;
                for (item in paramsObj) {
                    if (item == "uniqueId") {
                        this.js_uniqueId = paramsObj[item];
                    }
                    if (item == "debug") {
                        if (paramsObj[item] == 'true') {
                            this.debugEnabled = true;
                        }
                        else {
                            this.debugEnabled = false;
                        }
                    }
                }

                // register interface functions for browser javascript engine
                function js_receiveFromBrowser(jsMsg:Object):Object {
                    if (jsMsg.type == 'load') {
                        return outerthis.js_handleLoad(jsMsg);
                    }
                    if (jsMsg.type == 'invoke') {
                        return outerthis.js_handleInvoke(jsMsg);
                    }
                    if (jsMsg.type == 'getVersion') {
                        return { type: 'version', version: '0.7.3' };
                    }
                    return null;
                }
                var debugstr:String;
                try {
                    ExternalInterface.addCallback("sendToFlash", js_receiveFromBrowser);
                }
                catch(error:SecurityError) {
                    debugstr = "Security Error on ExternalInterface.addCallback(...). ";
                    if (myURL.substring(0,4) == "file") {
                        debugstr += "This is expected when loaded from a local file.";
                    }
                    this.debug(debugstr);
                }

                // process <object> parameters
                var matr:Matrix;
                for (item in paramsObj) {
                    if (item == "scaleMode") {
                        this.scaleModeParam = paramsObj[item];
                    }
                    if (item == "sourceType") {
                        this.sourceTypeParam = paramsObj[item];
                    }
                    if (item == "svgURL") {
                        this.svgURLParam = paramsObj[item];
                    }
                    if (item == "svgId") {
                        this.svgIdParam = paramsObj[item];
                    }
                }
                if (this.scaleModeParam == "showAll_svg"
                        || this.scaleModeParam == "noScale") {
                    this.stage.scaleMode = StageScaleMode.NO_SCALE;
                    this.transformViewer();
                }

                if (this.sourceTypeParam == 'url_svg') {
                    this.loadSVGURL();
                }
                if (this.sourceTypeParam == 'url_script') {
                    this.loadHTMLURL();
                }

                if (this.sourceTypeParam == "inline_script") {
                    this.debug("Inline URL parameter specified: " + this.svgURLParam);
                    this.debug("The SWF file URL is: " + myURL);
                    /* If the swf url starts with "file" then we need to use the url retrieval
                       routines to get the entire html file and then get the svg element 
                       because flash does not allow browser javascript to pass it in. This is
                       because when loaded from file, network access is also not allowed, to
                       prevent transfer of local data to network, and flash includes javascript
                       access as part of its network access profile and disables it for local files.
                       Therefore, we cannot rely on the more efficient mechanism where javascript
                       retrieves the SVG directly from the DOM, and so must do it here ourselves.

                       If the url is http, then javascript would be active and would pass in
                       svg text directly so there is no need to do this url retrieval here
                       in that case.
                    */
                    if (myURL.substring(0,4) == "file") {
                        this.debug("Local file, so javascript is not available or in charge.");
                        this.debug("Need to use URLRequest to load the file.");
                        this.loadHTMLURL();
                    }
                    else {
                        this.debug("Not a 'file://' type URL, so network and scripting should be");
                        this.debug("active, so assume javascript is in charge and do nothing.");
                    }
                }


                // notify browser javascript that we are started and ready
                try {
                    var result:Object = ExternalInterface.call("receiveFromFlash",
                        { type: 'event', eventType: 'onStartup', uniqueId: this.js_uniqueId } );
                }
                catch(error:SecurityError) {
                    debugstr = "Security Error on ExternalInterface.call(...). ";
                    if (myURL.substring(0,4) == "file") {
                        debugstr += "This is expected when loaded from a local file.";
                    }
                    this.debug(debugstr);
                }
            }
            else {
                this.debug("External interface not available.");
                this.debug("Assuming flashplayer debug mode. Loading default file.");
                this.sourceTypeParam = 'url_svg';
                this.svgURLParam = 'scimitar.svg';
                this.loadSVGURL();
            }
        }

        public function js_handleLoad(jsMsg:Object):Object {
            if (jsMsg.sourceType == 'string') {
                this.sourceTypeParam = 'string';
                this.loadSVGString(jsMsg.svgString);
            }
            if (jsMsg.sourceType == 'url_svg') {
                this.sourceTypeParam = 'url_svg';
                this.svgURLParam = jsMsg.svgURL;
                this.loadSVGURL();
            }
            return jsMsg;
        }

        public static function js_dispatchMouseEvent(myUniqueId:String, myElem:SVGNode, event:MouseEvent, eventType:String):void {
            var i:int;
            if (myElem is SVGGroupNode) {
                for(i=0; i < myElem.numChildren; i++) {
                    SVGViewer.js_sendChildMouseEvent(myUniqueId, myElem, SVGNode(myElem.getChildAt(i)), event, eventType);
                }
            }
            else {
                SVGViewer.js_sendMouseEvent(myUniqueId, myElem, event, eventType);
            }
        }

        public static function js_sendMouseEvent(myUniqueId:String, myElem:SVGNode, event:MouseEvent, eventType:String):void {
            try {
                ExternalInterface.call("receiveFromFlash",
                                         { type: 'event',
                                           uniqueId: myUniqueId,
                                           elementId: myElem.xml.@id.toString(),
                                           eventType: eventType,
                                           clientX: event.localX,
                                           clientY: event.localY,
                                           screenX: event.stageX,
                                           screenY: event.stageY
                                         } );
            }
            catch(error:SecurityError) {
            }
        }

        public static function js_sendChildMouseEvent(myUniqueId:String, parentNode:SVGNode, childNode:SVGNode,
                                                      event:MouseEvent, eventType:String):void {
            try {
                ExternalInterface.call("receiveFromFlash",
                                         { type: 'event',
                                           uniqueId: myUniqueId,
                                           parentId: parentNode.xml.@id.toString(),
                                           elementId: childNode.xml.@id.toString(),
                                           eventType: eventType,
                                           clientX: event.localX,
                                           clientY: event.localY,
                                           screenX: event.stageX,
                                           screenY: event.stageY
                                         } );
            }
            catch(error:SecurityError) {
            }
        }

        public function js_handleInvoke(jsMsg:Object):Object {
            var element:SVGNode;
            if (jsMsg.method == 'createElementNS') {
                var xmlString:String = '<' + jsMsg.elementType + ' id="' + jsMsg.elementId +  '" />';
                var childXML:XML = new XML(xmlString);
                this.js_createdElements[jsMsg.elementId] = this._svgRoot.parseNode(childXML);
            }
            if (jsMsg.method == 'createTextNode') {
                this.js_createdTextNodes[jsMsg.elementId] = new XMLNode(XMLNodeType.TEXT_NODE, jsMsg.text);
            }
            if (jsMsg.method == 'setTransform') {
                this.transform.matrix = this._svgRoot.parseTransform(jsMsg.transform); 
            }
            if (jsMsg.method == 'getElementById') {
                if (typeof(this.js_createdElements[jsMsg.elementId]) != "undefined") {
                    return jsMsg;
                }
                if (!this._svgRoot.getElement(jsMsg.elementId)) {
                    this.debug("getElem:not found: " + jsMsg.elementId);
                    return null;
                }
            }
            if (jsMsg.method == 'addEventListener') {
                // Get the parent node
                if (typeof(this.js_createdElements[jsMsg.elementId]) != "undefined") {
                    element=this.js_createdElements[jsMsg.elementId];
                }
                else {
                    element = this._svgRoot.getElement(jsMsg.elementId);
                }
                if (element) {
                    var handler:Function;
                    var i:Number;
                    if (jsMsg.eventType == 'mouseup') {
                        handler = function (myUniqueId:String, myElem:SVGNode):Object {
                                       return function(event:MouseEvent):void {
                                                  SVGViewer.js_dispatchMouseEvent(myUniqueId, myElem, event, 'mouseup');
                                              };
                                   }(this.js_uniqueId, element);
                        element.addEventListener(MouseEvent.MOUSE_UP, handler);
                    }
                    if (jsMsg.eventType == 'mousedown') {
                        handler = function (myUniqueId:String, myElem:SVGNode):Object {
                                       return function(event:MouseEvent):void {
                                                  SVGViewer.js_dispatchMouseEvent(myUniqueId, myElem, event, 'mousedown');
                                              };
                                   }(this.js_uniqueId, element);
                        element.addEventListener(MouseEvent.MOUSE_DOWN, handler);
                    }
                    if (jsMsg.eventType == 'mousemove') {
                        handler = (function (myUniqueId:String, myElem:SVGNode):Object {
                                       return function(event:MouseEvent):void {
                                                  SVGViewer.js_dispatchMouseEvent(myUniqueId, myElem, event, 'mousemove');
                                              };
                                   })(this.js_uniqueId, element);
                        element.addEventListener(MouseEvent.MOUSE_MOVE, handler);
                    }
                    if (jsMsg.eventType == 'mouseover') {
                        handler = function (myUniqueId:String, myElem:SVGNode):Object {
                                       return function(event:MouseEvent):void {
                                                  SVGViewer.js_dispatchMouseEvent(myUniqueId, myElem, event, 'mouseover');
                                              };
                                   }(this.js_uniqueId, element);
                        element.addEventListener(MouseEvent.MOUSE_OVER, handler);
                    }
                    if (jsMsg.eventType == 'mouseout') {
                        handler = function (myUniqueId:String, myElem:SVGNode):Object {
                                       return function(event:MouseEvent):void {
                                                  SVGViewer.js_dispatchMouseEvent(myUniqueId, myElem, event, 'mouseout');
                                              };
                                   }(this.js_uniqueId, element);
                        element.addEventListener(MouseEvent.MOUSE_OUT, handler);
                    }
                }
                else {
                    this.debug("AddEvent:not found: " + jsMsg.elementId);
                }
            }
            if (jsMsg.method == 'appendChild') {
                // Get the parent node
                if (typeof(this.js_createdElements[jsMsg.elementId]) != "undefined") {
                    element=this.js_createdElements[jsMsg.elementId];
                }
                else {
                    element = this._svgRoot.getElement(jsMsg.elementId);
                }
                // Get the child node

                // If the node is text, then just modify the text xml
                if (element && element.xml.localName() == 'text') {
                    var childTextNode:XMLNode;
                    childTextNode=this.js_createdTextNodes[jsMsg.childId];
                    if (childTextNode)  {
                        element.xml.appendChild(childTextNode);
                        element.invalidateDisplay();
                    }
                }
                else {
                    // If the node is not text, then add the SVGNode
                    var childNode:SVGNode;
                    if (typeof(this.js_createdElements[jsMsg.childId]) != "undefined") {
                        childNode=this.js_createdElements[jsMsg.childId];
                    }
                    else {
                        childNode = this._svgRoot.getElement(jsMsg.childId);
                    }
                    if (element && childNode)  {
                        element.addChild(childNode);
                    }
                }
            }
            if (jsMsg.method == 'getRoot') {
                if (this._svgRoot.xml.@id) {
                    jsMsg.elementId = this._svgRoot.xml.@id.toString();
                }
                else {
                    this.debug("SVGViewer: root id not found");
                }
            }
            if (jsMsg.method == 'getXML') {
                jsMsg.xmlString = this.js_savedXML.split('\\n').join(';_SVGNL_;');
            }
            if (jsMsg.method == 'getAttribute') {
                if (typeof(this.js_createdElements[jsMsg.elementId]) != "undefined") {
                    element=this.js_createdElements[jsMsg.elementId];
                }
                else {
                    element = this._svgRoot.getElement(jsMsg.elementId);
                }
                if (element) {
                    jsMsg.attrValue = element.getAttribute(jsMsg.attrName);
                }
                else {
                    this.debug("error:getAttribute: id not found: " + jsMsg.elementId);
                }
            }
            if (jsMsg.method == 'setAttribute') {
                if (typeof(this.js_createdElements[jsMsg.elementId]) != "undefined") {
                    element=this.js_createdElements[jsMsg.elementId];
                }
                else {
                    element = this._svgRoot.getElement(jsMsg.elementId);
                }
                if (element) {
                    element.setAttribute(jsMsg.attrName, jsMsg.attrValue.toString());

                    if (jsMsg.attrName == 'id') {
                        this.js_createdElements[jsMsg.attrValue] = element;
                    }
                }
                else {
                    this.debug("error:setAttribute: id not found: " + jsMsg.elementId);
                }
            }

            return jsMsg;
        }

    }
}
