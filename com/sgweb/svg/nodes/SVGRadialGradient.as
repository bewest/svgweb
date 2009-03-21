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
    import com.sgweb.svg.core.SVGGradient;
    import com.sgweb.svg.utils.SVGColors;
    import flash.events.Event;
    import flash.geom.Matrix;
    import flash.display.GradientType;
    import flash.display.InterpolationMethod;

    
    public class SVGRadialGradient extends SVGGradient
    {                
        public function SVGRadialGradient(svgRoot:SVGSVGNode, xml:XML, original:SVGNode = null):void {
            super(svgRoot, xml, original);
        }

        override public function beginGradientFill(node:SVGNode):void {
            var stopData:Object = this.getStopData();
            var spreadMethod:String = this.getSpreadMethod();
            var matrix:Matrix = this.getMatrix(node);

            if (stopData.colors.length > 0) { //Don't fill if there are no stops
                node.graphics.beginGradientFill(GradientType.RADIAL, stopData.colors, stopData.alphas, stopData.ratios, matrix, spreadMethod, InterpolationMethod.RGB);
            }

        }

        override public function lineGradientStyle(node:SVGNode, line_alpha:Number = 1):void {
            var stopData:Object = this.getStopData(line_alpha);
            var spreadMethod:String = this.getSpreadMethod();
            var matrix:Matrix = this.getMatrix(node);

            if (stopData.colors.length > 0) { //Don't fill if there are no stops
                node.graphics.lineGradientStyle(GradientType.RADIAL, stopData.colors, stopData.alphas, stopData.ratios, matrix, spreadMethod, InterpolationMethod.RGB);
            }
        }

        public function getMatrix(node:SVGNode):Matrix {
            var matrGrTr:Matrix = this.parseTransform(this.getAttribute('gradientTransform'));
            var gradientUnits:String = this.getAttribute('gradientUnits', 'objectBoundingBox', false);

            var xString:Number = node.getAttribute('x', '0', false);
            var objectX:Number = Math.round(SVGColors.cleanNumber2(xString, SVGNode(node.parent).getWidth()));
            var yString:Number = node.getAttribute('y', '0', false);
            var objectY:Number = Math.round(SVGColors.cleanNumber2(yString, SVGNode(node.parent).getHeight()));

            var cxString:String = this.getAttribute('cx', '50%', false);
            var cyString:String = this.getAttribute('cy', '50%', false);
            var rString:String = this.getAttribute('r', '50%', false);

            if (gradientUnits == 'userSpaceOnUse') {
                var cx:Number = Math.round(SVGColors.cleanNumber2(cxString, SVGNode(node.parent).getWidth()));
                var cy:Number = Math.round(SVGColors.cleanNumber2(cyString, SVGNode(node.parent).getHeight()));
                var r:Number  = Math.round(SVGColors.cleanNumber2(rString, SVGNode(node.parent).getWidth()));
            }
            else {
                var w:Number = node.xMax - node.xMin;
                var h:Number = node.yMax - node.yMin;
                cx = objectX + node.xMin + Math.round(SVGColors.cleanNumber2(cxString, w));
                cy = objectY + node.yMin + Math.round(SVGColors.cleanNumber2(cyString, h));
                r = Math.round(SVGColors.cleanNumber2(rString, w));
            }

            var tx:Number = cx;
            var ty:Number = cy;

            var sx:Number = r*2 / 1638.4;
            var sy:Number = r*2 / 1638.4;

            var matr:Matrix= new Matrix();
            matr.scale(sx, sy);
            matr.translate(tx, ty);
            if (matrGrTr != null) {
                matr.concat(matrGrTr);
            }
            matr.translate(-objectX, -objectY);
            return matr;
        }

    }
}
