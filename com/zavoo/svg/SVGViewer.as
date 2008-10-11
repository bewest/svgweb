/*
Copyright (c) 2008 James Hight

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
    
    import mx.containers.Canvas;
    import flash.net.URLLoader;
    import flash.net.URLRequest;

    /**
     * Flex container for the SVG Renderer
     **/
    public class SVGViewer extends Canvas
    {
        private var _xml:XML;
        private var _svgRoot:SVGRoot;
        private var myLoader:URLLoader= new URLLoader ();
        public  var paramsObj:Object;
        
        /**
         * @public
         **/
        public function xmlLoaded(event : Event):void {
           //var loader:URLLoader = URLLoader(event.target);
           var dataXML:XML = XML(event.target.data);
           this.xml = dataXML;
        }

        public function loadSVGFile(svgFilename:String):void {
            var myXMLURL : URLRequest = new URLRequest (svgFilename);
            this.myLoader.addEventListener (Event.COMPLETE, xmlLoaded);
            try
            {
                this.myLoader.load(myXMLURL);
            }
            catch (error:ArgumentError)
            {
                trace("An ArgumentError has occurred.");
            }
            catch (error:SecurityError)
            {
                trace("A SecurityError has occurred.");
            }
        }

        public function SVGViewer() {
            super();
            this._svgRoot = new SVGRoot(null);
            this.rawChildren.addChild(this._svgRoot);
            var outerthis:SVGViewer = this;
            
            this._svgRoot.addEventListener(Event.RESIZE, sizeCanvas);

            function js_createFromSVG(svg:String):void {
               var dataXML:XML = XML(svg);
               outerthis.xml = dataXML;
            }
            function js_loadSVGFile(svg:String):void {
                loadSVGFile(svg);
            }

            try {
                ExternalInterface.addCallback("createFromSVG", js_createFromSVG);
                ExternalInterface.addCallback("loadSVGFile", js_loadSVGFile);
            }
            catch(error:SecurityError) {
            }
            var jsArgument:String = "loaded";
            var result:Object = ExternalInterface.call("receiveFromFlash", jsArgument);
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
