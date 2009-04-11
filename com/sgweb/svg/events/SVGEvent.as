package com.sgweb.svg.events
{
    import flash.events.Event;

    public class SVGEvent extends Event
    {
        public static const SVGLoad:String = "SVGLoad";
        
        public function SVGEvent(type:String, bubbles:Boolean=false, cancelable:Boolean=false)
        {
            super(type, bubbles, cancelable);
        }
        
    }
}
