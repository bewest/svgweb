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

package com.sgweb.svg.nodes.mask
{
    import com.sgweb.svg.core.SVGNode;
    import com.sgweb.svg.nodes.SVGClipPathNode;
    import com.sgweb.svg.nodes.SVGSVGNode;
    import com.sgweb.svg.nodes.mask.SVGMask;
    import com.sgweb.svg.nodes.SVGFilterNode;
    
    import flash.events.Event;
    import flash.geom.Matrix;
    

    public class SVGClipMaskParent extends SVGNode
    {

        protected var _childToMaskXML:XML;
        protected var _childCopyNode:SVGNode;

        public function SVGClipMaskParent(svgRoot:SVGSVGNode, 
                                          childToMaskXML:XML):void {
            this._childToMaskXML = childToMaskXML;
            super(svgRoot, this._childToMaskXML);
        }    


        override protected function parse():void {
            var svgMask:SVGMask;
            var clipList:XMLList;
            var childNode:SVGNode;
            var clipPathXML:XML;

            if (this._childToMaskXML.attribute('clip-path').length() > 0) {
                clipList = this._childToMaskXML.attribute('clip-path');
            }
            else {
                clipList = this._childToMaskXML.attribute('mask');
            }
            var clipPath:String= clipList[0].toString();
            clipPath = clipPath.replace(/url\(#(.*?)\)/si,"$1");
            var clipPathNode:SVGNode = this.svgRoot.getElement(clipPath);

            // Create and add the mask node
            // xxx would need to create random this.xml.@id if necessary.
            this.svgRoot.addReference(this.xml.@id, clipPath);
            if (clipPathNode) {
                clipPathXML = clipPathNode.xml.copy();

                if (this._childToMaskXML.@['transform'] != undefined) {
                    clipPathXML.@['transform'] = this._childToMaskXML.@['transform'];
                }
                // xxx svgmask should handle this
                var stubClipPathXML:XML = <svgMask></svgMask>;
                stubClipPathXML.appendChild(clipPathXML.children());

                svgMask = new SVGMask(this.svgRoot, stubClipPathXML);
                this.addChild(svgMask);
                this.mask = svgMask;

                var childNodeXML:XML = this._childToMaskXML.copy();
                delete childNodeXML.@['clip-path'];
                delete childNodeXML.@['mask'];

                childNode = this.parseNode(childNodeXML);
                if (childNode) {
                    this.addChild(childNode);
                }
            }
            else {
                //this.svgRoot.debug("Clippath " + clipPath
                //             + " not (yet?) available for mask node " + this.xml.@id);
            }

        }

        override protected function setupFilters():void {
        }

        override public function transformNode():void {
            this.transform.matrix = new Matrix();
        }

        override protected function generateGraphicsCommands():void {
            //Do Nothing
            this._graphicsCommands = new Array();
        }

        override protected function registerId(event:Event):void {
            this.removeEventListener(Event.ADDED, registerId);
        }
    }
}
