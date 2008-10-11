/*
Copyright (c) 2008 James Hight

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
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.display.DisplayObject;
	import flash.display.Loader;
	import flash.display.LoaderInfo;
	import flash.events.Event;
	import flash.geom.Matrix;
	import flash.utils.ByteArray;
	
	import mx.utils.Base64Decoder;
	
	public class SVGImageNode extends SVGNode
	{		
		private var bitmap:Bitmap;
		private var orignalBitmap:Bitmap;
                   
		public function SVGImageNode(xml:XML):void {
			super(xml);
		}	
		
		/**
		 * Decode the base 64 image and load it
		 **/	
		protected override function draw():void {
			var decoder:Base64Decoder = new Base64Decoder();
			var byteArray:ByteArray;
			
			var base64String:String = this._xml.@xlink::href;
		
			if (base64String.match(/^data:[a-z\/]*;base64,/)) {
				base64String = base64String.replace(/^data:[a-z\/]*;base64,/, '');
				
				decoder.decode( base64String );
				byteArray = decoder.flush();
				
				loadBytes(byteArray);
					
			}
		}
		
		/**
		 * Load image byte array
		 **/
		private function loadBytes(byteArray:ByteArray):void {
			
			var loader:Loader = new Loader();
			loader.contentLoaderInfo.addEventListener( Event.COMPLETE, onBytesLoaded );			
			loader.loadBytes( byteArray );				
		}
		
		/**
		 * Display image bitmap once bytes have loaded
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
