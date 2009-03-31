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
    import com.sgweb.svg.core.SVGNode;
    import com.sgweb.svg.core.SVGViewer;
    import flash.geom.Matrix;

    public class SVGSVGNode extends SVGNode
    {
        protected var parentSVGRoot:SVGSVGNode = null;
        private var _pendingRenderCount:int;
        protected var firedOnLoad:Boolean = false;
        protected var scaleModeParam:String = 'svg_all';

        private var _nodeLookup:Object;
        protected var _referersById:Object;

        public var title:String;

        public function SVGSVGNode(svgRoot:SVGSVGNode = null, xml:XML = null, original:SVGNode = null):void {
            if (svgRoot) {
                this.parentSVGRoot = svgRoot;
            }
            super(this, xml, original);
        }

        public override function set xml(value:XML):void {        
            this._nodeLookup = new Object();
            this._referersById = new Object();    
            super.xml = value;

            // If this is the top SVG element, then start the render tracking process.
            if (this.parentSVGRoot == null) {
                this._pendingRenderCount = 1;
            }
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

        // The following functions track the number of elements that have a redraw
        // pending. When the count reaches zero, the onLoad handler can be called.
        // 
        // The overall count starts at one to account for the top SVG element. This is done
        // in the set xml handler above.
        // Other elements increment the count when they are added. This is done
        // by an override of addChild in SVGNode.
        // Every element decrements the count when rendering is complete. This is done
        // by drawNode in SVGNode.
        public function renderPending():void {
            if (this.parentSVGRoot) {
                this.parentSVGRoot.renderPending();
            }
            else {
                this._pendingRenderCount++;
            }
        }

        public function renderFinished():void {
            if (this.parentSVGRoot) {
                this.parentSVGRoot.renderFinished();
            }
            else {
                this._pendingRenderCount--;
                if (this._pendingRenderCount == 0) {
                    if (!this.firedOnLoad) {
                        this.handleOnLoad();
                        this.firedOnLoad = true;
                    }
                }
                if (this._pendingRenderCount < 0) {
                    this.dbg("error: pendingRenderCount count negative: " + this._pendingRenderCount);
                }
            }
        }
       
        public function registerNode(node:SVGNode):void {
            _nodeLookup[node.id] = node;
        }

        public function unregisterNode(node:SVGNode):void {
            delete _nodeLookup[node.id];
        }

        override protected function registerID():void {
            super.registerID();

            if (parentSVGRoot) {
                parentSVGRoot.registerNode(this);
            }
        }

        override protected function unregisterID():void {
            super.unregisterID();

            if (parentSVGRoot) {
                parentSVGRoot.unregisterNode(this);
                parentSVGRoot = null;
            }
        }

        /**
         * 
         * If this object depends on another object, then we can
         * register our interest in being invalidated when the
         * dependency object is redrawn.
         * 
         * The node references referenceId. 
         * An array of nodes that reference the referenceId is created.
         * 
         **/
        public function addReference(node:SVGNode, referencedId:String):void {

            if (!this._referersById[referencedId]) {
                 this._referersById[referencedId]= new Array();
            }
            if (this._referersById[referencedId].lastIndexOf(node) == -1) {
                this._referersById[referencedId].push(node);
            }
        }

        public function deleteReference(node:SVGNode, referencedId:String):void {
            if (this._referersById[referencedId]) {
                if (this._referersById[referencedId].lastIndexOf(node) != -1) {
                    delete this._referersById[referencedId][this._referersById[referencedId].lastIndexOf(node)];
                }
            }
        }
        
        public function invalidateReferers(id:String):void {
            //this.svgRoot.debug("Invalidating referers to "  + id);
            if (this._referersById[id]) {
                var referers:Array = this._referersById[id];
                for (var refererIdx:String in referers) {
                    referers[refererIdx].invalidateDisplay();
                }
            }
        }

        public function getNode(name:String):SVGNode {
            if (_nodeLookup.hasOwnProperty(name)) {
                return _nodeLookup[name];
            }
            return null;
        }

        public function handleScript(script:String):void {
            if (this.parentSVGRoot) {
                this.parentSVGRoot.handleScript(script);
            }
            else if (this.parent is SVGViewer) {
                SVGViewer(this.parent).handleScript(script);
            }
        }

        public function handleOnLoad():void {
            if (this.parentSVGRoot) {
                this.parentSVGRoot.handleOnLoad();
            }
            else if (this.parent is SVGViewer) {
                SVGViewer(this.parent).handleOnLoad();
            }
        }

        public function addActionListener(eventType:String, target:SVGNode):void {
            if (this.parentSVGRoot) {
                this.parentSVGRoot.addActionListener(eventType, target);
            }
            else if (this.parent is SVGViewer) {
                SVGViewer(this.parent).addActionListener(eventType, target);
            }
        }

        public function removeActionListener(eventType:String, target:SVGNode):void {
            if (this.parentSVGRoot) {
                this.parentSVGRoot.removeActionListener(eventType, target);
            }
            else if (this.parent is SVGViewer) {
                SVGViewer(this.parent).removeActionListener(eventType, target);
            }
        }

        public function debug(debugString:String):void {
            if (this.parentSVGRoot) {
                this.parentSVGRoot.debug(debugString);
            }
            else if (this.parent is SVGViewer) {
                SVGViewer(this.parent).debug(debugString);
            }
        }

    }
}
