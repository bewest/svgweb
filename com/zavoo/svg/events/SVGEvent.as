package com.zavoo.svg.events
{
    import flash.events.Event;

    public class SVGEvent extends Event
    {
        public static const RENDER_FINISHED:String = 'SVG Render Finished';
        
        public function SVGEvent(type:String, bubbles:Boolean=false, cancelable:Boolean=false)
        {
            super(type, bubbles, cancelable);
        }
        
    }
}
