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
    import org.svgweb.utils.Base64;
    import org.svgweb.core.SVGNode;

    import flash.display.Bitmap;
    import flash.display.BitmapData;
    import flash.display.DisplayObject;
    import flash.display.Loader;
    import flash.display.LoaderInfo;
    import flash.events.Event;
    import flash.events.IOErrorEvent;
    import flash.events.SecurityErrorEvent;
    import flash.geom.Matrix;
    import flash.net.URLLoader;
    import flash.net.URLLoaderDataFormat;
    import flash.net.URLRequest;
    import flash.utils.*;

    public class SVGImageNode extends SVGNode {
        private var urlLoader:URLLoader;
        private var bitmap:Bitmap;

        public var imageWidth:Number = 0;
        public var imageHeight:Number = 0;

        public function SVGImageNode(svgRoot:SVGSVGNode, xml:XML, original:SVGNode = null):void {
            super(svgRoot, xml, original);
        }

        override protected function drawNode(event:Event=null):void {
            if ( (topSprite.parent != null) && (this._invalidDisplay) ) {
                this._invalidDisplay = false;
                topSprite.removeEventListener(Event.ENTER_FRAME, drawNode);
                if (!this._parsedChildren) {
                    this.parseChildren();
                    this._parsedChildren = true;
                }
    
                this.setAttributes();
                this.transformNode();
                if (this.bitmap == null && urlLoader == null) {
                    this.loadImage();
                } else {
                    finishDrawNode();
                }
            }
        }

        private function finishDrawNode():void {
            this.applyClipPathMask();
            this.applyViewBox();
            this.applyDefaultMask();

            this._invalidDisplay = false;
            if (getPatternAncestor() != null) {
                this.svgRoot.invalidateReferers(getPatternAncestor().id);
            }
            if (!this._initialRenderDone && topSprite.parent) {
                this.attachEventListeners();
                this._initialRenderDone = true;
                this.svgRoot.renderFinished();
            }

        }

        protected function loadImage():void {
            var imageHref:String = this.getAttribute('href');

            if (!imageHref) {
                return;
            }
            var xmlBase:String = this.getAttribute('base');
            if (xmlBase && xmlBase != '') {
                imageHref = xmlBase + imageHref;
            }

            // For data: href, decode the base 64 image and load it
            if (imageHref.match(/^data:[a-z\/]*;base64,/)) {
                var base64String:String = imageHref.replace(/^data:[a-z\/]*;base64,/, '');
                var byteArray:ByteArray = Base64.decode(base64String);
                loadBytes(byteArray);
                return;
            }

            // must have width and height to create bitmap
            if ( (this.getAttribute('width') != null) && (this.getAttribute('height') != null) ) {
                urlLoader = new URLLoader();
                urlLoader.dataFormat = URLLoaderDataFormat.BINARY;

                urlLoader.addEventListener(Event.COMPLETE, onURLLoaderComplete);

                urlLoader.addEventListener(IOErrorEvent.IO_ERROR, onError);
                urlLoader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, onError);

                urlLoader.load(new URLRequest(imageHref));

                return;
            }
        }

        override public function setAttribute(name:String, value:String):void {
            super.setAttribute(name, value);
            if (name == 'x' || name == 'y') {
                this.applyDefaultMask();
            }
        }

        override public function applyViewBox():void {
            // applyViewBox should not happen until the image is loaded.
            if (this.bitmap == null) {
                return;
            }

            var canvasWidth:Number = this.getWidth();
            var canvasHeight:Number = this.getHeight();

            if ( (canvasWidth > 0) && (canvasHeight > 0)) {

                var cropWidth:Number;
                var cropHeight:Number;

                var oldAspectRes:Number = this.imageWidth / this.imageHeight;
                var newAspectRes:Number = canvasWidth /  canvasHeight;

                var preserveAspectRatio:String = this.getAttribute('preserveAspectRatio', 'xMidYMid meet');
                var alignMode:String = preserveAspectRatio.substr(0,8);

                var meetOrSlice:String = 'meet';
                if (preserveAspectRatio.indexOf('slice') != -1) {
                    meetOrSlice = 'slice';
                }

                if (alignMode == 'none') {
                    // stretch to fit viewport width and height
                    cropWidth = canvasWidth;
                    cropHeight = canvasHeight;
                }
                else {
                    if (meetOrSlice == 'meet') {
                        // shrink to fit inside viewport

                        if (newAspectRes > oldAspectRes) {
                            cropWidth = canvasHeight * oldAspectRes;
                            cropHeight = canvasHeight;
                        }
                        else {
                            cropWidth = canvasWidth;
                            cropHeight = canvasWidth / oldAspectRes;
                        }

                    }
                    else {
                        // meetOrSlice == 'slice'
                        // Expand to cover viewport.

                        if (newAspectRes > oldAspectRes) {
                            cropWidth = canvasWidth;
                            cropHeight = canvasWidth / oldAspectRes;
                        }
                        else {
                            cropWidth = canvasHeight * oldAspectRes;
                            cropHeight = canvasHeight;
                        }

                    }
                }

                this.bitmap.scaleX = cropWidth / this.imageWidth;
                this.bitmap.scaleY = cropHeight / this.imageHeight;


                var borderX:Number;
                var borderY:Number;
                var translateX:Number;
                var translateY:Number;
                if (alignMode != 'none') {
                    translateX=0;
                    translateY=0;
                    var xAlignMode:String = alignMode.substr(0,4);
                    switch (xAlignMode) {
                        case 'xMin':
                            break;
                        case 'xMax':
                            translateX = canvasWidth - cropWidth;
                            break;
                        case 'xMid':
                        default:
                            borderX = canvasWidth - cropWidth;
                            translateX = borderX / 2.0;
                            break;
                    }
                    var yAlignMode:String = alignMode.substr(4,4);
                    switch (yAlignMode) {
                        case 'YMin':
                            break;
                        case 'YMax':
                            translateY = canvasHeight - cropHeight;
                            break;
                        case 'YMid':
                        default:
                            borderY = canvasHeight - cropHeight;
                            translateY = borderY / 2.0;
                            break;
                    }
                    this.bitmap.x = translateX;
                    this.bitmap.y = translateY;
                }

            }

        }


        private function onError(event:IOErrorEvent):void {
            this.dbg("IOError: " + event.text);
            this.finishDrawNode();
            urlLoader = null;
        }

        private function onURLLoaderComplete( event:Event ):void {
            this.loadBytes(ByteArray(urlLoader.data));
            urlLoader = null;
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

            this.imageWidth = bitmapData.width;
            this.imageHeight = bitmapData.height;

            bitmap = new Bitmap( bitmapData );
            bitmap.opaqueBackground = null;
            drawSprite.addChild(bitmap);

            this.finishDrawNode();
            
        }
    }
}
