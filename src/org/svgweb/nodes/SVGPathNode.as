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

package org.svgweb.nodes
{
    import org.svgweb.utils.EllipticalArc;
    import org.svgweb.core.SVGNode;
    
    import mx.utils.StringUtil;
    
    public class SVGPathNode extends SVGNode
    {        
        private var currentX:Number;
        private var currentY:Number;
        
        private var startX:Number;
        private var startY:Number;

        private var lastCurveControlX:Number;
        private var lastCurveControlY:Number;
        
        public function SVGPathNode(svgRoot:SVGSVGNode, xml:XML, original:SVGNode = null):void {
            super(svgRoot, xml, original);
        }
        
        /**
         * Normalize SVG Path Data into an array we can work with.
         */
        public function normalizeSVGData():Array {
            // NOTE: This code is very performance sensitive and was 
            // a bottleneck affecting page load; rewritten to not use
            // regular expressions as well as other tricks that were shown
            // to be faster (like caching data.length, parsing right into
            // an array instead of an intermediate string, etc.).
            // Be careful when changing this code without seeing what the
            // performance is before and after. See 
            // Issue 229 for details:
            // "Speedup page load time of MichaelN's static map page on IE"
            // http://code.google.com/p/svgweb/issues/detail?id=229
            
            //var totalTime:int = new Date().getTime();
            
            var data:String = this.getAttribute('d');
            data = StringUtil.trim(data);
            
            // In the algorithm below, we are doing a few things. It is
            // unfortunately complicated but it was found to be the primary
            // bottleneck when dealing with lots of PATH statements. 
            // We use the charCode since as a number it is much faster than
            // dealing with strings. We test the value against the Unicode
            // values for the numerical and alphabetical ranges for our 
            // commands, which is fast. We also order our IF statements from
            // most common (numbers) to least common (letter commands). Testing
            // also paradoxically found that simply building up another 
            // string is much faster than having an intermediate array; arrays
            // in ActionScript are very slow, and the final split() method 
            // is very fast at producing an array we can work with
            var results:String = '';
            var dataLength:int = data.length; // found to be faster
            var c:String;
            var code:Number;
            var i:int = 0;
            while (i < dataLength) {
                code = data.charCodeAt(i);

                // from most common to least common encountered
                
                if ((code >= 48 && code <= 57) || code == 45 || code == 101 || code == 46) {
                    // 0 through 9, -, e-, or .
                    do {
                        results += data.charAt(i);
                        i++;
                        code = data.charCodeAt(i);
                    } while (((code >= 48 && code <= 57) || code == 46) && code);
                    results += ',';
                } else if (code == 44 || code == 32 || code == 10 || code == 13) {
                    // just ignore delimiters since we are adding in our own
                    // in the correct places
                    i++;
                } else if (code >= 65 && code <= 122) {
                    // A-Z and a-z
                    results += data.charAt(i) + ',';
                    i++;
                } else {
                    // unknown character
                    i++;
                }
            }
            
            // remove trailing comma, but outside of big loop above
            if (results.charAt(results.length - 1) == ',') {
                results = results.substring(0, results.length - 1);
            }
            
            return results.split(',');
        }
        
        protected override function generateGraphicsCommands():void {
            //var startTime:int = new Date().getTime();
            //var pieceTime:int;
            this._graphicsCommands = new Array();
            
            var command:String;

            var lineAbs:Boolean;
            var isAbs:Boolean;

            //pieceTime = new Date().getTime();
            var szSegs:Array = this.normalizeSVGData();
            //increment('generateGraphicsCommands_normalizeSVGData', (new Date().getTime() - pieceTime));   
            
            this._graphicsCommands.push(['SF']);

            var firstMove:Boolean = true;
            var loopTime:int = new Date().getTime();
            var szSegsLength:int = szSegs.length;
            for(var pos:int = 0; pos < szSegsLength; ) {             
                command = szSegs[pos++];                
                                        
                isAbs = false;
                        
                switch(command) {
                    case "M":
                        isAbs = true;
                    case "m":
                        lineAbs = isAbs;
                        if (firstMove) { //If first move is 'm' treat as absolute
                            isAbs = true;
                            firstMove = false;
                        }
                        this.moveTo(szSegs[pos++],szSegs[pos++], isAbs);
                        while (!isNaN(Number(szSegs[pos])) && pos < szSegsLength) {
                            this.line(szSegs[pos++], szSegs[pos++], lineAbs);
                        }
                        break;
                    case "A":
                        isAbs = true;
                    case "a":
                        do {
                            this.ellipticalArc(szSegs[pos++],szSegs[pos++],szSegs[pos++],
                                               szSegs[pos++],szSegs[pos++],szSegs[pos++],szSegs[pos++],isAbs);
                        } while (!isNaN(Number(szSegs[pos])) && pos < szSegsLength);
                        break;                        
                    case "C":
                        isAbs = true;
                    case "c":
                        do {
                            this.cubicBezier(szSegs[pos++],szSegs[pos++],szSegs[pos++],
                                             szSegs[pos++],szSegs[pos++],szSegs[pos++],isAbs);
                        } while (!isNaN(Number(szSegs[pos])) && pos < szSegsLength);
                        break;
                    case "S":
                        isAbs = true;
                    case "s":
                        do {
                            this.cubicBezierSmooth(szSegs[pos++],szSegs[pos++],szSegs[pos++],szSegs[pos++],isAbs);
                        } while (!isNaN(Number(szSegs[pos])) && pos < szSegsLength);
                        break;                        
                    case "Q":
                        isAbs = true;
                    case "q":
                        do {
                            this.quadraticBezier(szSegs[pos++],szSegs[pos++],szSegs[pos++],szSegs[pos++],isAbs);
                        } while (!isNaN(Number(szSegs[pos])) && pos < szSegsLength);
                        break;
                    case "T":
                        isAbs = true;
                    case "t":
                        do {
                            this.quadraticBezierSmooth(szSegs[pos++],szSegs[pos++],isAbs);
                        } while (!isNaN(Number(szSegs[pos])) && pos < szSegsLength);
                        break;
                    case "L":
                        isAbs = true;
                    case "l":
                        do {
                            this.line(szSegs[pos++],szSegs[pos++],isAbs);
                        } while (!isNaN(Number(szSegs[pos])) && pos < szSegsLength);
                        break;
                    case "H":
                        isAbs = true;
                    case "h":
                        do {
                            this.lineHorizontal(szSegs[pos++],isAbs);
                        } while (!isNaN(Number(szSegs[pos])) && pos < szSegsLength);
                        break;
                    case "V":
                        isAbs = true;
                    case "v":
                        do {
                            this.lineVertical(szSegs[pos++],isAbs);
                        } while (!isNaN(Number(szSegs[pos])) && pos < szSegsLength);
                        break;
                    case "Z":
                        isAbs = true;
                    case "z":
                        this.closePath();
                        while (!isNaN(Number(szSegs[pos])) && pos < szSegsLength) {
                            this.line(szSegs[pos++], szSegs[pos++], isAbs);
                        }
                        break;            
                                
                    default:
                        trace("Unknown Segment Type: " + command);
                        break;
                }            
            }        
            this._graphicsCommands.push(['EF']); 
            
            //increment('generateGraphicsCommands_totalLoop', (new Date().getTime() - loopTime)); 
            //increment('generateGraphicsCommands_path', (new Date().getTime() - startTime));   
        }
        
        private function closePath():void {
            this._graphicsCommands.push(['Z']);

            this.currentX = this.startX;
            this.currentY = this.startY;
        }
        
        private function moveTo(x:Number, y:Number, isAbs:Boolean):void {
            if (!isAbs) {
                x += this.currentX;
                y += this.currentY;
            }

            this._graphicsCommands.push(['M', x, y]);
            this.currentX = x;
            this.currentY = y;
            
            this.startX = x;
            this.startY = y;

            this.lastCurveControlX = this.currentX;
            this.lastCurveControlY = this.currentY;

            this.setXMinMax(x);
            this.setYMinMax(y);
        }
        
        private function lineHorizontal(x:Number, isAbs:Boolean):void {
            var y:Number = this.currentY;
            if (!isAbs) {
                x += this.currentX;
                isAbs = true;
            }
            this.line(x,y,isAbs);            
        }
        
        private function lineVertical(y:Number, isAbs:Boolean):void {
            var x:Number = this.currentX;
            if (!isAbs) {
                y += this.currentY;
                isAbs = true;
            }
            this.line(x,y,isAbs);            
        }
        
        private function line(x:Number, y:Number, isAbs:Boolean):void {
            if (isAbs) {
                this.currentX = x;
                this.currentY = y;
            }
            else {
                this.currentX += x;
                this.currentY += y;                
            }            
            this._graphicsCommands.push(['L', this.currentX, this.currentY]);

            this.lastCurveControlX = this.currentX;
            this.lastCurveControlY = this.currentY;        

            this.setXMinMax(x);
            this.setYMinMax(y);
        }
        
        private function ellipticalArc(rx:Number, ry:Number, xAxisRotation:Number, largeArcFlag:Number, 
                                        sweepFlag:Number, x:Number, y:Number, isAbs:Boolean):void {
            if (!isAbs) {
                x += this.currentX;
                y += this.currentY;
            }
                        
            EllipticalArc.drawArc(rx, ry, xAxisRotation, Boolean(largeArcFlag), Boolean(sweepFlag),
                                  x, y, this.currentX, this.currentY, this._graphicsCommands);
            
            this.currentX = x;
            this.currentY = y;
            
            this.lastCurveControlX = this.currentX;
            this.lastCurveControlY = this.currentY;
            
            this.setXMinMax(rx);
            this.setYMinMax(ry);
            this.setXMinMax(x);
            this.setYMinMax(y);
        }
        
        private function quadraticBezierSmooth(x:Number, y:Number, isAbs:Boolean):void {
            var x1:Number = this.currentX + (this.currentX - this.lastCurveControlX);
            var y1:Number = this.currentY + (this.currentY - this.lastCurveControlY);
            
            if (!isAbs)
            {
                x+= this.currentX;
                y+= this.currentY;
                
                isAbs = true;
            }
            
            this.quadraticBezier(x1, y1, x, y, isAbs);
        }
        
        private function quadraticBezier(x1:Number, y1:Number, x:Number, y:Number, isAbs:Boolean):void {
            
            if (!isAbs) {
                x1 += this.currentX;
                y1 += this.currentY;
                x += this.currentX;
                y+= this.currentY;
            }
            
            this._graphicsCommands.push(['C',x1, y1, x, y]);    
            
            this.currentX = x;
            this.currentY = y;
            
            this.lastCurveControlX = x1;
            this.lastCurveControlY = y1;

            this.setXMinMax(x);
            this.setYMinMax(y);
            this.setXMinMax(x1);
            this.setYMinMax(y1);
        }
        
        private function cubicBezierSmooth(x2:Number, y2:Number,
                                           x:Number, y:Number, isAbs:Boolean):void {
            var x1:Number = this.currentX + (this.currentX - this.lastCurveControlX);
            var y1:Number = this.currentY + (this.currentY - this.lastCurveControlY);
            if (!isAbs)
            {
                x2 += this.currentX;
                y2 += this.currentY;                
                x+= this.currentX;
                y+= this.currentY;
                
                isAbs = true;
            }
            
            this.cubicBezier(x1, y1, x2, y2, x, y, isAbs);
        }
        private function cubicBezier(x1:Number, y1:Number, x2:Number, y2:Number,
                                     x:Number, y:Number, isAbs:Boolean):void {

            if (!isAbs) {
                x1 += this.currentX;
                y1 += this.currentY;
                x2 += this.currentX;
                y2 += this.currentY;
                x += this.currentX;
                y += this.currentY;
            }
            
            var P0:Object = {x:this.currentX, y:this.currentY};
            var P1:Object = {x:x1, y:y1};
            var P2:Object = {x:x2, y:y2};
            var P3:Object = {x:x, y:y};
        
            /* A portion of code from Bezier_lib.as by Timothee Groleau */
            // calculates the useful base points
            var PA:Object = getPointOnSegment(P0, P1, 3/4);
            var PB:Object = getPointOnSegment(P3, P2, 3/4);
            
            // get 1/16 of the [P3, P0] segment
            var dx:Number = (P3.x - P0.x)/16;
            var dy:Number = (P3.y - P0.y)/16;
            
            // calculates control point 1
            var Pc_1:Object = getPointOnSegment(P0, P1, 3/8);
            
            // calculates control point 2
            var Pc_2:Object = getPointOnSegment(PA, PB, 3/8);
            Pc_2.x -= dx;
            Pc_2.y -= dy;
            
            // calculates control point 3
            var Pc_3:Object = getPointOnSegment(PB, PA, 3/8);
            Pc_3.x += dx;
            Pc_3.y += dy;
            
            // calculates control point 4
            var Pc_4:Object = getPointOnSegment(P3, P2, 3/8);
            
            // calculates the 3 anchor points
            var Pa_1:Object = getMiddle(Pc_1, Pc_2);
            var Pa_2:Object = getMiddle(PA, PB);
            var Pa_3:Object = getMiddle(Pc_3, Pc_4);
            
            // draw the four quadratic subsegments
            this._graphicsCommands.push(['C', Pc_1.x, Pc_1.y, Pa_1.x, Pa_1.y]);
            this._graphicsCommands.push(['C', Pc_2.x, Pc_2.y, Pa_2.x, Pa_2.y]);
            this._graphicsCommands.push(['C', Pc_3.x, Pc_3.y, Pa_3.x, Pa_3.y]);
            this._graphicsCommands.push(['C', Pc_4.x, Pc_4.y, P3.x, P3.y]);        

            this.currentX = x;
            this.currentY = y;
            
            this.lastCurveControlX = x2;
            this.lastCurveControlY = y2;            

            //Width/height calculations for gradients
            this.setXMinMax(Pc_1.x);
            this.setYMinMax(Pc_1.y);
            this.setXMinMax(Pa_1.x);
            this.setYMinMax(Pa_1.y);

            this.setXMinMax(Pc_2.x);
            this.setYMinMax(Pc_2.y);
            this.setXMinMax(Pa_2.x);
            this.setYMinMax(Pa_2.y);

            this.setXMinMax(Pc_3.x);
            this.setYMinMax(Pc_3.y);
            this.setXMinMax(Pa_3.x);
            this.setYMinMax(Pa_3.y);

            this.setXMinMax(Pc_4.x);
            this.setYMinMax(Pc_4.y);
            this.setXMinMax(P3.x);
            this.setYMinMax(P3.y);
        }    
        
        private function getMiddle(P0:Object, P1:Object):Object
        {
            /* A portion of code from Bezier_lib.as by Timothee Groleau */
            return {x: ((P0.x + P1.x) / 2), y: ((P0.y + P1.y) / 2)};
        }    
        
        private function getPointOnSegment(P0:Object, P1:Object, ratio:Number):Object 
        {
            /* A portion of code from Bezier_lib.as by Timothee Groleau */
            return {x: (P0.x + ((P1.x - P0.x) * ratio)), y: (P0.y + ((P1.y - P0.y) * ratio))};
        }                            
    }
}
