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
    import mx.utils.StringUtil;
    
    public class SVGPolygonNode extends SVGNode
    {        
        public function SVGPolygonNode(svgRoot:SVGRoot, xml:XML):void {
            super(svgRoot, xml);
        }    
        
        /**
         * Generate graphics commands to draw a polygon
         **/
        protected override function generateGraphicsCommands():void {
            
            this._graphicsCommands = new  Array();
            
            var pointsString:String = StringUtil.trim(this.getAttribute('points',''));
            var points:Array = pointsString.split(' ');
            
            for (var i:int = 0; i < points.length; i++) {
                var point:Array = String(points[i]).split(',');
                if (i == 0) {
                    this._graphicsCommands.push(['SF']);
                    this._graphicsCommands.push(['M', point[0], point[1]]);
                }
                else if (i == (points.length - 1)) {
                    this._graphicsCommands.push(['L', point[0], point[1]]);    
                    this._graphicsCommands.push(['Z']);
                    this._graphicsCommands.push(['EF']);
                }
                else {
                    this._graphicsCommands.push(['L', point[0], point[1]]);
                }                
            }
            
            this._graphicsCommands.push(['R', x, y, width, height]);            
        }    
        
    }
}
