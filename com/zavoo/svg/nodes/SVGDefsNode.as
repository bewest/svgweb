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

package com.zavoo.svg.nodes
{
    import flash.events.Event;
    
    /** 
     * Contains drawing instructions used by SVGUseNode
     * It is not rendered directly
     **/
    public class SVGDefsNode extends SVGSymbolNode
    {
        
        public function SVGDefsNode(xml:XML):void {
            super(xml);
        }        
                
        public function getDef(name:String):XML {
            for each(var node:XML in this._xml.children()) {
                if (node.@id == name) {
                    return node;
                }
            }
            return null;
        }
        
        override protected function registerId(event:Event):void {
            this.removeEventListener(Event.ADDED, registerId);

            for each (var defNode:XML in this._xml.children()) {
                var id:String = defNode.@id;
                if (defNode.localName().toString().toLocaleLowerCase() != 'filter') {
                    if (id != "") {
                        /* XXX need to support different types of def nodes. */
                        var clipPath:SVGClipPathNode = new SVGClipPathNode(defNode);
                        this.addChild(clipPath);
                        this.svgRoot.registerElement(id, clipPath);
                    }
                }
            }
        }
    }
}
