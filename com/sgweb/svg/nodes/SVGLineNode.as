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
    public class SVGLineNode extends SVGNode
    {        
        public function SVGLineNode(svgRoot:SVGRoot, xml:XML):void {
            super(svgRoot, xml);
        }    
        
        /**
         * Generate graphics commands to draw a line
         **/
        protected override function generateGraphicsCommands():void {
            
            this._graphicsCommands = new  Array();
            
            var x1:Number = this.getAttribute('x1',0);
            var y1:Number = this.getAttribute('y1',0);
            var x2:Number = this.getAttribute('x2',0);
            var y2:Number = this.getAttribute('y2',0);
            
            this._graphicsCommands.push(['LINE', x1, y1, x2, y2]);
        }        
        
    }
}
