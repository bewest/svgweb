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

package com.sgweb.svg.nodes
{
    import com.sgweb.svg.data.SVGColors;
    
    import flash.display.Shape;
    import flash.events.Event;
    import flash.utils.getTimer;
    import flash.geom.Matrix;
    
    /**
     * Root container of the SVG
     **/
    public class SVGRoot extends SVGNode
    {
        /**
         * Object to hold node id registration
         **/
        public var _elementById:Object;
        
        public var _referersById:Object;

        /**
         * Used to synchronize tweens
         **/
        private var _loadTime:int;
        
        /**
         * Passed in transform parameters
         **/
        public var scaleXParam:Number = 1.0;
        public var scaleYParam:Number = 1.0;
        public var translateXParam:Number = 0.0;
        public var translateYParam:Number = 0.0;

        public var renderCurrent:Number = 0;
        public var debug:Object;
        public var handleScript:Object;
        public var handleOnLoad:Object;
        public var firedOnLoad:Boolean;
        public var title:String;
                
        public function SVGRoot(xml:XML = null):void {
            super(null, XML(xml));
        }    
        
        
        /**
         * Set super._xml
         * Create new _elementById object
         **/
        public override function set xml(value:XML):void {        
            default xml namespace = svg;
            this._elementById = new Object();    
            this._referersById = new Object();    
            super.xml = value;
            this._loadTime = getTimer();
            if (this.xml.@id) {
                this._elementById[this.xml.@id] = this;
            }
            this.dispatchEvent(new Event(Event.RESIZE));
            this.renderCurrent = 0;
        }
        
        /**
         * Register a node
         * 
         * @param id id to register node under
         * 
         * @param node node to be registered
         **/
        public function registerElement(id:String, node:*):void {    
            //this.svgRoot.debug("Registering: " + id);
            this._elementById[id] = node;
        }

        /**
         * 
         * If this object depends on another object, then we can
         * register our interest in being invalidated when the
         * dependency object is redrawn.
         * 
         **/
        public function addReference(refererId:String, referencedId:String):void {

            if (!this._referersById[referencedId]) {
                 this._referersById[referencedId]= new Array();
            }
            this._referersById[referencedId][refererId] = '';
        }

        
        public function invalidateReferers(id:String):void {
            //this.svgRoot.debug("Invalidating referers to "  + id);
            if (this._referersById[id]) {
                var referers:Array = this._referersById[id];
                for (var referer:String in referers) {
                    if (this.getElement(referer)) {
                        this.getElement(referer).invalidateDisplay();
                    }
                }
            }
        }

        /**
         * Retrieve registered node by name
         * 
         * @param id id of node to be retrieved
         * 
         * @return node registered with id
         **/
        public function getElement(id:String):* {
            if (this._elementById.hasOwnProperty(id)) {
                return this._elementById[id]; 
            }
            return null;
        }

        
        /**
         * Support default SVG style values
         **/
        override public function getStyle(name:String):String {
            var style:String = super.getStyle(name);
            
            //Return default values if a style is not set
            if ((name == 'opacity') 
                || (name == 'fill-opacity')
                || (name == 'stroke-opacity')
                || (name == 'stroke-width')) {
                if (style == null) {
                    style = '1';
                }
            }
            
            if (name == 'fill') {
                if (style == null) {
                    style = 'black';
                }
            }
            
            if (name == 'stroke') {
                if (style == null) {
                    style = 'none';
                }
            }
            
            return style;            
                    
        }

        override public function getWidth():Number {
            var canvasWidth:Number = 2048.0;
            if (this.scaleModeParam == "showAll_svg") {
                canvasWidth = this.stage.stageWidth;
            }
            var widthStr:String = this.xml.@width;
            if (widthStr) {
                if (widthStr.match(/%/)) {
                    widthStr=widthStr.replace(/%/g, "");
                    var num:Number = SVGColors.cleanNumber(widthStr);
                    return canvasWidth * num / 100;
                }
                else {
                    return SVGColors.cleanNumber(widthStr);
                }
            }
            else {
                return canvasWidth;
            }
        }

        override public function getHeight():Number {
            var canvasHeight:Number = 1024.0;
            if (this.svgRoot.scaleModeParam == "showAll_svg") {
                canvasHeight = this.stage.stageHeight;
            }

            var heightStr:String = this.xml.@height;
            if (heightStr) {
                if (heightStr.match(/%/)) {
                    heightStr=heightStr.replace(/%/g, "");
                    var num:Number = SVGColors.cleanNumber(heightStr);
                    return canvasHeight * num / 100;
                }
                else {
                    return SVGColors.cleanNumber(heightStr);
                }
            }
            else {
                return canvasHeight;
            }
        }


        public function renderStart(node:SVGNode):void {
            this.renderCurrent++;
        }
        public function renderDone(node:SVGNode):void {
            if (node.parent) {
                this.renderCurrent--;
            }
            if (this.renderCurrent == 0) {
                if (!this.firedOnLoad) {
                    this.handleOnLoad();
                    this.firedOnLoad = true;
                }
            }
        }
        
        override public function transformNode():void {
            super.transformNode();
            var newMatrix:Matrix = this.transform.matrix.clone();

            newMatrix.translate(this.translateXParam, this.translateYParam);
            newMatrix.scale(this.scaleXParam, this.scaleYParam);
            // showAll_svg uses flash noScale mode which centers the
            // object within the 2048x1024 scale. This reverses that
            // here so we start with the proper zero coordinate properly.
            if (this.scaleModeParam == "showAll_svg" || this.scaleModeParam == "noScale") {
                newMatrix.translate( (2048.0 - this.stage.stageWidth) / 2, (1024.0 - this.stage.stageHeight) / 2);
            }

            this.transform.matrix = newMatrix;
        }


        /**
         * Used to synchronize tweens
         **/
        public function get loadTime():int {
            return this._loadTime;
        }
        
        
        
    }
}
