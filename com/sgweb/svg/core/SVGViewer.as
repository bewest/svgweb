package com.sgweb.svg.core
{

    import com.sgweb.svg.nodes.SVGSVGNode;

    import flash.display.Sprite;
    import flash.events.Event;
    import flash.events.IOErrorEvent;
    import flash.events.SecurityErrorEvent;
    import flash.net.URLLoader;
    import flash.net.URLRequest;

    public class SVGViewer extends Sprite
    {
        public var svgRoot:SVGSVGNode;

        protected var urlLoader:URLLoader;

        public function SVGViewer() {
            XML.ignoreProcessingInstructions = false;
            XML.ignoreComments = false;

            super();
            svgRoot = new SVGSVGNode();
            this.addChild(svgRoot);
        }

        public function loadURL(url:String):void {
            urlLoader = new URLLoader();
            urlLoader.load(new URLRequest(url));
            urlLoader.addEventListener(Event.COMPLETE, onComplete);
            urlLoader.addEventListener(IOErrorEvent.IO_ERROR, onIOError);
            urlLoader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, onSecurityError);
        }

        protected function onComplete(event:Event):void {
            svgRoot.xml = new XML(urlLoader.data);
            urlLoader = null;
        }

        protected function onIOError(event:IOErrorEvent):void {
            trace("IOError: " + event.text);
            urlLoader = null;
        }

        protected function onSecurityError(event:SecurityErrorEvent):void {
            trace("SecurityError: " + event.text);
            urlLoader = null;
        }

        public function getWidth():Number {
            return 0;
        }

        public function getHeight():Number {
            return 0;
        }

        public function set xml(value:XML):void {
            this.svgRoot.xml = value;
        }

        public function get xml():XML {
            return this.svgRoot.xml;
        }

        public function handleScript(script:String):void {

        }

        public function handleOnLoad():void {

        }

        public function addActionListener(eventType:String, target:SVGNode):void {

        }

        public function removeActionListener(eventType:String, target:SVGNode):void {

        }

        public function debug(debugMessage:String):void {

        }

    }
}
