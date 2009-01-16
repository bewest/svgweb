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
    import flash.utils.getTimer;
    
    public class SVGAnimateNode extends SVGNode
    {
        private const REPEAT_INFINITE:int = -1;
        
        private const STATE_BEGIN:int = 0;
        private const STATE_RUN:int = 1;
        private const STATE_END:int = 2;
        
        private var _state:int;
        
        private var _field:String;
        
        private var _fromValString:String;
        private var _toValString:String;
        private var _byValString:String;    
        
        private var _fromVal:Number;
        private var _toVal:Number;    
        private var _valSpan:Number
        
        private var _startTime:int;
        
        private var _begin:int;
        private var _duration:int;
        private var _end:int;
                
        private var _repeat:int;
        
        
        public function SVGAnimateNode(svgRoot:SVGRoot, xml:XML):void {
            super(svgRoot, xml);        
        }    
        
        override protected function draw():void {        
            if (isChildOfDef())
                return;
                        
            this._field = this.getAttribute('attributeName');
                        
            this._fromValString = this.getAttribute('from');
            this._toValString = this.getAttribute('to');
            this._byValString = this.getAttribute('by');
                        
            var begin:String = this.getAttribute('begin');    
            this._begin = timeToMilliseconds(begin);
                    
            var duration:String = this.getAttribute('dur');
            this._duration =  timeToMilliseconds(duration);
            
            var end:String = this.getAttribute('end');
            this._end = this._begin + this._duration;
            if (end) {
                this._end = timeToMilliseconds(end);
            }            
            if (this._end < (this._begin + this._duration)) {
                this._end = this._begin + this._duration;
            }
            
            var repeat:String = this.getAttribute('repeatCount');
            var repeatInt:int;
            
            if (repeat == 'indefinite') {
                repeatInt = REPEAT_INFINITE;
            }
            else {
                repeatInt = SVGColors.cleanNumber(repeat);
            }
            
            this._repeat = repeatInt;
            
            this._state = this.STATE_BEGIN;
            this.addEventListener(Event.ENTER_FRAME, renderTween);
            
        }
        
        private function timeToMilliseconds(value:String):Number {
            return (SVGColors.cleanNumber(value) * 1000);
        }        
        
        private function renderTween(event:Event):void {
            var time:int = getTimer();
            
            var timeElapsed:int = time - this._startTime;
            
            
            if (timeElapsed < this._begin) {
                return;
            }
                        
            if (this._state == this.STATE_BEGIN) {        
                                
                this._fromVal = (this._fromValString) ? SVGColors.cleanNumber(this._fromValString) : SVGColors.cleanNumber(SVGNode(this.parent).getStyle(this._field));
                this._toVal = (this._byValString) ? this._fromVal + SVGColors.cleanNumber(this._byValString) : this._toVal = SVGColors.cleanNumber(this._toValString);
                this._valSpan = this._toVal - this._fromVal;
                
                this._state = this.STATE_RUN;
            }
            
            var runTime:int = timeElapsed - this._begin;
            var newVal:Number;
                
            if (runTime < this._duration) {
                var factor:Number = runTime / this._duration;
                newVal = this._fromVal + (factor * this._valSpan);
                SVGNode(this.parent).setStyle(this._field, newVal.toString());
            }
            else {
                newVal = this._toVal;
                if (this._state == this.STATE_RUN) {
                    SVGNode(this.parent).setStyle(this._field, newVal.toString());                    
                }
                this._state = this.STATE_END;
                if (timeElapsed > this._end) {
                    if (this._repeat == 0) {
                        this.removeEventListener(Event.ENTER_FRAME, renderTween);                        
                    }
                    else {
                        if (this._repeat > 0) {
                            this._repeat--;
                        }
                        
                        this._startTime += this._end;
                        this._state = this.STATE_BEGIN;
                    }
                }
            }
             
        }        
        
    }
}
