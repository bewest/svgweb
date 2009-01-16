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
                                // pseudo: mergedStyles = overwriteStyles(baseStyles, newStyles)
                                child.@style = SVGNode.overwriteStyles(child.@style, this._xml.@style);
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
