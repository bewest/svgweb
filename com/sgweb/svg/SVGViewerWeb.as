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
 which are sprites initialized from XML. The top most SVGNode is an SVGSVGNode.
 
 The xml is parsed and xml children are walked when the object is rendered.
 Child SVGNodes are added and when they are rendered, their xml is walked
 and so on.

*/


package com.sgweb.svg
{
    
    import com.sgweb.svg.core.SVGNode;
    import com.sgweb.svg.core.SVGViewer;
    import com.sgweb.svg.nodes.SVGSVGNode;
    import com.sgweb.svg.nodes.SVGGroupNode;
    
    import flash.display.DisplayObject;
    import flash.display.Sprite;
    import flash.display.StageScaleMode;
    import flash.display.StageAlign;
    import flash.display.LoaderInfo;
    import flash.events.Event;
    import flash.events.MouseEvent;
    import flash.events.IOErrorEvent;
    import flash.events.SecurityErrorEvent;
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
    public class SVGViewerWeb extends SVGViewer
    {
        private var js_uniqueId:String = "";
        private var js_createdElements:Object = {};
        private var js_createdTextNodes:Object = {};
        private var js_savedXML:String = "";
        protected var svgIdParam:String = "";
        public var scaleModeParam:String = "showAll_svg";
        protected var scriptSentToJS:Boolean = false;

        protected var renderStartTime:Number;
        protected var debugEnabled:Boolean = false;

        public function SVGViewerWeb():void {

            this.setupJavaScriptInterface();
            this.addEventListener(Event.ADDED_TO_STAGE, onAddedToStage);
            super();
        }

        protected function onAddedToStage(event:Event = null):void {
            this.removeEventListener(Event.ADDED_TO_STAGE, onAddedToStage);

            this.stage.align = StageAlign.TOP_LEFT;
            this.stage.scaleMode = StageScaleMode.NO_SCALE;

            this.processHTMLParameters();
        }


        /**
         * process html <object> parameters
         **/
        protected function processHTMLParameters():void {
            var paramsObj:Object = LoaderInfo(this.root.loaderInfo).parameters;
            var svgURLParam:String = "";
            var sourceTypeParam:String = "";
            var item:String;

            for (item in paramsObj) {
                if (item == "scaleMode") {
                    this.scaleModeParam = paramsObj[item];
                }
                if (item == "sourceType") {
                    sourceTypeParam = paramsObj[item];
                }
                if (item == "svgURL") {
                    svgURLParam = paramsObj[item];
                }
                if (item == "svgId") {
                    this.svgIdParam = paramsObj[item];
                }
            }

            if (sourceTypeParam == 'url_svg') {
                this.loadURL(svgURLParam);
            }
            if (sourceTypeParam == 'url_script') {
                this.loadHTMLURL(svgURLParam);
            }

            if (sourceTypeParam == "inline_script") {
                this.debug("Inline URL parameter specified: " + svgURLParam);
                this.debug("The SWF file URL is: " + this.root.loaderInfo.loaderURL);
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
                if (this.root.loaderInfo.loaderURL.substring(0,4) == "file") {
                    this.debug("Local file, so javascript is not available or in charge.");
                    this.debug("Need to use URLRequest to load the file.");
                    this.loadHTMLURL(svgURLParam);
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
                var debugstr:String = "Security Error on ExternalInterface.call(...). ";
                if (this.root.loaderInfo.loaderURL.substring(0,4) == "file") {
                    debugstr += "This is expected when loaded from a local file.";
                }
                this.debug(debugstr);
            }
        }


        /**
         * Load methods.
         **/

        override protected function onComplete(event:Event):void {
            this.setSVGString(urlLoader.data);
            urlLoader = null;
        }

        public function loadHTMLURL(url:String):void {
            urlLoader = new URLLoader();
            urlLoader.load(new URLRequest(url));
            urlLoader.addEventListener(Event.COMPLETE, onHTMLComplete);
            urlLoader.addEventListener(IOErrorEvent.IO_ERROR, onIOError);
            urlLoader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, onSecurityError);
        }

        public function onHTMLComplete(event : Event):void {
            var svgString:String="";
            var svgCopying:Boolean=false;
            var svgStartString1:String= 'id="'+this.svgIdParam+'"';
            var svgStartString2:String= "id='"+this.svgIdParam+"'";
            var svgEndString:String="</svg>";

            var html:String = urlLoader.data;
            html = html.replace('\\n', '\\\\n');
            var htmlStrings:Object = html.split('\n');
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
            this.setSVGString(svgString);
        }

        protected function setSVGString(xmlString:String) {
            this.renderStartTime =  (new Date()).valueOf();
            this.js_savedXML = xmlString;
            var dataXML:XML = new XML(SVGViewerWeb.expandEntities(xmlString));
            // Make sure there is an id to identify the root node, in order to support
            // javascript access to the documentElement.
            if (dataXML.@id == undefined) {
                dataXML.@id = "rand" + Math.random();
            }
            while(this.numChildren) {
                this.removeChildAt(0);
            }
            svgRoot = new SVGSVGNode(null, dataXML);
            this.addChild(svgRoot);
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


        /**
         * JavaScript interface setup
         **/
        protected function setupJavaScriptInterface():void {
            var paramsObj:Object = LoaderInfo(this.root.loaderInfo).parameters;
            // process the parameters to get the unique id
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

            var outerthis:SVGViewerWeb = this;
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
            try {
                ExternalInterface.addCallback("sendToFlash", js_receiveFromBrowser);
            }
            catch(error:SecurityError) {
                var debugstr:String = "Security Error on ExternalInterface.addCallback(...). ";
                if (this.root.loaderInfo.loaderURL.substring(0,4) == "file") {
                    debugstr += "This is expected when loaded from a local file.";
                }
                this.debug(debugstr);
            }
        }


        /**
         * Event handlers from SVG Nodes
         **/
        override public function handleOnLoad():void {
            this.debug("render time: " + ( (new Date()).valueOf()  - this.renderStartTime) + "ms");
            var onLoadHandler:String = '';
            if (this.svgRoot.xml.@onload) {
                onLoadHandler = this.svgRoot.xml.@onload;
            }
            try {
                ExternalInterface.call("receiveFromFlash", { type: 'event',
                                                             eventType: "onLoad",
                                                             width: this.svgRoot.getWidth(),
                                                             height: this.svgRoot.getHeight(),
                                                             uniqueId: this.js_uniqueId,
                                                             onLoad: onLoadHandler } );
            }
            catch(error:SecurityError) {
            }
        }

        override public function handleScript(script:String):void {

            if (!this.scriptSentToJS) {           
                script = script.split('\\n').join(';_SVGNL_;');
                script = script.replace(/<script.*/, '');
                script = script.replace(/<svg:script.*/, '');
                script = script.replace(/]].*$/, '');
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
         * JavaScript interface handlers
         **/
        public function js_handleLoad(jsMsg:Object):Object {
            if (jsMsg.sourceType == 'string') {
                this.setSVGString(jsMsg.svgString);
            }
            if (jsMsg.sourceType == 'url_svg') {
                this.loadURL(jsMsg.svgURL);
            }
            return jsMsg;
        }

        public function js_handleInvoke(jsMsg:Object):Object {
            var element:SVGNode;
            if (jsMsg.method == 'createElementNS') {
                var xmlString:String = '<' + jsMsg.elementType + ' id="' + jsMsg.elementId +  '" />';
                var childXML:XML = new XML(xmlString);
                this.js_createdElements[jsMsg.elementId] = this.svgRoot.parseNode(childXML);
            }
            if (jsMsg.method == 'createTextNode') {
                this.js_createdTextNodes[jsMsg.elementId] = new XMLNode(XMLNodeType.TEXT_NODE, jsMsg.text);
            }
            if (jsMsg.method == 'getElementById') {
                if (typeof(this.js_createdElements[jsMsg.elementId]) != "undefined") {
                    return jsMsg;
                }
                if (!this.svgRoot.getNode(jsMsg.elementId)) {
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
                    element = this.svgRoot.getNode(jsMsg.elementId);
                }
                if (element) {
                    if (jsMsg.eventType == 'mouseup') {
                        element.addEventListener(MouseEvent.MOUSE_UP, handleAction);
                    }
                    if (jsMsg.eventType == 'mousedown') {
                        element.addEventListener(MouseEvent.MOUSE_DOWN, handleAction);
                    }
                    if (jsMsg.eventType == 'mousemove') {
                        element.addEventListener(MouseEvent.MOUSE_MOVE, handleAction);
                    }
                    if (jsMsg.eventType == 'mouseover') {
                        element.addEventListener(MouseEvent.MOUSE_OVER, handleAction);
                    }
                    if (jsMsg.eventType == 'mouseout') {
                        element.addEventListener(MouseEvent.MOUSE_OUT, handleAction);
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
                    element = this.svgRoot.getNode(jsMsg.elementId);
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
                        childNode = this.svgRoot.getNode(jsMsg.childId);
                    }
                    if (element && childNode)  {
                        SVGNode.addSVGChild(element.drawSprite, childNode);
                    }
                }
            }
            if (jsMsg.method == 'getRoot') {
                if (this.svgRoot.xml.@id) {
                    jsMsg.elementId = this.svgRoot.xml.@id.toString();
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
                    element = this.svgRoot.getNode(jsMsg.elementId);
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
                    element = this.svgRoot.getNode(jsMsg.elementId);
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

        override public function addActionListener(eventType:String, target:Sprite):void {
            target.addEventListener(eventType, handleAction);
        } 

        override public function removeActionListener(eventType:String, target:Sprite):void {
            target.removeEventListener(eventType, handleAction);
        }

        protected function handleAction(event:Event):void {

            switch(event.type) {
                case MouseEvent.CLICK:
                case MouseEvent.MOUSE_DOWN:
                case MouseEvent.MOUSE_MOVE:
                case MouseEvent.MOUSE_OUT:
                case MouseEvent.MOUSE_OVER:
                case MouseEvent.MOUSE_UP:
                    js_sendMouseEvent(MouseEvent(event));
                    break;

                default:
                    trace("handleAction: Event not found");
            }
        }

        // xxx requires id on targets
        public function js_sendMouseEvent(event:MouseEvent):void {
            try {
                if (   ( event.target is DisplayObject ) 
                    && ( event.currentTarget is DisplayObject ) 
                    && ( SVGNode.targetToSVGNode(DisplayObject(event.target)) != null)
                    && ( SVGNode.targetToSVGNode(DisplayObject(event.currentTarget)) != null) ) {
                    ExternalInterface.call("receiveFromFlash",
                       { type: 'event',
                         uniqueId: this.js_uniqueId,
                         targetId: SVGNode.targetToSVGNode(DisplayObject(event.target)).id,
                         currentTargetId: SVGNode.targetToSVGNode(DisplayObject(event.currentTarget)).id,
                         eventType: event.type.toLowerCase(),
                         clientX: event.localX,
                         clientY: event.localY,
                         screenX: event.stageX,
                         screenY: event.stageY
                       } );
                }
            }
            catch(error:SecurityError) {
            }
        }

        /*
           The width and height that is used is the size of the coordinate space that
           flash is using for scaling. The coordinate space comes from the SWF directive
           (2048 x 1024) at the top of this file. However, if the scaleModeParam is
           showAll_svg, then we use flash noScale mode and the size of the coordinate space
           is the size of the flash object.
        */
        override public function getWidth():Number {
            if (this.scaleModeParam == "showAll_svg") {
                return this.stage.stageWidth;
            }
            else {
                return 2048.0
            }
        }

        override public function getHeight():Number {
            if (this.scaleModeParam == "showAll_svg") {
                return this.stage.stageHeight;
            }
            else {
                return 1024.0;
            }
        }

        override public function debug(debugMessage:String):void {
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

    }
}
