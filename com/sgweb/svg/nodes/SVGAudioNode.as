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
    import com.sgweb.svg.utils.SVGColors;
    import flash.events.Event;
    import flash.net.URLRequest;
    import flash.media.Sound;
    import flash.media.SoundChannel;
    import flash.utils.getTimer;

    public class SVGAudioNode extends SVGNode {
        protected var sound:Sound;
        protected var channel:SoundChannel;

        private const INDEFINITE:int = -1;

        private const STATE_BEGIN:int = 0;
        private const STATE_RUN:int = 1;
        private const STATE_END:int = 2;

        private var _state:int;
        private var _startTime:int;

        private var _begin:int;
        private var _duration:int;
        private var _end:int;

        private var _repeat:int;

        public function SVGAudioNode(svgRoot:SVGSVGNode, xml:XML, original:SVGNode = null):void {
            super(svgRoot, xml, original);
        }

        override protected function onAddedToStage(event:Event):void {
            super.onAddedToStage(event);

            // Get the sound location
            var audioHref:String = this.getAttribute('href');
            if (!audioHref) {
                return;
            }

            // Prepend the xml:base
            var xmlBase:String = this.getAttribute('base');
            if (xmlBase && xmlBase != '') {
                audioHref = xmlBase + audioHref;
            }

            // Load the sound
            var mySoundReq:URLRequest = new URLRequest(audioHref);
            sound = new Sound();
            sound.load(mySoundReq);

            // Process the parameters
            var begin:String = this.getAttribute('begin', '0');
            this._begin = timeToMilliseconds(begin);

            var duration:String = this.getAttribute('dur', 'indefinite');
            if (duration == 'media' || duration == 'indefinite')
                this._duration =  INDEFINITE;
            else
                this._duration =  timeToMilliseconds(duration);

            var end:String = this.getAttribute('end');
            if (end) {
                this._end = timeToMilliseconds(end);
            }
            else {
                this._end = INDEFINITE;
            }

            var repeat:String = this.getAttribute('repeatCount', '1');
            if (repeat == 'indefinite') {
                this._repeat = INDEFINITE;
            }
            else {
                this._repeat = SVGColors.cleanNumber(repeat);
            }

            // Start the state machine
            this._state = this.STATE_BEGIN;
            if (this._repeat == INDEFINITE || this._repeat >= 0) {
                this.addEventListener(Event.ENTER_FRAME, monitorAudio);
            }

        }


        private function monitorAudio(event:Event):void {

            if (this._duration ==  INDEFINITE) {
                this._duration = sound.length;
            }

            var documentTime:int = getTimer();
            if (documentTime < this._begin) {
                return;
            }

            if (this._state == this.STATE_BEGIN) {
                channel = sound.play(0);
                this._state = this.STATE_RUN;
            }

            if (this._end != INDEFINITE && documentTime > this._end) {
                this._state = this.STATE_END;
                channel.stop();
                this.removeEventListener(Event.ENTER_FRAME, monitorAudio);
                return;
            }

            var runTime:int = documentTime - this._begin;
            if (runTime > this._duration) {
                channel.stop();
                this._state = this.STATE_END;
                this._repeat--;
                if (this._repeat == INDEFINITE || this._repeat > 0) {
                    this._state = this.STATE_BEGIN;
                    this._begin += this._duration;
                }
                else {
                    this.removeEventListener(Event.ENTER_FRAME, monitorAudio);
                }
            }

        }

        private function timeToMilliseconds(value:String):Number {
            return (SVGColors.cleanNumber(value) * 1000);
        }

    }
}
