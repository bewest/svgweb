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

package com.sgweb.svg.nodes
{
    import com.sgweb.svg.utils.SVGColors;
    import com.sgweb.svg.core.SVGNode;
    
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


        override public function getAttribute(name:String, defaultValue:* = null, inherit:Boolean = true):* {

            var value:String = this._getAttribute(name);
            if (value) {
                return value;
            }

            if (ATTRIBUTES_NOT_INHERITED.indexOf(name) != -1) {
                return defaultValue;
            }

            if (inherit && (this.parent is SVGNode)) {
                return SVGNode(this.parent).getAttribute(name, defaultValue, inherit);
            }

            if ((name == 'opacity') 
                || (name == 'fill-opacity')
                || (name == 'stroke-opacity')
                || (name == 'stroke-width')) {
                return '1';
            }

            if (name == 'fill') {
                return 'black';
            }

            if (name == 'stroke') {
                return 'none';
            }

            return defaultValue;
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
        
        /**
         * Used to synchronize tweens
         **/
        public function get loadTime():int {
            return this._loadTime;
        }
        
        
        
    }
}
