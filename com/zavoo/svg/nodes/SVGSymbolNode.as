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
	/** 
	 * Contains drawing instructions used by SVGUseNode
	 * It is not rendered directly
	 **/
	public class SVGSymbolNode extends SVGNode
	{		
		/**
		 * Track changes to symbol,
		 * If numbers do not match, 
		 * update XML in Use node 
		 **/
		private var _revision:uint = 0;
		
		public function SVGSymbolNode(xml:XML):void {
			super(xml);
		}	
		
		protected override function parse():void {
			//Only Register Filter Nodes
			for each (var childXML:XML in this._xml.children()) {
				var nodeName:String = childXML.localName();
				
				if (childXML.nodeKind() == 'element') {
					
					nodeName = nodeName.toLowerCase();					
					if (nodeName == 'filter') {
						this.addChild(new SVGFilterNode(childXML));			
					}
				}
			}
		}
		
		override protected function draw():void {
			//Do Nothing
		}
		
		override protected function generateGraphicsCommands():void {
			this._graphicsCommands = new  Array();
			//Do Nothing
		}
		
		/* override protected function setAttributes():void {
			//Register Symbol		
			this.svgRoot.registerSymbol(this);
		} */
		
		override public function set xml(xml:XML):void {
			this._revision++;
			super.xml = xml;
		}
		
		public function get id():String {
			var id:String = this._xml.@id;
			return id;
		}
		
		public function get revision():uint {
			return this._revision;			
		}
		
	}
}
