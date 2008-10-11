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
	import com.zavoo.svg.data.SVGColors;
	import com.zavoo.svg.events.SVGEvent;
	
	import flash.display.Shape;
	import flash.events.Event;
	import flash.utils.getTimer;
	
	/**
	 * Root container of the SVG
	 **/
	public class SVGRoot extends SVGNode
	{			
		/**
		 * Object to hold node id registration
		 **/
		public var _elementById:Object;
		
		/**
		 * Title of SVG
		 **/
		private var _title:String;
		
		/**
		 * Used to synchronize tweens
		 **/
		private var _loadTime:int;
		
		private var _width:Number;
		private var _height:Number;
		
		/**
		 * Used to track number of nodes that need to be rendered
		 **/
		private var _invalidNodeCount:uint = 0;
				
		public function SVGRoot(xml:XML = null):void {
			super(XML(xml));
		}	
		
		/**
		 * @private
		 **/
		public function set scale(value:Number):void {
			this.scaleX = value;
			this.scaleY = value;
			
			this.dispatchEvent(new Event(Event.RESIZE));
		}
		
		/**
		 * Set scaleX and scaleY at the same time 
		 **/
		public function get scale():Number {
			return this.scaleX;
		}
		
		/**
		 * Set super._xml
		 * Create new _elementById object
		 **/
		public override function set xml(value:XML):void {		
			this._width = 0;
			this._height = 0;
			default xml namespace = svg;
			this._elementById = new Object();	
			this.clearChildren();		
			super.xml = value;	
			
			this._loadTime = getTimer();
			
			this.dispatchEvent(new Event(Event.RESIZE));
					
		}
		
		/**
		 * Register a node
		 * 
		 * @param id id to register node under
		 * 
		 * @param node node to be registered
		 **/
		public function registerElement(id:String, node:*):void {	
			if (this._elementById[id] == undefined) {						
				this._elementById[id] = node;
			}			
		}
		
		/**
		 * Retrieve registered node by name
		 * 
		 * @param id id of node to be retrieved
		 * 
		 * @return node registered with id
		 **/
		public function getElement(id:String):* {
			if (this._elementById.hasOwnProperty(id)) {
				return this._elementById[id]; 
			}
			return null;
		}
		
		/**
		 * Support default SVG style values
		 **/
		override public function getStyle(name:String):String {
			var style:String = super.getStyle(name);
			
			//Return default values if a style is not set
			if ((name == 'opacity') 
				|| (name == 'fill-opacity')
				|| (name == 'stroke-opacity')
				|| (name == 'stroke-width')) {
				if (style == null) {
					style = '1';
				}
			}
			
			if (name == 'fill') {
				if (style == null) {
					style = 'black';
				}
			}
			
			if (name == 'stroke') {
				if (style == null) {
					style = 'none';
				}
			}
			
			return style;			
					
		}
		
		/**
		 * Add support for viewBox elements
		 **/
		override protected function setAttributes():void {
			super.setAttributes();
			
			//Create root node mask defined by the SVG viewBox
			var viewBox:String = this.getAttribute('viewBox');
			if (viewBox != null) {
				var points:Array = viewBox.split(/\s+/);
				this.addRootMask(points[0], points[1], points[2], points[3]);		
				
				this._width = points[2];
				this._height = points[3]; 
			}
			else {
				var w:String = this.getAttribute('width');
				var h:String = this.getAttribute('height');
				
				if ((w != null) && (h != null)) {
					if (w.match('%') || h.match('%')) {
						return;
					}
					this._width = SVGColors.cleanNumber(w);
					this._height = SVGColors.cleanNumber(h);
					this.addRootMask(0, 0, this._width, this._height);
				}
			}
		}		
		
		/**
		 * Draw rectangluar mask 
		 **/
		protected function addRootMask(xVal:Number, yVal:Number, widthVal:Number, heightVal:Number):void {
			if (this.mask == null) {
					this.mask = new Shape();
					this.addChild(this.mask);
			}			
			if (this.mask is Shape) {
				if (!this.contains(this.mask)) {
					this.addChild(this.mask);
				}					
				Shape(this.mask).graphics.clear();
				
				Shape(this.mask).graphics.beginFill(0x000000);
				Shape(this.mask).graphics.drawRect(xVal, yVal, widthVal, heightVal);
				Shape(this.mask).graphics.endFill();
			}
		}
		
		public function get title():String {
			return this._title;
		}
		
		public function set title(value:String):void {
			this._title = value;
		} 
		
		/**
		 * Used to synchronize tweens
		 **/
		public function get loadTime():int {
			return this._loadTime;
		}
		
		
		/**
		 * return width of SVG
		 **/
		override public function get width():Number {
			if (this._width > 0) {
				return this._width * this.scaleX;
			}
			else {
				return super.width;
			}
		}
		
		/**
		 * @private
		 **/
		override public function set width(value:Number):void {
			//Do nothing
		}
		
		/**
		 * return height of SVG
		 **/
		override public function get height():Number {
			if (this._height > 0) {
				return this._height * this.scaleY;
			}
			else {
				return super.height;
			}
		}
		
		/**
		 * @private
		 **/
		override public function set height(value:Number):void {
			//Do nothing
		}
		
		
		public function set invalidNodeCount(value:int):void {
			if (value < 0) {
				trace('Something is wrong with the invalid node counter! It has a value of ' + value.toString() + '!');
			}
			this._invalidNodeCount = value;
			if (value == 0) {
				this.dispatchEvent(new SVGEvent(SVGEvent.RENDER_FINISHED, true));
			}
		}
		
		public function get invalidNodeCount():int {
			return this._invalidNodeCount;
		}	
		
	}
}
