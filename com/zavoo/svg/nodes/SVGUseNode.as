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
    
    public class SVGUseNode extends SVGNode
    {        
        public function SVGUseNode(xml:XML):void {
            super(xml);
        }    

        // XXX remove these?
        override protected function transformNode():void {
        }    
        override protected function setupFilters():void {
        }    


        override public function refreshHref():void {

            if (this._href == null) {
                var href:String = this._xml.@xlink::href;
                if (href != null) {
                    href = href.replace(/^#/,'');
                    this._href = this.svgRoot.getElement(href);
                }
            }

            // If _href revision has changed, copy its xml 
            if (this._href != null) {

                this._href.refreshHref();

                if (this._href.revision != this._hrefRevision) {

                    // Create a child to hold a copy of the referenced object.
                    var child:XML = this._href.xml.copy();

                    // For each of the <use> attributes, overwrite the child attribute
                    // because <use> attributes have precedence over the referenced object.
                    for each( var attr:XML in this.xml.attributes() ) {
                        if (attr.name() != "id") {
                            child.@[attr.name()] = attr.toString();
                        }
                    }

                    // Create a unique id for the child since we copied another object.
                    // xxx should walk the entire child subtree here, creating unique ids.
                    child.@id = this._xml.@id + "." + child.@id;

                    this.xml.setChildren(child);

                    this._hrefRevision = this._href.revision;
                    this._revision++;
                    this.invalidateDisplay();

                }
            }
        }
        

    }
}
