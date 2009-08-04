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
        
        // The delimiter we use when passing arguments between Flash and
        // JavaScript; performance testing showed this to be an important
        // bottleneck, so we do various tricks to make it fast
        protected var DELIMITER:String = '__SVG__DELIMIT';

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

            // notify browser javascript that we are loaded
            try {
                var result:Object = ExternalInterface.call(
                                            this.js_handler + "onMessage",
                                            this.msgToString( 
                                                        { type: 'event', 
                                                          eventType: 'onFlashLoaded', 
                                                          uniqueId: this.js_uniqueId 
                                                        } 
                                            ));
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

        protected function setSVGString(xmlString:String, objectURL:String = '', pageURL:String = '',
                                        ignoreWhiteSpace:Boolean = false):void {
            // FIXME: TODO: Respect the ignoreWhiteSpace setting
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

            try {
                // Performance testing found that Flash/JS communication is a
                // primary bottleneck; two things were found to make this
                // faster when calling from JS to Flash: 
                // 1) pass giant strings instead of complex objects
                // over the boundry, and 2) minimize our own custom
                // marshaling code on both sides. Having separate methods for
                // each exposed method makes our marshaling code much simpler,
                // aiding performance.
                // When calling from Flash back to JS, we turn all things
                // into Strings instead of Objects as well; however, we 
                // route everything on that side through an onMessage() method
                // on the JS side since we found we don't need to optimize that
                // into separate methods yet.
                ExternalInterface.addCallback("jsHandleLoad", js_handleLoad);
                ExternalInterface.addCallback("jsInsertBefore", js_insertBefore);
                ExternalInterface.addCallback("jsAddChildAt", js_addChildAt);
                ExternalInterface.addCallback("jsRemoveChild", js_removeChild);
                ExternalInterface.addCallback("jsAddEventListener", js_addEventListener);
                ExternalInterface.addCallback("jsSetText", js_setText);
                ExternalInterface.addCallback("jsSetAttribute", js_setAttribute);
                ExternalInterface.addCallback("jsGetAttribute", js_getAttribute);
                ExternalInterface.addCallback("jsAppendChild", js_appendChild);
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
         * Stringifies the object we send back and forth between Flash and JavaScript.
         * Performance testing found that sending strings between Flash and JS is
         * about twice as fast as sending objects.
         **/
        protected function msgToString(msg:Object):String {
            var result:Array = [];
            for (var i:String in msg) {
                result.push(i + ':' + msg[i]);
            }

            // we use a custom delimiter (__SVG__DELIMIT) instead of commas, since 
            // the message might have an XML payload or commas already
            return result.join('__SVG__DELIMIT');
        }

        /**
         * Event handlers from SVG Nodes
         **/
        protected function handleRootSVGLoad():void {
            //this.debug("render time for " + this.js_uniqueId + ": " + ( (new Date()).valueOf()  - this.renderStartTime) + "ms");           

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
                                       this.msgToString(
                                            { type: 'event',
                                              eventType: "onRenderingFinished",
                                              width: this.svgRoot.getWidth(),
                                              height: this.svgRoot.getHeight(),
                                              uniqueId: this.js_uniqueId,
                                              onLoad: onLoadHandler 
                                            }
                                        ));
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
                                           this.msgToString(
                                                         { type: 'script',
                                                           uniqueId: this.js_uniqueId,
                                                           script: script 
                                                         } 
                                           ));
                }
                catch(error:SecurityError) {
                }
                this.scriptSentToJS=true;
            }
        }

        /**
         * JavaScript interface handlers
         **/
        public function js_handleLoad(msg:String):void {
            // msg is a string delimited by __SVG__DELIMIT with fields in
            // the following order: objectURL, pageURL, objectWidth, 
            // objectHeight, ignoreWhiteSpace (boolean), svgString
            var args:Array = msg.split(DELIMITER);
            var objectURL:String = args[0];
            var pageURL:String = args[1];
            // Flash/JS bridge transforms nulls/undefined into '' empty strings
            var objectWidth:String = (args[2] !== '') ? args[2] : null;
            var objectHeight:String = (args[3] !== '') ? args[3] : null;
            var ignoreWhiteSpace:Boolean = (args[4] === 'true') ? true : false;
            var svgString:String = this.decodeFlashData(args[5]);
                        
            // see if an explicit width and height were set external
            // to us on an SVG OBJECT; this helps us with viewBox
            // calculations
            if (objectWidth !== null) {
                this.objectWidth = SVGUnits.cleanNumber(objectWidth);
            }
            if (objectHeight !== null) {
                this.objectHeight = SVGUnits.cleanNumber(objectHeight);
            }
            
            this.setSVGString(svgString, objectURL, pageURL, ignoreWhiteSpace);
        }
        
        public function js_removeChild(msg:String):void {
            // msg has one argument, the elementGUID
            var elementGUID:String = msg;
            
            // Removes the element
            var element:SVGNode = this.svgRoot.getNodeByGUID(elementGUID);                    
            if (!element) {
                this.error('removeChild: GUID not found: '
                           + elementGUID);
            }
            
            element.getSVGParent().removeSVGChild(element);
        }
        
        public function js_addChildAt(msg:String):void {
            // msg is a string delimited by __SVG__DELIMIT with fields in
            // the following order: parentGUID, position, childXML
            var args:Array = msg.split(DELIMITER);
            var parentGUID:String = args[0];
            var position:Number = new Number(args[1]);
            var childXML:String = args[2];
            
            // Get the parent
            var parent:SVGNode = this.svgRoot.getNodeByGUID(parentGUID);
            
            if (!parent) {
                this.error('addChildAt: parent with GUID '
                           + parentGUID + ' not found');
            }
            
            // parse the newly appended element into an SVGNode and 
            // all of its children as well
            var element:SVGNode = parent.parseNode(new XML(decodeFlashData(childXML)));
            element.forceParse();
            
            // append things now
            parent.addSVGChildAt(element, position);
            parent.invalidateDisplay();
        }
        
        public function js_insertBefore(msg:String):void {
            // msg is a string delimited by __SVG__DELIMIT with fields in
            // the following order: refChildGUID, parentGUID, position,
            // childXML
            var args:Array = msg.split(DELIMITER);
            var refChildGUID:String = args[0];
            var parentGUID:String = args[1];
            var position:Number = new Number(args[2]);
            var childXML:String = args[3];
            
            // Inserts newChild before refChild
            
            // TODO: Test this to see if its working correctly with
            // XML Mixed Content (i.e. content of the form 
            // TEXT<element>foo</element>TEXT)
        
            // get the refChild and the parent
            var refChild:SVGNode = this.svgRoot.getNodeByGUID(refChildGUID);
            if (!refChild) {
                this.error("error:insertBefore: refChildGUID not found: " + refChildGUID);
            }
            
            var parent:SVGNode = this.svgRoot.getNodeByGUID(parentGUID);
            if (!parent) {
                this.error("error:insertBefore: parentGUID not found: " + parentGUID);
            }
            
            // parse the newly appended element into an SVGNode and 
            // all of its children as well
            var element:SVGNode = parent.parseNode(new XML(decodeFlashData(childXML)));
            element.forceParse();

            // now insert the element
            parent.insertSVGBefore(position, element, refChild);
        }
        
        public function js_setAttribute(msg:String):void {
            // msg is a string delimited by __SVG__DELIMIT with fields in
            // the following order: elementGUID, applyToStyle (boolean), 
            // attrNamespace, attrName, attrValue
            var args:Array = msg.split(DELIMITER);
            var elementGUID:String = args[0];
            var applyToStyle:Boolean = (args[1] === 'true') ? true : false;
            // Flash/JS bridge transforms nulls/undefined into '' empty strings
            var attrNamespace:String = (args[2] !== '') ? args[2] : null;
            var attrName:String = args[3];
            var attrValue:String = decodeFlashData(args[4]);
            
            var element:SVGNode = this.svgRoot.getNodeByGUID(elementGUID);
            if (!element) {
                this.error('setAttribute: GUID not found: ' + elementGUID);
            }

            if (attrName == 'id') {
                this.svgRoot.unregisterID(element);
            }

            if (applyToStyle) {
                element.setStyle(attrName, attrValue);
            }
            else if (attrNamespace != null) {
                // namespaced attribute, such as xlink:href
                var ns:Namespace = new Namespace(attrNamespace);
                element.xml.@ns::[attrName] = attrValue.toString();
            } else {
                element.setAttribute(attrName, attrValue.toString());
            }

            if (attrName == 'id') {
                this.svgRoot.registerID(element);
            }
        }
        
        public function js_addEventListener(msg:String):void {
            // msg is a string delimited by __SVG__DELIMIT with fields in
            // the following order: elementGUID, eventType
            var args:Array = msg.split(DELIMITER);
            var elementGUID:String = args[0];
            var eventType:String = args[1];
            
            // Get the element to add the event listener to
            var element:SVGNode = this.svgRoot.getNodeByGUID(elementGUID);

            if (element) {
                if (eventType == 'mouseup') {
                    element.addEventListener(MouseEvent.MOUSE_UP, handleAction);
                }
                if (eventType == 'mousedown') {
                    element.addEventListener(MouseEvent.MOUSE_DOWN, handleAction);
                }
                if (eventType == 'mousemove') {
                    element.addEventListener(MouseEvent.MOUSE_MOVE, handleAction);
                }
                if (eventType == 'mouseover') {
                    element.addEventListener(MouseEvent.MOUSE_OVER, handleAction);
                }
                if (eventType == 'mouseout') {
                    element.addEventListener(MouseEvent.MOUSE_OUT, handleAction);
                }
            }
            else {
                this.error("addEventListener: GUID not found: " 
                           + elementGUID);
            }
        }
        
        public function js_setText(msg:String):void {
            // msg is a string delimited by __SVG__DELIMIT with fields in
            // the following order: parentGUID, elementGUID, text
            var args:Array = msg.split(DELIMITER);
            var parentGUID:String = args[0];
            var elementGUID:String = args[1];
            var textValue:String = decodeFlashData(args[2]);
            
            // Get the parent
            var parent:SVGNode = this.svgRoot.getNodeByGUID(parentGUID);
            if (!parent) {
                this.error("error:setText: parent with GUID not found: " + parentGUID);
            }
            
            // Get the fake text node element
            var element:SVGNode = this.svgRoot.getNodeByGUID(elementGUID);
            if (!element) {
                this.error("error:setText: element with GUID not found: " + elementGUID);
            }
            
            var textNode:SVGDOMTextNode = element as SVGDOMTextNode;
            textNode.nodeValue = textValue;
            
            // Tell its parent that its text value has changed
            if (parent.hasText()) {
                parent.setText(textValue);
                parent.invalidateDisplay();
            }
        }
        
        public function js_appendChild(msg:String):void {
            // msg is a string delimited by __SVG__DELIMIT with fields in
            // the following order: parentGUID, childXML
            var args:Array = msg.split(DELIMITER);
            var parentGUID:String = args[0];
            var childXML:String = decodeFlashData(args[1]);
            
            // Get the parent node
            var parent:SVGNode = this.svgRoot.getNodeByGUID(parentGUID);
            if (!parent) {
                this.error('appendChild: parent with GUID '
                           + parentGUID + ' not found');
            }
            
            // parse the newly appended element into an SVGNode and 
            // all of its children as well
            var element:SVGNode = parent.parseNode(new XML(childXML));
            element.forceParse();
            
            // now actually append the element to our display
            parent.appendSVGChild(element);
        }
        
        public function js_getAttribute(msg:String):String {
            // msg is a string delimited by __SVG__DELIMIT with fields in
            // the following order: elementGUID, getFromStyle (boolean),
            // applyAnimations (boolean), attrNamespace, attrName
            var args:Array = msg.split(DELIMITER);
            var elementGUID:String = args[0];
            var getFromStyle:Boolean = (args[1] === 'true') ? true : false;
            var applyAnimations:Boolean = (args[2] === 'true') ? true : false;
            // Flash/JS bridge transforms nulls/undefined into '' empty strings
            var attrNamespace:String = (args[3] !== '') ? args[2] : null;
            var attrName:String = args[4];
            
            var element:SVGNode = this.svgRoot.getNodeByGUID(elementGUID);
            if (!element) {
                this.error('getAttribute: GUID not found: '
                           + elementGUID);
            }

            // FIXME: TODO: Make sure we can get namespaced attribute values
            var attrValue:String = element.xml.@[attrName]; 
            if (typeof(attrValue) != 'undefined' && attrValue != null) {
                if (getFromStyle) {
                    attrValue = element.getStyle(attrName, null, false);
                    
                    // Firefox and Safari both return '' for
                    // default inherited styles (i.e. if I check
                    // someNode.style.display, I get an empty string
                    // rather than 'inline'), so only get 
                    // explicitly set styles on this node
                    if (attrValue == null) {
                        attrValue = '';
                    }
                }
                else {
                    attrValue = element.getAttribute(attrName, null, 
                                                     false, applyAnimations, false);
                }
            }
            else {
                this.error("error:getAttribute: attrName not found: " + attrName);
            }
            
            return attrValue;
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
                       this.msgToString(
                                   { type: 'event',
                                     uniqueId: this.js_uniqueId,
                                     targetGUID: SVGNode.targetToSVGNode(DisplayObject(event.target)).guid,
                                     currentTargetGUID: SVGNode.targetToSVGNode(DisplayObject(event.currentTarget)).guid,
                                     eventType: event.type.toLowerCase(),
                                     clientX: event.localX,
                                     clientY: event.localY,
                                     screenX: event.stageX,
                                     screenY: event.stageY
                                   } 
                        )
                    );
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
                                           this.msgToString(
                                               { type: 'log',
                                                 uniqueId: this.js_uniqueId,
                                                 logString: debugMessage
                                                } 
                                           ));
                }
                catch(error:SecurityError) {
                }
            }
        }
        
        override public function error(message:String):void {
            if (this.debugEnabled) {            
                try {
                    ExternalInterface.call(this.js_handler + 'onMessage',
                                           this.msgToString(
                                                   { type: 'error',
                                                     uniqueId: this.js_uniqueId,
                                                     logString: message
                                                    } 
                                           ));
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
