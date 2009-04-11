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


package com.sgweb.svg.core
{
    import com.sgweb.svg.nodes.SVGSVGNode;
    import com.sgweb.svg.nodes.SVGStopNode;
    import com.sgweb.svg.utils.SVGColors;

    import flash.display.DisplayObject;
    import flash.display.SpreadMethod;
    import flash.geom.Matrix;

    public class SVGGradient extends SVGNode
    {

        public function SVGGradient(svgRoot:SVGSVGNode, xml:XML = null, original:SVGNode = null):void {
            super(svgRoot, xml, original);
        }

        public function beginGradientFill(node:SVGNode):void {

        }

        public function lineGradientStyle(node:SVGNode, line_alpha:Number = 1):void {

        }

        public function getSpreadMethod():String {
            var spreadMethod:String = SpreadMethod.PAD;

            var attr:String = this.getAttribute('spreadMethod');
            if (attr == 'reflect') {
                spreadMethod = SpreadMethod.REFLECT;
            }
            else if (attr == 'repeat') {
                spreadMethod = SpreadMethod.REPEAT;
            }

            return spreadMethod;
        }

        public function getStopData(line_alpha:Number = 1):Object {

            var href:String = this.getAttribute("href");

            if (href) {
               href = href.substr(1);
               var node:SVGNode = this.svgRoot.getNode(href);
               if (node is SVGGradient) {
                   return SVGGradient(node).getStopData();
               }
            }

            var stopData:Object = new Object();

            var colors:Array = new Array();
            var ratios:Array = new Array();
            var alphas:Array = new Array();

            var color:String;
            var ratio:String;
            var alpha:String;
            var ratioNum:Number;


            var match:Array;
            var child:DisplayObject;
            var currentRatio:Number;

            for (var i:uint = 0; i < drawSprite.numChildren; i++) {
                child = drawSprite.getChildAt(i);
                if (child is SVGStopNode) {
                    color = SVGStopNode(child).getAttribute('stop-color', 'black');
                    if (color == 'currentColor') {
                        color = this.getAttribute('color');
                    }
                    ratio = SVGStopNode(child).getAttribute('offset', '0');
                    alpha = SVGStopNode(child).getAttribute('stop-opacity', 1);

                    match = ratio.match(/([^%]+)%/s);
                    if (match) {
                        ratioNum = 255 * (SVGColors.cleanNumber(match[1]) / 100);
                    }
                    else {
                        ratioNum = 255 * SVGColors.cleanNumber(ratio);
                    }

                    colors.push(SVGColors.getColor(color));
                    ratios.push(ratioNum);
                    alphas.push(SVGColors.cleanNumber(alpha) * line_alpha);
                }
            }

            stopData['colors'] = colors;
            stopData['ratios'] = ratios;
            stopData['alphas'] = alphas;

            return stopData;
        }

        /**
         *
         * This method supports href inheritence of attributes from base nodes of the same type.
         *
         **/
        override protected function _getAttribute(name:String):String {

            var value:String = super._getAttribute(name);
            if (value) {
                return value;
            }

            var href:String = this._xml.@xlink::href;
            if (!href || href=='') {
                href = this._xml.@href;
            }

            if (href && href != '') {
                href = href.replace(/^#/,'');

                var baseNode:SVGNode = this.svgRoot.getNode(href);
                if (baseNode) {
                    // Return value from href base node, perhaps recursively.
                    // XXX possible circular reference problem.
                    return baseNode.getAttribute(name, null, false);
                }
                else {
                    // Href is not (yet) parsed, just return value for this node
                    return value;
                }
            }
            else {
                // No href, just return value for this node
                return value;
            }

        }


    }
}
