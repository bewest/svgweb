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
    import flash.geom.Matrix;
    
    public class SVGUseNode extends SVGNode
    {        
        public function SVGUseNode(svgRoot:SVGRoot, xml:XML):void {
            super(svgRoot, xml);
        }    


        override public function transformNode():void {
            this.transform.matrix = new Matrix();
        }    
        override protected function setupFilters():void {
        }    


        override public function refreshHref():void {

            var href:String = this._xml.@xlink::href;
            if (!href || href == '') {
                href = this._xml.@href;
            }
            if (href && href != '') {
                href = href.replace(/^#/,'');
                this._href = this.svgRoot.getElement(href);
                if (!this._href) {
                    //this.svgRoot.debug("<use>: href " + href + " not available for " + this.xml.@id);
                }
            }

            // If _href revision has changed, copy its xml 
            if (this._href) {
                //this.svgRoot.debug("Doing <use> href refresh of " + this._xml.@xlink::href + " for " + this._xml.@id);

                this._href.refreshHref();

                if (this._href.revision != this._hrefRevision) {

                    this._xml = this._originalXML.copy();

                    // Create a child to hold a copy of the referenced object.
                    var child:XML = new XML(this.copyXMLUnique(this._href._xml).toXMLString());

                    /* XXX 
                       I think if we remove our transformNode override, then this precedence code
                       becomes unnecessary since the <use> and the new child can just be independent
                       and exercise their own attributes. Note the child will inherit from the
                       <use> node so the following code is probably removable.
                    */

                    // For each of the <use> attributes, overwrite the child attribute
                    // because <use> attributes have precedence over the referenced object.
                    for each( var attr:XML in this._xml.attributes() ) {
                        if (   attr.name() != "id"
                            && attr.name() != "http://www.w3.org/1999/xlink::href"
                            && attr.name() != "x"
                            && attr.name() != "y"
                            && attr.name() != "width"
                            && attr.name() != "height"
                            && attr.name() != "style") {
                            child.@[attr.name()] = attr.toString();
                        }
                        if (attr.name() == "style") {
                            if (child.@style) {
                                // psuedo: mergedStyles = overwriteStyles(baseStyles, newStyles)
                                child.@style = this.overwriteStyles(child.@style, this._xml.@style);
                            }
                            else {
                                child.@style = this._xml.@style;
                            }
                        }
                    }

                    this._xml.setChildren(child);

                    this._hrefRevision = this._href.revision;
                    this._revision++;

                }
            }
        }
        

    }
}
