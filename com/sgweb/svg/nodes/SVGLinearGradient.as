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
    
    public class SVGLinearGradient extends SVGGradient
    {                
        public function SVGLinearGradient(svgRoot:SVGSVGNode, xml:XML, original:SVGNode = null):void {
            super(svgRoot, xml, original);
        }

        override public function beginGradientFill(node:SVGNode):void {
            var stopData:Object = this.getStopData();
            var spreadMethod:String = this.getSpreadMethod();
            var matrix = this.getMatrix(node);

            if (stopData.colors.length == 1) { //Solid color fill
                node.graphics.beginFill(stopData.colors[stopData.colors.length-1], stopData.alphas[stopData.colors.length-1]);
            }
            else if (stopData.colors.length > 0) { //Don't fill if there are no stops
                node.graphics.beginGradientFill(GradientType.LINEAR, stopData.colors, stopData.alphas, stopData.ratios, matrix, spreadMethod, InterpolationMethod.RGB);
            }

        }

        override public function lineGradientStyle(node:SVGNode, line_alpha:Number = 1):void {
            var stopData:Object = this.getStopData(line_alpha);
            var spreadMethod:String = this.getSpreadMethod();
            var matrix = this.getMatrix(node);

            if (stopData.colors.length == 1) { //Solid color fill
                node.graphics.lineStyle(node.getAttribute('stroke-width'), stopData.colors[stopData.colors.length-1], stopData.alphas[stopData.colors.length-1]);
            }
            else if (stopData.colors.length > 0) { //Don't fill if there are no stops
                node.graphics.lineGradientStyle(GradientType.LINEAR, stopData.colors, stopData.alphas, stopData.ratios, matrix, spreadMethod, InterpolationMethod.RGB);
            }

        }

        protected function getMatrix(node:SVGNode):Matrix {
            var matrGrTr:Matrix = this.parseTransform(this.xml.@gradientTransform);

            var x1:Number = 0;
            if (this.xml.@x1 != null) {
                x1 = Math.round(Number(this.xml.@x1));
            }
            var y1:Number = 0;
            if (this.xml.@y1 != null) {
                y1 = Math.round(Number(this.xml.@y1));
            }
            var x2:Number = 0;
            if (this.xml.@x2 != null) {
                x2 = Math.round(Number(this.xml.@x2));
            }
            var y2:Number = 0;
            if (this.xml.@y2 != null) {
                y2 = Math.round(Number(this.xml.@y2));
            }

            var objectX:Number = 0;
            if (node.xml.@x != null) {
                objectX = Math.round(Number(node.xml.@x));
            }
            var objectY:Number = 0;
            if (node.xml.@y != null) {
                objectY = Math.round(Number(node.xml.@y));
            }

            var gradientWidth:Number = Math.abs(x2 - x1);
            var gradientHeight:Number = Math.abs(y2 - y1);

            var dx:Number = x2 - x1;
            var dy:Number = y2 - y1;
            var angle:Number = Math.atan2(dy, dx);

            // Disabled because i am currently doing the object adjustment at the
            // end, which seems to be necessary for radial gradients, but it is not
            // clear what the difference is. I will do it the same as radials to
            // be consistent, and on the hunch that it is correct.
            //var tx:Number = (x1 + x2) / 2 - objectX;
            //var ty:Number = (y1 + y2) / 2 - objectY;
            var tx:Number = (x1 + x2) / 2;
            var ty:Number = (y1 + y2) / 2;

            var sx:Number = Math.sqrt(gradientWidth*gradientWidth+gradientHeight*gradientHeight) / 1638.4;
            var sy:Number = 1;

            var matr:Matrix= new Matrix();
            matr.scale(sx, sy);
            matr.rotate(angle);
            matr.translate(tx, ty);

            if (matrGrTr != null)
                matr.concat(matrGrTr);

            matr.translate(-objectX, -objectY);
            return matr;
        }

        
        
    }
}
