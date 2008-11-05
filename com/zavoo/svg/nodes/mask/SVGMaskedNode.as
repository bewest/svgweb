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

package com.zavoo.svg.nodes.mask
{
    import com.zavoo.svg.nodes.SVGClipPathNode;
    import com.zavoo.svg.nodes.SVGNode;
    import com.zavoo.svg.nodes.mask.SVGMask;
    
    import flash.events.Event;
    

    public class SVGMaskedNode extends SVGNode
    {

        protected var _childToMaskXML:XML;
        protected var _clipPathHref:String;
        protected var _svgMask:SVGMask;

        public function SVGMaskedNode(childToMaskXML:XML, clipPathHref:String):void {
            this._childToMaskXML = childToMaskXML.copy();
            this._clipPathHref = clipPathHref;
            super(this._childToMaskXML); // xxx should create stub xml, instead of borrowing child
        }    


        override protected function parse():void {
            this._svgMask = null;
            var clipPathNode:SVGClipPathNode = this.svgRoot.getElement(this._clipPathHref);
            if (clipPathNode) {
                this._svgMask = new SVGMask(clipPathNode);
                if (this._svgMask) {

                    if (this._childToMaskXML.@transform) {
                        this._svgMask.xml.@transform = this._childToMaskXML.@transform;
                    }

                    this.addChild(this._svgMask);
                }
            }
            else {
                this.svgRoot.debug("Clippath " + this._clipPathHref
                                 + " not available for mask node " + this.xml.@id);
            }
            this.mask = this._svgMask;
            var childNode:SVGNode = this.parseNode(this._childToMaskXML);
            if (childNode) {
                this.addChild(childNode);
            }
        }

        override protected function setupFilters():void {
        }

        override protected function transformNode():void {
        }


        override protected function generateGraphicsCommands():void {
            //Do Nothing
            this._graphicsCommands = new  Array();
        }

        override protected function registerId(event:Event):void {
            this.removeEventListener(Event.ADDED, registerId);
        }
    }
}
