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
            var matrGrTr:Matrix = this.parseTransform(this.xml.@gradientTransform);

            var cx:Number = 0;
            if (this.xml.@cx != null) {
                cx = Number(this.xml.@cx);
            }
            var cy:Number = 0;
            if (this.xml.@cy != null) {
                cy = Number(this.xml.@cy);
            }
            var fx:Number = 0;
            if (this.xml.@fx != null) {
                fx = Number(this.xml.@fx);
            }
            var fy:Number = 0;
            if (this.xml.@fy != null) {
                fy = Number(this.xml.@fy);
            }
            var r:Number = 0;
            if (this.xml.@r != null) {
                r = Number(this.xml.@r);
            }

            var objectX:Number = 0;
            if (node.xml.@x != null) {
                objectX = Math.round(Number(node.xml.@x));
            }
            var objectY:Number = 0;
            if (node.xml.@y != null) {
                objectY = Math.round(Number(node.xml.@y));
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
