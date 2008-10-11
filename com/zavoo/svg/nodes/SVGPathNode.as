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
    import com.zavoo.svg.utils.EllipticalArc;
    
    import mx.utils.StringUtil;
    
    public class SVGPathNode extends SVGNode
    {        
        private var currentX:Number;
        private var currentY:Number;
        
        private var lastCurveControlX:Number;
        private var lastCurveControlY:Number;
        
        public function SVGPathNode(xml:XML):void {
            super(xml);
        }    
        
        protected override function draw():void {
            //this.graphics.lineStyle(1);
            this.runGraphicsCommands();            
        }
        
        /**
         * Normalize SVG Path Data:
         * Place a comma between each element and number
         * for easy data.split(',');
         */
         
        public function normalizeSVGData(data:String):String {
            data = StringUtil.trim(data);
            
            /* M & Z moved to main regular expression to support multiple occurances */
            //data = data.replace(/^(M)/sig,"$1,");
            //data = data.replace(/(Z)/sig,",$1"); 
            
                        
            data = data.replace(/([MACSLHVQTZ])/sig,",$1,");    
            
            data = data.replace(/-/sg,",-"); // "-" dashes denote a negative number, not a separator        
            data = data.replace(/\s+/sg,","); //Replace spaces with a comma
            data = data.replace(/,{2,}/sg,","); // Remove any extra commas
            data = data.replace(/^,/, ''); //Remove leading comma
            data = data.replace(/,$/, ''); //Remove trailing comma
            return data;
        }
        
        protected override function generateGraphicsCommands():void {
            
            /*this.attributes['stroke-width'] = this.getAttribute('stroke-width', 1);
            //this.attributes['stroke'] = this.getColor(this.getAttribute('stroke', 'black'));
            this.attributes['stroke-dasharray'] = this.getAttribute('stroke-dasharray', 'none');            
            
            // Alphas
            this.attributes['fill-opacity'] = this.getAttribute('fill-opacity', 1);
            this.attributes['stroke-opacity'] = this.getAttribute('stroke-opacity', 1);
            this.attributes['opacity'] = this.getAttribute('opacity', 1);*/
        
            this._graphicsCommands = new  Array();
            
            var pathData:String = this.normalizeSVGData(this._xml.@d);            

            var szSegs:Array = pathData.split(',');
            
            this._graphicsCommands.push(['SF']);
                        
            for(var pos:int = 0; pos < szSegs.length; ) {
                var command:String = szSegs[pos++];                
                                        
                var isAbs:Boolean = false;
                        
                switch(command) {
                    case "M":
                        isAbs = true;
                    case "m":
                        this.moveTo(szSegs[pos++],szSegs[pos++]); // Move is always absolute                
                        while (pos < szSegs.length && !isNaN(Number(szSegs[pos]))) {
                            this.line(szSegs[pos++], szSegs[pos++], isAbs);
                        } 
                        break;
                    case "A":
                        isAbs = true;
                    case "a":
                        do {
                            this.ellipticalArc(szSegs[pos++],szSegs[pos++],szSegs[pos++],szSegs[pos++],szSegs[pos++],szSegs[pos++],szSegs[pos++],isAbs);
                        } while (pos < szSegs.length && !isNaN(Number(szSegs[pos])));
                        break;                        
                    case "C":
                        isAbs = true;
                    case "c":
                        do {
                            this.cubicBezier(szSegs[pos++],szSegs[pos++],szSegs[pos++],szSegs[pos++],szSegs[pos++],szSegs[pos++],isAbs);
                        } while (pos < szSegs.length && !isNaN(Number(szSegs[pos])));
                        break;
                    case "S":
                        isAbs = true;
                    case "s":
                        do {
                            this.cubicBezierSmooth(szSegs[pos++],szSegs[pos++],szSegs[pos++],szSegs[pos++],isAbs);
                        } while (pos < szSegs.length && !isNaN(Number(szSegs[pos])));
                        break;                        
                    case "Q":
                        isAbs = true;
                    case "q":
                        do {
                            this.quadraticBezier(szSegs[pos++],szSegs[pos++],szSegs[pos++],szSegs[pos++],isAbs);
                        } while (pos < szSegs.length && !isNaN(Number(szSegs[pos])));
                        break;
                    case "T":
                        isAbs = true;
                    case "t":
                        do {
                            this.quadraticBezierSmooth(szSegs[pos++],szSegs[pos++],isAbs);
                        } while (pos < szSegs.length && !isNaN(Number(szSegs[pos])));
                        break;
                    case "L":
                        isAbs = true;
                    case "l":
                        do {
                            this.line(szSegs[pos++],szSegs[pos++],isAbs);
                        } while (pos < szSegs.length && !isNaN(Number(szSegs[pos])));
                        break;
                    case "H":
                        isAbs = true;
                    case "h":
                        do {
                            this.lineHorizontal(szSegs[pos++],isAbs);
                        } while (pos < szSegs.length && !isNaN(Number(szSegs[pos])));
                        break;
                    case "V":
                        isAbs = true;
                    case "v":
                        do {
                            this.lineVertical(szSegs[pos++],isAbs);
                        } while (pos < szSegs.length && !isNaN(Number(szSegs[pos])));
                        break;
                    case "Z":
                    case "z":
                        this.closePath();
                        break;            
                                
                    default:
                        trace("Unknown Segment Type: " + command);
                        break;
                }            
            }        
            this._graphicsCommands.push(['EF']);    
        }
        
        private function closePath():void {
            this._graphicsCommands.push(['Z']);
        }
        
        private function moveTo(x:Number, y:Number):void {
            this._graphicsCommands.push(['M', x, y]);
            this.currentX = x;
            this.currentY = y;
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
        }
        
        private function ellipticalArc(rx:Number, ry:Number, xAxisRotation:Number, largeArcFlag:Number, 
                                        sweepFlag:Number, x:Number, y:Number, isAbs:Boolean):void {
            if (!isAbs) {
                x += this.currentX;
                y += this.currentY;
            }
                        
            EllipticalArc.drawArc(rx, ry, xAxisRotation, Boolean(largeArcFlag), Boolean(sweepFlag), x, y, this.currentX, this.currentY, this._graphicsCommands);
            
            this.currentX = x;
            this.currentY = y;
            
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
        }
        
        private function cubicBezierSmooth(x2:Number, y2:Number, x:Number, y:Number, isAbs:Boolean):void {
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
        private function cubicBezier(x1:Number, y1:Number, x2:Number, y2:Number, x:Number, y:Number, isAbs:Boolean):void {

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
