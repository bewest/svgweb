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
    import flash.events.Event;
    import flash.geom.Matrix;
    import flash.display.Graphics;
    import flash.display.GradientType;
    import flash.display.SpreadMethod;
    import flash.display.InterpolationMethod;
    
    public class SVGLinearGradient extends SVGNode
    {                
        public function SVGLinearGradient(xml:XML):void {
            super(xml);
        }    

        /**
         *
         **/
        public function beginGradientFill(svgNode:SVGNode, graphics:Graphics):void {
            var colors:Array = [];
            var alphas:Array = [];
            var ratios:Array = [];
            for (var i:int = 0; i < this.numChildren; i++) {
                if (this.getChildAt(i) is SVGGradientStop) {
                    
                    var stop:SVGGradientStop  = SVGGradientStop(this.getChildAt(i));
                    if (stop.invalidDisplay) {
                        stop.doRedrawNow();
                    }

                    var color:Number = SVGColors.getColor(stop.getStyle('stop-color'));
                    colors.push(color);

                    var alpha:Number = SVGColors.cleanNumber(stop.getStyle('stop-opacity'));
                    alphas.push(alpha);

                    var ratio:Number = SVGColors.cleanNumber(stop.xml.@offset);
                    ratio = ratio * 255;
                    ratios.push(ratio);
                }
            }

            var matrGrTr:Matrix = this.parseMatrix(this.xml.@gradientTransform);


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
            if (svgNode.xml.@x != null) {
                objectX = Math.round(Number(svgNode.xml.@x));
            }
            var objectY:Number = 0;
            if (svgNode.xml.@y != null) {
                objectY = Math.round(Number(svgNode.xml.@y));
            }

            var objectWidth:Number = 0;
            if (svgNode.xml.@width != null) {
                objectWidth = Math.round(Number(svgNode.xml.@width));
            }
            var objectHeight:Number = 0;
            if (svgNode.xml.@height != null) {
                objectHeight = Math.round(Number(svgNode.xml.@height));
            }


            var gradientWidth:Number = Math.abs(x2 - x1);
            var gradientHeight:Number = Math.abs(y2 - y1);

            var dx:Number = x2 - x1;
            var dy:Number = y2 - y1;
            var angle:Number = Math.atan2(dy, dx);

            var tx:Number = (x1 + x2) / 2 - objectX;
            var ty:Number = (y1 + y2) / 2 - objectY;

            var sx:Number = Math.sqrt(gradientWidth*gradientWidth+gradientHeight*gradientHeight) / 1638.4;
            var sy:Number = 1;

            var matr:Matrix= new Matrix();
            matr.scale(sx, sy);
            matr.rotate(angle);
            matr.translate(tx, ty);
            
            if (matrGrTr != null)
                matr.concat(matrGrTr);

            var spreadMethod:String = SpreadMethod.PAD;
            var interpMethod:String = InterpolationMethod.RGB;

            graphics.beginGradientFill(GradientType.LINEAR, colors, alphas, ratios, matr, spreadMethod, interpMethod);

        }



        /**
         *
         **/
        public function lineGradientStyle(svgNode:SVGNode, graphics:Graphics, line_alpha:Number):void {
            var colors:Array = [];
            var alphas:Array = [];
            var ratios:Array = [];
            for (var i:int = 0; i < this.numChildren; i++) {
                if (this.getChildAt(i) is SVGGradientStop) {
                    
                    var stop:SVGGradientStop  = SVGGradientStop(this.getChildAt(i));
                    if (stop.invalidDisplay) {
                        stop.doRedrawNow();
                    }

                    var color:Number = SVGColors.getColor(stop.getStyle('stop-color'));
                    colors.push(color);

                    var alpha:Number = SVGColors.cleanNumber(stop.getStyle('stop-opacity'));
                    alpha = alpha * line_alpha;
                    alphas.push(alpha);

                    var ratio:Number = SVGColors.cleanNumber(stop.xml.@offset);
                    ratio = ratio * 255;
                    ratios.push(ratio);
                }
            }

            var matrGrTr:Matrix = this.parseMatrix(this.xml.@gradientTransform);


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
            if (svgNode.xml.@x != null) {
                objectX = Math.round(Number(svgNode.xml.@x));
            }
            var objectY:Number = 0;
            if (svgNode.xml.@y != null) {
                objectY = Math.round(Number(svgNode.xml.@y));
            }

            var objectWidth:Number = 0;
            if (svgNode.xml.@width != null) {
                objectWidth = Math.round(Number(svgNode.xml.@width));
            }
            var objectHeight:Number = 0;
            if (svgNode.xml.@height != null) {
                objectHeight = Math.round(Number(svgNode.xml.@height));
            }


            var gradientWidth:Number = Math.abs(x2 - x1);
            var gradientHeight:Number = Math.abs(y2 - y1);

            var dx:Number = x2 - x1;
            var dy:Number = y2 - y1;
            var angle:Number = Math.atan2(dy, dx);

            var tx:Number = (x1 + x2) / 2 - objectX;
            var ty:Number = (y1 + y2) / 2 - objectY;

            var sx:Number = Math.sqrt(gradientWidth*gradientWidth+gradientHeight*gradientHeight) / 1638.4;
            var sy:Number = 1;

            var matr:Matrix= new Matrix();
            matr.scale(sx, sy);
            matr.rotate(angle);
            matr.translate(tx, ty);
            
            if (matrGrTr != null)
                matr.concat(matrGrTr);

            var spreadMethod:String = SpreadMethod.PAD;
            var interpMethod:String = InterpolationMethod.RGB;

            graphics.lineGradientStyle(GradientType.LINEAR, colors, alphas, ratios, matr, spreadMethod, interpMethod);

        }
        
        
        
    }
}
