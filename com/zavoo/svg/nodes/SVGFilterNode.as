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
    import com.zavoo.svg.nodes.mask.SVGMask;
    import com.zavoo.svg.nodes.mask.SVGClipMaskParent;
    import com.zavoo.svg.nodes.mask.SVGBlurMaskParent;
    
    import flash.filters.BlurFilter;
    import flash.geom.Matrix;
    
    public class SVGFilterNode extends SVGNode
    {
        
        private var _filters:Array;
        
        public function SVGFilterNode(svgRoot:SVGRoot, xml:XML)
        {
            super(svgRoot, xml);
        }
        
        override protected function parse():void {
                
        }
        
        /**
         * 
         **/
        public function getFilters(objectToFilter:SVGNode):Array {
            var nodeFilters:Array = new Array();
            var list:XMLList =     this._xml.svg::feGaussianBlur;


            var svgNode:SVGNode = objectToFilter;
            var concatMatrix:Matrix = new Matrix();
            var oldMatrix:Matrix;

            while (svgNode && !(svgNode is SVGRoot) ) {
                if (  !(svgNode is SVGClipMaskParent)
                   && !(svgNode is SVGBlurMaskParent)
                   && (svgNode.xml.@transform != undefined) ) {
                     oldMatrix = this.parseTransform(svgNode.xml.@transform);
                     oldMatrix.concat(concatMatrix);
                     concatMatrix = oldMatrix;
                }
                svgNode = SVGNode(svgNode.parent);
            }

            if (list.length()) {
                var stdDeviation:String = this._xml.svg::feGaussianBlur.@stdDeviation.toString();
                if (stdDeviation == null) {
                    stdDeviation = '4';
                }
                var blurAmount:Number = SVGColors.cleanNumber(stdDeviation);
                blurAmount = blurAmount * concatMatrix.a;
                if (objectToFilter.getSVGMaskAncestor() != null) {
                    blurAmount = blurAmount * .25;
                }
                nodeFilters.push(new BlurFilter(blurAmount*1.4, blurAmount*1.4, 3));
            }    
            
            return nodeFilters;
        } 
        
        
    }
}
