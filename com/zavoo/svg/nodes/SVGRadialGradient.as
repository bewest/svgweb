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
    
    public class SVGRadialGradient extends SVGNode
    {                
        public function SVGRadialGradient(xml:XML):void {
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

                    var stopOpacity:String = stop.getStyle('stop-opacity');
                    if (stopOpacity == null)
                        stopOpacity="1";
                    var alpha:Number = SVGColors.cleanNumber(stopOpacity);
                    alphas.push(alpha);

                    var ratio:Number = SVGColors.cleanNumber(stop.xml.@offset);
                    ratio = ratio * 255;
                    ratios.push(ratio);
                }
            }


            var matrGrTr:Matrix = this.parseMatrix(this.xml.@gradientTransform);


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

/*

            var x2:Number = cx - r;
            var x1:Number = cx + r;
            var y2:Number = cy - r;
            var y1:Number = cy + r;

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
*/

            // XXX Assume no rotation and focal center == gradient box center
            var matr:Matrix= new Matrix();
            matr.createGradientBox(r*2, r*2, 0, 0, 0);
            matr.tx = cx;
            matr.ty = cy;

            if (matrGrTr != null) {
                matr.concat(matrGrTr);
            }


            var spreadMethod:String = SpreadMethod.PAD;

            graphics.beginGradientFill(GradientType.RADIAL, colors, alphas, ratios, matr, spreadMethod, "RGB", 0);
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

                    var stopOpacity:String = stop.getStyle('stop-opacity');
                    if (stopOpacity == null)
                        stopOpacity="1";
                    var alpha:Number = SVGColors.cleanNumber(stopOpacity);
                    alpha = alpha * line_alpha;
                    alphas.push(alpha);

                    var ratio:Number = SVGColors.cleanNumber(stop.xml.@offset);
                    ratio = ratio * 255;
                    ratios.push(ratio);
                }
            }


            var matrGrTr:Matrix = this.parseMatrix(this.xml.@gradientTransform);


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

/*

            var x2:Number = cx - r;
            var x1:Number = cx + r;
            var y2:Number = cy - r;
            var y1:Number = cy + r;

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
*/

            // XXX Assume no rotation and focal center == gradient box center
            var matr:Matrix= new Matrix();
            matr.createGradientBox(r*2, r*2, 0, 0, 0);
            matr.tx = cx;
            matr.ty = cy;

            if (matrGrTr != null) {
                matr.concat(matrGrTr);
            }


            var spreadMethod:String = SpreadMethod.PAD;

            graphics.lineGradientStyle(GradientType.RADIAL, colors, alphas, ratios, matr, spreadMethod, "RGB", 0);
        } 
    }
}
