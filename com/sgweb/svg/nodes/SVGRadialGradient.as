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

            /*
               See the comment in SVGLinearGradient.getMatrix() for an 
               explanation of the matrix calculations.
            */
            var matr:Matrix= new Matrix();

            if (gradientUnits == 'userSpaceOnUse') {
                var cx:Number = Math.round(SVGColors.cleanNumber2(cxString, SVGNode(node.parent).getWidth()));
                var cy:Number = Math.round(SVGColors.cleanNumber2(cyString, SVGNode(node.parent).getHeight()));
                var r:Number  = Math.round(SVGColors.cleanNumber2(rString, SVGNode(node.parent).getWidth()));

                var sx:Number = r*2 / 1638.4;
                var sy:Number = r*2 / 1638.4;

                matr.scale(sx, sy);
                matr.translate(cx, cy);
                if (matrGrTr != null) {
                    matr.concat(matrGrTr);
                }
                matr.translate(-objectX, -objectY);

                return matr;
            }
            else {
                // objectBoundingBox units

                // Get node height and width in user space
                var w:Number = node.xMax - node.xMin;
                var h:Number = node.yMax - node.yMin;

                // Get the gradient position and area
                if (cxString.search('%') > -1) {
                    cx = SVGColors.cleanNumber(cxString) / 100;
                }
                else {
                    cx = SVGColors.cleanNumber(cxString);
                }
                if (cyString.search('%') > -1) {
                    cy = SVGColors.cleanNumber(cyString) / 100;
                }
                else {
                    cy = SVGColors.cleanNumber(cyString);
                }
                if (rString.search('%') > -1) {
                    r =  SVGColors.cleanNumber(rString) / 100;
                }
                else {
                    r = SVGColors.cleanNumber(rString);
                }

                // Scale from flash gradient size (819.2) to bounding box size (.5)
                matr.scale(.5/819.2, .5/819.2);

                // Move to the center of the bounding box
                matr.translate(.5, .5);

                // Scale the size of flash vector (.5) to the size of the SVG vector in boundingBox units (r)
                matr.scale(r/.5, r/.5);

                // Scale from objectBoundingBox units to user space
                matr.scale(w, h);

                // Move to the starting gradient position in user space
                matr.translate(w*(cx-r), h*(cy-r));

                // Now apply the gradientMatrix, if specified
                // xxx needs testing
                if (matrGrTr != null)
                    matr.concat(matrGrTr);

                return matr;
            }

        }

    }
}
