/*
 Copyright (c) 2009 by contributors:

 * James Hight (http://labs.zavoo.com/)
 * Richard R. Masters
 * Google Inc. (Brad Neuberg - http://codinginparadise.org)

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


package org.svgweb
{    
    import org.svgweb.core.SVGNode;
    import org.svgweb.core.SVGViewer;
    import org.svgweb.nodes.SVGSVGNode;
    import org.svgweb.nodes.SVGGroupNode;
    import org.svgweb.nodes.SVGDOMTextNode;
    import org.svgweb.events.SVGEvent;
    import org.svgweb.utils.SVGUnits;
    
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
    import flash.utils.setTimeout;
    import flash.xml.XMLNode;
    import flash.xml.XMLNodeType;

    [SWF(frameRate="40", width="2048", height="1024")]
    /**
     * Web container for the SVG Renderer
     **/
    public class SVGViewerWeb extends SVGViewer
    {
        private var js_handler:String = '';
        private var js_uniqueId:String = '';
        private var js_guidLookup:Object = {};
        protected var svgIdParam:String = "";
        public var scaleModeParam:String = "showAll_svg";
        protected var scriptSentToJS:Boolean = false;

        protected var renderStartTime:Number;
        protected var debugEnabled:Boolean = true;
        
        protected var objectWidth:Number;
        protected var objectHeight:Number;

        public function SVGViewerWeb():void {
            this.setupJavaScriptInterface();
            //this.debug('SVGViewerWeb constructor');
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

            // notify browser javascript that we are loaded
            try {
                var result:Object = ExternalInterface.call(
                    this.js_handler + "onMessage", 
                    { type: 'event', eventType: 'onFlashLoaded', uniqueId: this.js_uniqueId } );
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

        protected function setSVGString(xmlString:String, objectURL:String = '', pageURL:String = ''):void {
            this.renderStartTime = (new Date()).valueOf();
            var dataXML:XML = new XML(SVGViewerWeb.expandEntities(xmlString));
            while(this.numChildren) {
                this.removeChildAt(0);
            }
            svgRoot = new SVGSVGNode(null, dataXML, null, objectURL, pageURL);
            if (   (xmlString.indexOf("<animate") != -1)
                || (xmlString.indexOf("<set") != -1) ) {
                svgRoot.visible = false;
            }
            this.addActionListener(SVGEvent.SVGLoad, svgRoot);
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
                    this.js_handler = 'svgweb.handlers["' + this.js_uniqueId 
                                    + '"].';
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
        protected function handleRootSVGLoad():void {
            this.debug("render time for " + this.js_uniqueId + ": " + ( (new Date()).valueOf()  - this.renderStartTime) + "ms");           

            // FIXME: Hack. If we are hidden due to the presence of animations,
            // then we do not unhide until 200ms into the document time. This
            // provides enough time for the first frame of rendering caused
            // by animations to occur. Currently, the entire tree is first
            // parsed and progressively rendered, without animation effects,
            // because animations may not be parsed yet. Once animations are
            // parsed, they cause new frames to be rendered. These frames
            // should be rendered before anything is visible. Since it is
            // difficult to determine exactly when these  frames have rendered,
            // we just wait a "long time".
            // A better solution than the 200ms delay is to figure out all the
            // elements that should be rendered with animation effects at frame
            // zero, and unhide exactly when all of these elements have
            // completed rendering initially with animation effects.
            // We would start that tracking here, because the SVGLoad event
            // signals the end of parsing.
            setTimeout(function ():void { svgRoot.visible = true }, 200); 
     
            var onLoadHandler:String = '';
            if (this.svgRoot.xml.@onload) {
                onLoadHandler = this.svgRoot.xml.@onload;
            }
            try {
                ExternalInterface.call(this.js_handler + "onMessage",  
                                                           { type: 'event',
                                                             eventType: "onRenderingFinished",
                                                             width: this.svgRoot.getWidth(),
                                                             height: this.svgRoot.getHeight(),
                                                             uniqueId: this.js_uniqueId,
                                                             onLoad: onLoadHandler } );
            }
            catch(error:SecurityError) {
            }
        }

        override public function handleScript(script:String):void {
            // TODO: FIXME: Scripts should be batched up in the order they
            // are in the document and sent over all at once. This will become
            // more important as we support external scripts which load
            // asynchronously; we don't want these to arrive at different times
            // and get executed in the wrong order.
            if (!this.scriptSentToJS) {
                // strip off starting SCRIPT cruft; example: <script><![CDATA
                script = script.replace(/<[A-Za-z\-_0-9]*:?script[^>]*>(<\!\[CDATA\[)?/, '');
                // strip off ending SCRIPT scruft; example: ]]></svg:script>
                script = script.replace(/(]]>)?<\/[A-Za-z\-_0-9]*:?script>$/, '');
                
                try {
                    ExternalInterface.call(this.js_handler + "onMessage",  
                                                               { type: 'script',
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
            //this.debug('js_handleLoad, msg='+this.debugMsg(jsMsg));
            if (jsMsg.sourceType == 'string') {
                // see if an explicit width and height were set external
                // to us on an SVG OBJECT; this helps us with viewBox
                // calculations
                if (jsMsg.objectWidth) {
                    this.objectWidth = SVGUnits.cleanNumber(jsMsg.objectWidth);
                }
                if (jsMsg.objectHeight) {
                    this.objectHeight = SVGUnits.cleanNumber(jsMsg.objectHeight);
                }
                
                var svgString:String = this.decodeFlashData(jsMsg.svgString);
                
                this.setSVGString(svgString, jsMsg.objectURL, jsMsg.pageURL);
            }
            if (jsMsg.sourceType == 'url_svg') {
                this.loadURL(jsMsg.svgURL);
            }
            return jsMsg;
        }

        public function js_handleInvoke(jsMsg:Object):Object {
            //this.debug('js_handleInvoke, jsMsg='+this.debugMsg(jsMsg));
            var element:SVGNode, parent:SVGNode;
            
            try {
                if (jsMsg.method == 'addEventListener') {
                    // Get the element to add the event listener to
                    element = this.svgRoot.getNodeByGUID(jsMsg.elementGUID);

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
                        this.error("addEventListener: GUID not found: " 
                                   + jsMsg.elementGUID);
                    }
                }
                if (jsMsg.method == 'appendChild') {
                    // Get the parent node
                    parent = this.svgRoot.getNodeByGUID(jsMsg.parentGUID);
                    if (!parent) {
                        this.error('appendChild: parent with GUID '
                                   + jsMsg.parentGUID + ' not found');
                    }
                    
                    // parse the newly appended element into an SVGNode and 
                    // all of its children as well
                    element = parent.parseNode(new XML(decodeFlashData(jsMsg.childXML)));
                    element.forceParse();
                    
                    // now actually append the element to our display
                    parent.appendSVGChild(element);
                }
                if (jsMsg.method == 'addChildAt') {
                    // Get the parent
                    parent = this.svgRoot.getNodeByGUID(jsMsg.parentGUID);
                    
                    if (!parent) {
                        this.error('addChildAt: parent with GUID '
                                   + jsMsg.parentGUID + ' not found');
                    }
                    
                    // parse the newly appended element into an SVGNode and 
                    // all of its children as well
                    element = parent.parseNode(new XML(decodeFlashData(jsMsg.childXML)));
                    element.forceParse();
                    
                    // append things now
                    parent.addSVGChildAt(element, jsMsg.position);
                    parent.invalidateDisplay();
                }
                if (jsMsg.method == 'getAttribute') {
                    element = this.svgRoot.getNodeByGUID(jsMsg.elementGUID);

                    if (!element) {
                        this.error('getAttribute: GUID not found: '
                                   + jsMsg.elementGUID);
                    }
                    
                    var applyAnimations:Boolean = false;
                    if (jsMsg.applyAnimations !== undefined) {
                        applyAnimations = jsMsg.applyAnimations;
                    }
                    
                    var attrValue:String = element.xml.@[jsMsg.attrName]; 
                    if (typeof(attrValue) != 'undefined' && attrValue != null) {
                        if (jsMsg.getFromStyle) {
                            jsMsg.attrValue = element.getStyle(jsMsg.attrName, null, false);
                            
                            // Firefox and Safari both return '' for
                            // default inherited styles (i.e. if I check
                            // someNode.style.display, I get an empty string
                            // rather than 'inline'), so only get 
                            // explicitly set styles on this node
                            if (jsMsg.attrValue == null) {
                                jsMsg.attrValue = '';
                            }
                        }
                        else {
                            jsMsg.attrValue = element.getAttribute(jsMsg.attrName, null, 
                                                                   false, applyAnimations, false);
                        }
                    }
                    else {
                        this.error("error:getAttribute: attrName not found: " + jsMsg.attrName);
                    }
                }
                if (jsMsg.method == 'setAttribute') {
                    element = this.svgRoot.getNodeByGUID(jsMsg.elementGUID);
                    if (!element) {
                        this.error('setAttribute: GUID not found: '
                                   + jsMsg.elementGUID);
                    }
                    
                    var attrName:String = jsMsg.attrName;
                    attrValue = decodeFlashData(jsMsg.attrValue);
                    
                    if (attrName == 'id') {
                        this.svgRoot.unregisterID(element);
                    }
 
                    if (jsMsg.applyToStyle) {
                        element.setStyle(attrName, attrValue);
                    }
                    else if (jsMsg.attrNamespace != null) {
                        // namespaced attribute, such as xlink:href
                        var ns:Namespace = new Namespace(jsMsg.attrNamespace);
                        element.xml.@ns::[attrName] = attrValue.toString();
                    } else {
                        element.setAttribute(attrName, attrValue.toString());
                    }

                    if (attrName == 'id') {
                        this.svgRoot.registerID(element);
                    }
                }
                if (jsMsg.method == 'removeChild') {
                    // Removes the element
                    element = this.svgRoot.getNodeByGUID(jsMsg.elementGUID);                    
                    if (!element) {
                        this.error('removeChild: GUID not found: '
                                   + jsMsg.elementGUID);
                    }
                    
                    element.getSVGParent().removeSVGChild(element);
                }
                if (jsMsg.method == 'insertBefore') {
                    // Inserts newChild before refChild
                    
                    // TODO: Test this to see if its working correctly with
                    // XML Mixed Content (i.e. content of the form 
                    // TEXT<element>foo</element>TEXT)
                
                    // get the refChild and the parent
                    var refChild:SVGNode;
                    
                    refChild = this.svgRoot.getNodeByGUID(jsMsg.refChildGUID);
                    if (!refChild) {
                        this.error("error:insertBefore: refChildGUID not found: " + jsMsg.refChildGUID);
                    }
                    
                    parent = this.svgRoot.getNodeByGUID(jsMsg.parentGUID);
                    if (!parent) {
                        this.error("error:insertBefore: parentGUID not found: " + jsMsg.parentGUID);
                    }
                    
                    // parse the newly appended element into an SVGNode and 
                    // all of its children as well
                    element = parent.parseNode(new XML(decodeFlashData(jsMsg.childXML)));
                    element.forceParse();

                    // now insert the element
                    parent.insertSVGBefore(jsMsg.position, element, refChild);
                }
                if (jsMsg.method == 'setText') {
                    // Get the parent
                    parent = this.svgRoot.getNodeByGUID(jsMsg.parentGUID);
                    if (!parent) {
                        this.error("error:setText: parent with GUID not found: " + jsMsg.parentGUID);
                    }
                    
                    // Get the fake text node element
                    element = this.svgRoot.getNodeByGUID(jsMsg.elementGUID);
                    if (!element) {
                        this.error("error:setText: element with GUID not found: " + jsMsg.elementGUID);
                    }
                    
                    var textNode:SVGDOMTextNode = element as SVGDOMTextNode;
                    textNode.nodeValue = decodeFlashData(jsMsg.text);
                    
                    // Tell its parent that its text value has changed
                    if (parent.hasText()) {
                        parent.setText(decodeFlashData(jsMsg.text));
                        parent.invalidateDisplay();
                    }
                }
            } catch (err:Error) {
                this.error("error:" + err);
                throw err;
            }
            
            //this.debug('Returning jsMsg='+this.debugMsg(jsMsg));
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
                case SVGEvent.SVGLoad:
                    handleRootSVGLoad();
                    break;
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

        public function js_sendMouseEvent(event:MouseEvent):void {
            try {
                if (   ( event.target is DisplayObject ) 
                    && ( event.currentTarget is DisplayObject ) 
                    && ( SVGNode.targetToSVGNode(DisplayObject(event.target)) != null)
                    && ( SVGNode.targetToSVGNode(DisplayObject(event.currentTarget)) != null) ) { 
                    
                    ExternalInterface.call(this.js_handler + "onMessage",
                       { type: 'event',
                         uniqueId: this.js_uniqueId,
                         targetGUID: SVGNode.targetToSVGNode(DisplayObject(event.target)).guid,
                         currentTargetGUID: SVGNode.targetToSVGNode(DisplayObject(event.currentTarget)).guid,
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
            // an explicit width was passed in
            if (this.objectWidth) {
                return this.objectWidth;
            }
            else if (this.scaleModeParam == "showAll_svg") {
                return this.stage.stageWidth;
            }
            else {
                return 2048.0;
            }
        }

        override public function getHeight():Number {
            // an explicit height was passed in
            if (this.objectHeight) {
                return this.objectHeight;
            }
            else if (this.scaleModeParam == "showAll_svg") {
                return this.stage.stageHeight;
            }
            else {
                return 1024.0;
            }
        }

        override public function debug(debugMessage:String):void {
            if (this.debugEnabled) {            
                try {
                    ExternalInterface.call(this.js_handler + 'onMessage', 
                                           { type: 'log',
                                             uniqueId: this.js_uniqueId,
                                             logString: debugMessage
                                            } );
                }
                catch(error:SecurityError) {
                }
            }
        }
        
        override public function error(message:String):void {
            if (this.debugEnabled) {            
                try {
                    ExternalInterface.call(this.js_handler + 'onMessage', 
                                           { type: 'error',
                                             uniqueId: this.js_uniqueId,
                                             logString: message
                                            } );
                }
                catch(error:SecurityError) {
                }
            }
        }
        
        /**
            Stringifies the msg object sent back from the Flash SVG renderer
            to help with debugging.
        */
        public function debugMsg(msg:Object):String {
            if (this.debugEnabled) {
                var result:Array = [];
                for (var i:* in msg) {
                    result.push(i + ': ' + msg[i]);
                }
                return '{' + result.join(', ') + '}';
            } else {
                return null;
            }
        }
        
        /** Flash has a bug over the Flash/JS boundry where ampersands
            get corrupted, such as in entities like &quot; 
            As a workaround we turned ampersands into the temporary
            token __SVG__AMPERSAND before sending it over to Flash. */
        protected function decodeFlashData(str:String):String {
            if (str === null) {
                return str;
            }
            
            return str.replace(/__SVG__AMPERSAND/g, '&');
        }
    }
}
