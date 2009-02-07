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
    import com.sgweb.svg.data.SVGColors;
    import flash.events.Event;
    import flash.geom.Matrix;
    import flash.display.Graphics;
    import flash.display.GradientType;
    import flash.display.SpreadMethod;
    
    public class SVGRadialGradient extends SVGNode
    {                
        public function SVGRadialGradient(svgRoot:SVGRoot, xml:XML):void {
            super(svgRoot, xml);
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

                    var color:Number = SVGColors.getColor(stop.getAttribute('stop-color'));
                    colors.push(color);

                    var stopOpacity:String = stop.getAttribute('stop-opacity');
                    if (stopOpacity == null)
                        stopOpacity="1";
                    var alpha:Number = SVGColors.cleanNumber(stopOpacity);
                    alphas.push(alpha);

                    var ratio:Number = SVGColors.cleanNumber(stop.xml.@offset);
                    ratio = ratio * 255;
                    ratios.push(ratio);
                }
            }


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
            if (svgNode.xml.@x != null) {
                objectX = Math.round(Number(svgNode.xml.@x));
            }
            var objectY:Number = 0;
            if (svgNode.xml.@y != null) {
                objectY = Math.round(Number(svgNode.xml.@y));
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


            var spreadMethod:String = SpreadMethod.PAD;
            if (this.xml.@['spreadMethod'] == 'reflect') {
                spreadMethod = SpreadMethod.REFLECT;
            }
            if (this.xml.@['spreadMethod'] == 'repeat') {
                spreadMethod = SpreadMethod.REPEAT;
            }

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

                    var color:Number = SVGColors.getColor(stop.getAttribute('stop-color'));
                    colors.push(color);

                    var stopOpacity:String = stop.getAttribute('stop-opacity');
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
            if (svgNode.xml.@x != null) {
                objectX = Math.round(Number(svgNode.xml.@x));
            }
            var objectY:Number = 0;
            if (svgNode.xml.@y != null) {
                objectY = Math.round(Number(svgNode.xml.@y));
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


            var spreadMethod:String = SpreadMethod.PAD;
            if (this.xml.@['spreadMethod'] == 'reflect') {
                spreadMethod = SpreadMethod.REFLECT;
            }
            if (this.xml.@['spreadMethod'] == 'repeat') {
                spreadMethod = SpreadMethod.REPEAT;
            }

            graphics.lineGradientStyle(GradientType.RADIAL, colors, alphas, ratios, matr, spreadMethod, "RGB", 0);
        } 
    }
}
