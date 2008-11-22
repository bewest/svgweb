/*
Copyright (c) 2008 James Hight
Copyright (c) 2008 Richard R. Masters, for his changes.

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

package com.zavoo.svg
{
    
    import com.zavoo.svg.nodes.SVGRoot;
    
    import flash.events.Event;
    import flash.geom.Transform;
    import flash.display.LoaderInfo;
    import flash.external.ExternalInterface;
    
    import mx.controls.TextArea;
    import flash.net.URLLoader;
    import flash.net.URLRequest;
    import mx.containers.Canvas;

    /**
     * Flex container for the SVG Renderer
     **/
    public class SVGViewerDebug extends Canvas
    {
        private var _xml:XML;
        private var _svgRoot:SVGRoot;
        private var html:String;
        private var inlineSVGURL:String = "";
        private var inlineSVGId:String = "";
        private var myXMLLoader:URLLoader= new URLLoader ();
        private var myHTMLLoader:URLLoader= new URLLoader ();
        public  var paramsObj:Object;
        private var debugText:TextArea = null;
        
        public function setDebugTextArea(debugText:TextArea):void {
            this.debugText = debugText;
        }
        public function debug(debugMessage:String):void {
            if (this.debugText != null) {
                this.debugText.text += (debugMessage + "\n");
            }
        }
        /**
         * @public
         **/
        public function xmlLoaded(event : Event):void {
           var dataXML:XML = new XML(event.target.data);
           this.xml = dataXML;
           // shift image down so we can see it
           if (this.debugText) {
                this._svgRoot.xml.@y='250';
           }
        }

        public function htmlLoaded(event : Event):void {
           this.html = event.target.data;
           var htmlStrings:Object = this.html.split('\n');
           var svgString:String="";
           var svgCopying:Boolean=false;
           var svgStartString:String= "<!--svgid:"+this.inlineSVGId;
           var svgEndString:String="<!--/svgid:"+this.inlineSVGId;
           for (var i:String in htmlStrings) {
               if (htmlStrings[i].substring(0, svgEndString.length) == svgEndString) {
                   this.debug("Found end of SVG.");
                   svgCopying=false;
               }
               if (svgCopying) {
                   svgString += (htmlStrings[i] + "\n");
               }
               if (htmlStrings[i].substring(0, svgStartString.length) == svgStartString) {
                   this.debug("Found start of SVG.");
                   svgCopying=true;
               }
           }
           var dataXML:XML = XML(svgString);
           this.xml = dataXML;
        }

        public function loadSVGURL(mySVGURL:String):void {
            this.debug("Doing loadSVGURL for this URL: " + mySVGURL);
            var myXMLURL : URLRequest = new URLRequest (mySVGURL);
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

        public function loadSVGId(inlineSVGURL:String, inlineSVGId:String):void {
            this.inlineSVGURL = inlineSVGURL;
            this.inlineSVGId = inlineSVGId;
        }

        private function addedToStage(event:Event = null):void {
            var outerthis:SVGViewerDebug = this;
            //this.debug("Got addedToStage event.");
            var myURL:String = this.root.loaderInfo.loaderURL;
            if (ExternalInterface.available) {
                this.debug("External interface may be available.");
                function js_createFromSVG(svg:String):void {
                    outerthis.debug("Received createFromSVG() call from javascript.");
                    var dataXML:XML = XML(svg);
                    outerthis.xml = dataXML;
                }
                function js_loadSVGURL(svg:String):void {
                    outerthis.debug("Received loadSVGURL() call from javascript.");
                    loadSVGURL(svg);
                }
                var debugstr:String;
                try {
                    ExternalInterface.addCallback("createFromSVG", js_createFromSVG);
                    ExternalInterface.addCallback("loadSVGURL", js_loadSVGURL);
                }
                catch(error:SecurityError) {
                    debugstr = "Security Error on ExternalInterface.addCallback(...). ";
                    if (myURL.substring(0,4) == "file") {
                        debugstr += "This is expected when loaded from a local file.";
                    }
                    this.debug(debugstr);
                }
                try {
                    var result:Object = ExternalInterface.call("receiveFromFlash", myURL);
                }
                catch(error:SecurityError) {
                    debugstr = "Security Error on ExternalInterface.call(...). ";
                    if (myURL.substring(0,4) == "file") {
                        debugstr += "This is expected when loaded from a local file.";
                    }
                    this.debug(debugstr);
                }
                if (this.inlineSVGURL != "") {
                    this.debug("Inline URL parameter specified: " + this.inlineSVGURL);
                    this.debug("The SWF file URL is: " + myURL);
                    /* If the swf url starts with "file" then we need to use the url retrieval
                       routines to get the entire html file and then get the svg element.
                       If the url is http, then javascript would be active and would pass in
                       svg text directly so there is no need to do this url retrieval here
                       in that case.
                    */
                    if (myURL.substring(0,4) == "file") {
                        this.debug("Local file, so javascript is not available or in charge.");
                        this.debug("Need to use URLRequest to load the file.");
                        var myHTMLURL : URLRequest = new URLRequest (this.inlineSVGURL);
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
                    else {
                        this.debug("Not a 'file://' type URL, so network and scripting should be");
                        this.debug("active, so assume javascript is in charge and do nothing.");
                    }
                }
            }
            else {
                this.debug("External interface not available.");
                this.debug("Assuming flashplayer debug mode. Loading default file.");
                loadSVGURL("scimitar.svg");
            }
        }

        public function SVGViewerDebug() {
            super();
            this.addEventListener(Event.ADDED_TO_STAGE, addedToStage);

            this._svgRoot = new SVGRoot(null);
            this._svgRoot.debug = this.debug;
            this._svgRoot.svgRoot = this._svgRoot;
            this.rawChildren.addChild(this._svgRoot);
            
            this._svgRoot.addEventListener(Event.RESIZE, sizeCanvas);

        }
        /**
         * @private
         **/
         private function sizeCanvas(event:Event = null):void {
             //Scale canvas to match size of  SVG
             if (this._svgRoot != null) {
                this.width = this._svgRoot.width;
                this.height = this._svgRoot.height;
             }
         }
        
        /**
         * @public
         **/
        public function set xml(value:XML):void {            
            this._svgRoot.xml = value;
            this.sizeCanvas();            
        }
        
        /**
         * SVG XML value
         **/
        public function get xml():XML {
            return this._svgRoot.xml
        }
        
        /**
         * @private
         **/
        public function set scale(scale:Number):void {
            this._svgRoot.scale = scale;
            this.sizeCanvas();             
        }
        
        /**
         * Set scaleX and scaleY at the same time
         **/
        public function get scale():Number {
            return this._svgRoot.scale;                
        }
        
        
        /**
         * @private
         **/
        override public function set scaleX(value:Number):void {
            this.scale = value;
        }
        
        override public function get scaleX():Number {
            return this._svgRoot.scaleX;
        }
        
        
        /**
         * @private
         **/
        override public function set scaleY(value:Number):void {
            this.scale = value;
        }
        
        override public function get scaleY():Number {
            return this._svgRoot.scaleY;
        }
        
        
        /**
         * @private
         **/
        override public function set rotation(value:Number):void {
            this._svgRoot.rotation = value;
            this.sizeCanvas();
        }
        
        override public function get rotation():Number {
            return this._svgRoot.rotation;
        }
        
        
        /**
         * @private
         **/
        override public function set transform(value:Transform):void {
            this._svgRoot.transform = value;
            this.sizeCanvas();
        }
        
        override public function get transform():Transform {
            return this._svgRoot.transform; 
        }
        
        
        /**
         * @private
         **/
        override public function set filters(value:Array):void {
            this._svgRoot.filters = value;
            this.sizeCanvas();
        }
        
        override public function get filters():Array {
            return this._svgRoot.filters;
        }
        
        /**
         * Title of SVG
         **/
        public function get title():String {
            return this._svgRoot.title;
        }
        
    }
}
