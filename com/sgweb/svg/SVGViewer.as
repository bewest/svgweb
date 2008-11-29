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

/*

SVGViewer is a flash sprite which is the parent for a tree of SVGNodes
which are sprites initialized from XML. The top most SVGNode is an SVGRoot.

The xml is parsed and xml children are walked when the object is rendered.
Child SVGNodes are added and when they are rendered, their xml is walked
and so on.

*/


package com.sgweb.svg
{
    
    import com.sgweb.svg.nodes.SVGRoot;
    
    import flash.events.Event;
    import flash.geom.Transform;
    import flash.geom.Matrix;
    import flash.display.LoaderInfo;
    import flash.external.ExternalInterface;
    
    import flash.net.URLLoader;
    import flash.net.URLRequest;
    import flash.display.Sprite;

    [SWF(frameRate="24", width="2048", height="1024")]
    /**
     * Flex container for the SVG Renderer
     **/
    public class SVGViewer extends Sprite
    {
        private var _xml:XML;
        private var _svgRoot:SVGRoot;
        private var html:String;
        private var js_uniqueId:String = "";
        private var myXMLLoader:URLLoader= new URLLoader ();
        private var myHTMLLoader:URLLoader= new URLLoader ();

        public  var paramsObj:Object;
        protected var sourceTypeParam:String = "";
        protected var svgURLParam:String = "";
        protected var svgIdParam:String = "";
        protected var scaleXParam:Number = 1.0;
        protected var scaleYParam:Number = 1.0;
        protected var debugEnabled:Boolean = false;


        public function SVGViewer():void {
            super();

            this._svgRoot = new SVGRoot(null);
            this._svgRoot.debug = this.debug;
            this._svgRoot.svgRoot = this._svgRoot;
            this.addChild(this._svgRoot);

            this.addEventListener(Event.ADDED_TO_STAGE, addedToStage);

        }
        

        public function debug(debugMessage:String):void {
            if (this.debugEnabled) {
                try {
                    ExternalInterface.call("receiveFromFlash", { type: 'log', logString: debugMessage } );
                }
                catch(error:SecurityError) {
                }
            }
        }

        /**
         * @public
         **/
        public function xmlLoaded(event : Event):void {
           var dataXML:XML = new XML(event.target.data);
           this.xml = dataXML;
        }

        public function htmlLoaded(event : Event):void {
           this.html = event.target.data;
           var htmlStrings:Object = this.html.split('\n');
           var svgString:String="";
           var svgCopying:Boolean=false;
           var svgStartString1:String= 'id="'+this.svgIdParam+'"';
           var svgStartString2:String= "id='"+this.svgIdParam+"'";
           var svgEndString:String="</svg>";
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
           var dataXML:XML = XML(svgString);
           this.xml = dataXML;
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

        private function addedToStage(event:Event = null):void {

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
                    if (jsMsg.type == 'getVersion') {
                        return { type: 'version', version: '0.6' };
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
                // notify browser javascript that we are loaded and ready
                try {
                    var result:Object = ExternalInterface.call("receiveFromFlash",
                        { type: 'event', eventType: 'onLoad', uniqueId: this.js_uniqueId } );
                }
                catch(error:SecurityError) {
                    debugstr = "Security Error on ExternalInterface.call(...). ";
                    if (myURL.substring(0,4) == "file") {
                        debugstr += "This is expected when loaded from a local file.";
                    }
                    this.debug(debugstr);
                }

                // process <object> parameters
                var matr:Matrix;
                for (item in paramsObj) {
                    if (item == "sourceType") {
                        this.sourceTypeParam = paramsObj[item];
                    }
                    if (item == "svgURL") {
                        this.svgURLParam = paramsObj[item];
                    }
                    if (item == "svgId") {
                        this.svgIdParam = paramsObj[item];
                    }
                    if (item == "scaleX") {
                        this.scaleXParam = Number(paramsObj[item]);
                        matr = new Matrix();
                        matr.scale(this.scaleXParam, this.scaleYParam);
                        this.transform.matrix = matr;
                    }
                    if (item == "scaleY") {
                        this.scaleYParam = Number(paramsObj[item]);
                        matr = new Matrix();
                        matr.scale(this.scaleXParam, this.scaleYParam);
                        this.transform.matrix = matr;
                    }
                    if (item == "translateX") {
                        this.x = Number(paramsObj[item]);
                    }
                    if (item == "translateY") {
                        this.y = Number(paramsObj[item]);
                    }
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
                       because flash does not allow javascript to pass it in. This is
                       because when loaded from file, network access is also not allowed, to
                       prevent transfer of local data to network, and flash includes javascript
                       access as part of its network access profile and disables it for local files.
                       Therefore, we cannot rely on the more efficient mechanism where javascript
                       retrieves the SVG directly from the DOM and must do it here ourselves.

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
                var dataXML:XML = XML(jsMsg.svgString);
                this.xml = dataXML;
            }
            if (jsMsg.sourceType == 'url_svg') {
                this.sourceTypeParam = 'url_svg';
                this.svgURLParam = jsMsg.svgURL;
                this.loadSVGURL();
            }
            return null;
        }

        /**
         * @public
         **/
        public function set xml(value:XML):void {
            this._svgRoot.xml = value;
        }
        
        /**
         * SVG XML value
         **/
        public function get xml():XML {
            return this._svgRoot.xml;
        }
        
        /**
         * @private
         **/
        public function set scale(scale:Number):void {
            this._svgRoot.scale = scale;
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
        }
        
        override public function get rotation():Number {
            return this._svgRoot.rotation;
        }
        
        
        /**
         * @private
         **/
        override public function set transform(value:Transform):void {
            this._svgRoot.transform = value;
        }
        
        override public function get transform():Transform {
            return this._svgRoot.transform; 
        }
        
        
        /**
         * @private
         **/
        override public function set filters(value:Array):void {
            this._svgRoot.filters = value;
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
