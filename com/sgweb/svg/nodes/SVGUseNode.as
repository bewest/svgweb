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
    import flash.events.Event;
    
    public class SVGUseNode extends SVGNode
    {        

        public function SVGUseNode(svgRoot:SVGSVGNode, xml:XML = null, original:SVGNode = null):void {
            super(svgRoot, xml, original);
        }

        override protected function drawNode(event:Event = null):void {
            if ( (this.parent != null) && (this._invalidDisplay) ) {
                this._invalidDisplay = false;
                if (this._xml != null) {

                    drawSprite.graphics.clear();

                    var name:String = this.getAttribute('href');
                    if (name) {
                        name = name.substr(1);
                        var node:SVGNode = this.svgRoot.getNode(name);
                        if (node) {
                            if (!this._parsedChildren) {
                                this.parseChildren();
                                this._parsedChildren = true;
                                node = node.clone();
                                viewBoxSprite.addChild(node);
                                this.svgRoot.renderPending();
                                this.svgRoot.deleteReference(this, name);
                            }
                        }
                        else {
                            this.svgRoot.addReference(this, name);
                        }
                    }

                    // sets x, y, rotate, and opacity
                    this.setAttributes();

                    if (this.getAttribute('display') == 'none') {
                        this.visible = false;
                    }
                    else {
                        this.generateGraphicsCommands();
                        this.transformNode();
                        this.draw();

                        this.applyClipPathMask();
                        this.applyViewBox();
                        this.setupFilters();
                    }

                }

                this.removeEventListener(Event.ENTER_FRAME, drawNode);
            }

            if (!this._initialRenderDone && this.parent) {
                this._initialRenderDone = true;
                this.svgRoot.renderFinished();
            }



        }

        override public function setAttribute(name:String, value:String):void {
            super.setAttribute(name, value);
            this.invalidateChildren();
        }

    }
}


