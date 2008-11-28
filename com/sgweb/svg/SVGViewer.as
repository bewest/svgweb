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
        private var inlineSVGURL:String = "";
        private var inlineSVGId:String = "";
        private var myXMLLoader:URLLoader= new URLLoader ();
        private var myHTMLLoader:URLLoader= new URLLoader ();
        public  var paramsObj:Object;
        protected var scaleXParam:Number = 1.0;
        protected var scaleYParam:Number = 1.0;
        protected var debugEnabled:Boolean = false;

        public function debug(debugMessage:String):void {
            if (this.debugEnabled) {
                try {
                    ExternalInterface.call("receiveLogFromFlash", debugMessage);
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
           var svgStartString:String= "<!--svgid:"+this.inlineSVGId+"-->";
           var svgEndString:String="<!--/svgid:"+this.inlineSVGId+"-->";
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
                function js_createFromSVG(svg:String):void {
                    outerthis.debug("Received createFromSVG() call from javascript.");
                    var dataXML:XML = XML(svg);
                    outerthis.xml = dataXML;
                }
                function js_loadSVGURL(svg:String):void {
                    outerthis.debug("Received loadSVGURL() call from javascript.");
                    loadSVGURL(svg);
                }
                function js_getVersion():String {
                    return "0.1";
                }
                var debugstr:String;
                try {
                    ExternalInterface.addCallback("createFromSVG", js_createFromSVG);
                    ExternalInterface.addCallback("loadSVGURL", js_loadSVGURL);
                    ExternalInterface.addCallback("getVersion", js_getVersion);
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
                    var result:Object = ExternalInterface.call("receiveFromFlash", this.js_uniqueId);
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
                    if (item == "loadSVGURL") {
                        this.loadSVGURL(paramsObj[item]);
                    }
                    if (item == "inlineSVGURL") {
                        this.inlineSVGURL = paramsObj[item];
                    }
                    if (item == "inlineSVGId") {
                        this.inlineSVGId = paramsObj[item];
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

                if (this.inlineSVGURL != "") {
                    this.debug("Inline URL parameter specified: " + this.inlineSVGURL);
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

        public function SVGViewer():void {
            super();

            this._svgRoot = new SVGRoot(null);
            this._svgRoot.debug = this.debug;
            this._svgRoot.svgRoot = this._svgRoot;
            this.addChild(this._svgRoot);

            this.addEventListener(Event.ADDED_TO_STAGE, addedToStage);

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
            return this._svgRoot.xml
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
