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
    import com.zavoo.svg.data.SVGColors;
    
    import flash.filters.BlurFilter;
    
    public class SVGFilterNode extends SVGNode
    {
        
        private var _filters:Array;
        
        public function SVGFilterNode(xml:XML)
        {
            super(xml);
        }
        
        override protected function parse():void {
                
        }
        
        /**
         * 
         **/
        public function getFilters():Array {
            var nodeFilters:Array = new Array();
            var list:XMLList =     this._xml.svg::feGaussianBlur;
            
            if (list.length()) {
                var stdDeviation:String = this._xml.svg::feGaussianBlur.@stdDeviation.toString();
                if (stdDeviation == null) {
                    stdDeviation = '4';
                }
                var blurAmount:Number = SVGColors.cleanNumber(stdDeviation);
                nodeFilters.push(new BlurFilter(blurAmount, blurAmount, 10));
            }    
            
            return nodeFilters;
        } 
        
        
    }
}
