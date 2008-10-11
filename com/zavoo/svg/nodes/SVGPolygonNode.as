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
    import mx.utils.StringUtil;
    
    public class SVGPolygonNode extends SVGNode
    {        
        public function SVGPolygonNode(xml:XML):void {
            super(xml);
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
