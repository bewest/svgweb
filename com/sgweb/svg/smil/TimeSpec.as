/*
 Copyright (c) 2009 by contributors:

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

package com.sgweb.svg.smil
{

    import flash.events.Event;
    import com.sgweb.svg.utils.SVGUnits;
    import com.sgweb.svg.smil.TimeInterval;
    import com.sgweb.svg.core.SVGNode;

    public class TimeSpec
    {

        protected var intervals:Array = new Array();

        public function addInterval(interval:TimeInterval) {
            this.intervals.push(interval);
        }

        public function getIntervals():Array {
            return this.intervals;
        }

        static public function parseTimeSpec(timeSpecString:String, node:SVGNode):TimeSpec {
            if (timeSpecString.indexOf("wallclock") != -1) {
                return parseWallclockTimeSpec(timeSpecString);
            }
            // .{nondigit}  matches for "foo.click"
            else if (timeSpecString.match(/\.\D+/)) {
                return parseEventTimeSpec(timeSpecString, node);
            }
            else if (timeSpecString.indexOf("indefinite") != -1) {
                return new IndefiniteTimeSpec();
            }
            else {
                return parseOffsetTimeSpec(timeSpecString);
            }
        }

        static public function parseWallclockTimeSpec(timeSpecString:String):WallclockTimeSpec {
            return new WallclockTimeSpec(timeSpecString);
        }

        static public function parseEventTimeSpec(timeSpecString, node:SVGNode):EventTimeSpec {
            var parts:Array = timeSpecString.split(".");

            // If event spec had a decimal offset, don't split that off
            if (parts.length == 3) {
                parts[1] = parts[1]+parts[2];
                delete parts[2];
            }

            if (parts.length != 2) {
                return null;
            }
            else {
                var eventTarget:String = parts[0];

                var eventSpec:String = parts[1];
                var eventName:String;
                var eventParts:Array;
                var offset:Number;

                if (eventSpec.indexOf("+") != -1) {
                    eventParts = eventSpec.split(/\+/);
                    eventName =  eventParts[0];
                    offset=SVGUnits.parseTimeVal(eventParts[1]);
                }
                else if (eventSpec.indexOf("-") != -1) {
                    eventParts = eventSpec.split(/-/);
                    eventName =  eventParts[0];
                    offset= -1*SVGUnits.parseTimeVal(eventParts[1]);
                }
                else {
                    eventName =  eventSpec;
                    offset= 0;
                }
    
                return new EventTimeSpec(eventTarget, // Id
                                         eventName,   // Event name
                                         offset);     // Offset
            }
        }
    
        static public function parseOffsetTimeSpec(timeSpecString) {
            return new OffsetTimeSpec(timeSpecString, SVGUnits.parseTimeVal(timeSpecString));
        }
    }

}
