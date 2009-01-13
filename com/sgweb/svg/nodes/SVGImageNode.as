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

package com.sgweb.svg.nodes
{
    import com.sgweb.svg.utils.Base64;

    import flash.display.Bitmap;
    import flash.display.BitmapData;
    import flash.display.DisplayObject;
    import flash.display.Loader;
    import flash.display.LoaderInfo;
    import flash.events.Event;
    import flash.events.IOErrorEvent;
    import flash.net.URLRequest;
    import flash.utils.*;

    public class SVGImageNode extends SVGNode {
        private var bitmap:Bitmap;
        private var orignalBitmap:Bitmap;
        public var imageWidth:Number = 0;
        public var imageHeight:Number = 0;

        public function SVGImageNode(svgRoot:SVGRoot, xml:XML):void {
            super(svgRoot, xml);
        }    

        protected override function draw():void {
            var imageHref:String = this._xml.@href;
            if (!imageHref) {
                imageHref = this._xml.@xlink::href;
            }
            if (!imageHref) {
                return;
            }

            // For data: href, decode the base 64 image and load it
            if (imageHref.match(/^data:[a-z\/]*;base64,/)) {
                var base64String:String = imageHref.replace(/^data:[a-z\/]*;base64,/, '');
                var byteArray:ByteArray = Base64.decode(base64String);
                loadBytes(byteArray);
                return;
            }

            // must have width and height to create bitmap
            if (this._xml.@width && this._xml.@height) {
                var loader:Loader = new Loader();
                var urlReq:URLRequest = new URLRequest(imageHref);
                loader.load(urlReq);
                loader.contentLoaderInfo.addEventListener( Event.COMPLETE, onImageLoaded );
                loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, onError);
                this.addChild(loader);
                return;
            }
        }

        private function onError(event:IOErrorEvent):void {
            this.dbg("IOError: " + event.text);
        }

        private function onImageLoaded( event:Event ):void {
            this.imageWidth = event.target.width;
            this.imageHeight = event.target.height;
            this.transformNode();
        }

        /**
         * Load image byte array
         * Used to support data: href.
         **/
        private function loadBytes(byteArray:ByteArray):void {
            
            var loader:Loader = new Loader();
            loader.contentLoaderInfo.addEventListener( Event.COMPLETE, onBytesLoaded );
            loader.loadBytes( byteArray );
        }


        /**
         * Display image bitmap once bytes have loaded
         * Used to support data: href.
         **/
        private function onBytesLoaded( event:Event ) :void
        {
            var content:DisplayObject = LoaderInfo( event.target ).content;
            var bitmapData:BitmapData = new BitmapData( content.width, content.height, true, 0x00000000 );
            bitmapData.draw( content );

            bitmap = new Bitmap( bitmapData );
            bitmap.opaqueBackground = null;
            this.addChild(bitmap);

            
        }

    }
}
