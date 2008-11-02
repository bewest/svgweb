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
    
    import flash.events.Event;
    

    public class SVGMask extends SVGNode
    {

        protected var _clipPath:SVGClipPathNode;
        protected var _clipPathRevision:Number = -1;

        public function SVGMask(clipPath:SVGClipPathNode):void {
            this._clipPath = clipPath;
            this._clipPathRevision = this._clipPath.revision;
            super(this.copyClipPathXML(clipPath.xml));
        }    


        public function copyClipPathXML(clipPathXML:XML):XML {
            var myXML:XML = clipPathXML.copy();
            this.makeUniqueIDs(myXML);
            return myXML;
        }

        public function makeUniqueIDs(xmlNode:XML):void {
            xmlNode.@id = xmlNode.@id + ".copy" + Math.random().toString();
            for each (var childXML:XML in xmlNode.children()) {
                this.makeUniqueIDs(childXML);
            }
        }

        public function getClipPath():SVGClipPathNode {
            return _clipPath;
        }

        public function refreshClipPath():void {

            if (this._clipPath.revision != this._clipPathRevision) {
                this.xml = this.copyClipPathXML(this._clipPath.xml);
                this._revision++;
                this.invalidateDisplay();
            }
        }


    }
}
