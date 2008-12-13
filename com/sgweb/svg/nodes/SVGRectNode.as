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
    import com.sgweb.svg.data.SVGColors;
    
    public class SVGRectNode extends SVGNode
    {                
        public function SVGRectNode(svgRoot:SVGRoot, xml:XML):void {
            super(svgRoot, xml);
        }    
        
        /**
         * Generate graphics commands to draw a rectangle
         **/
        protected override function generateGraphicsCommands():void {
            
            this._graphicsCommands = new  Array();
            
            var widthStr:String = this.getAttribute('width','0');
            var heightStr:String = this.getAttribute('height','0');
            var width:Number = SVGColors.cleanNumber2(widthStr, getWidth());
            var height:Number = SVGColors.cleanNumber2(heightStr, getHeight());
            
            var rx:String = this.getAttribute('rx');
            var ry:String = this.getAttribute('ry');            
            
            if ((rx != null) && (ry == null)) {
                ry = rx;
            }
            if ((ry != null) && (rx == null)) {
                rx = ry;
            }
            
            //x & y loaded in setAttributes()
            if (rx != null) {
                this._graphicsCommands.push(['RECT', 0, 0, width, height, (SVGColors.cleanNumber(rx) * 2), SVGColors.cleanNumber(ry) * 2]);                
            }
            else {
                this._graphicsCommands.push(['RECT', 0, 0, width, height]);
            }
        }        
    }
}
