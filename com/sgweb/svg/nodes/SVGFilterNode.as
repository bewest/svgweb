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
    import com.sgweb.svg.nodes.SVGSVGNode;
    import com.sgweb.svg.utils.SVGColors;
    import com.sgweb.svg.nodes.mask.SVGMask;
    import com.sgweb.svg.nodes.mask.SVGClipMaskParent;
    import com.sgweb.svg.nodes.mask.SVGBlurMaskParent;
    
    import flash.filters.BlurFilter;
    import flash.geom.Matrix;
    
    public class SVGFilterNode extends SVGNode
    {
        
        private var _filters:Array;
        
        public function SVGFilterNode(svgRoot:SVGSVGNode, xml:XML)
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

            while (svgNode) {
                if (  !(svgNode is SVGClipMaskParent)
                   && !(svgNode is SVGBlurMaskParent)
                   && (svgNode.xml.@transform != undefined) ) {
                    oldMatrix = this.parseTransform(svgNode.xml.@transform);
                    oldMatrix.concat(concatMatrix);
                    concatMatrix = oldMatrix;
                }
                if (svgNode is SVGSVGNode) {
                    break;
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
