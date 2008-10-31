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
    import flash.display.Sprite;
    
    public class SVGClipPathNode extends SVGNode
    {    
        
        public function SVGClipPathNode(xml:XML):void {    
            super(xml);
        }                
        
        /**
         * Override parent function to do nothing
         **/
        protected override function parse():void {
            //Do Nothing
        }
        
        /**
         * Override parent function to do nothing
         **/
        override protected function draw():void {
            //Do Nothing
        }
        
        /**
         * Override parent function to do nothing except create a blank _graphicsCommands array
         **/
        override protected function generateGraphicsCommands():void {
            //Do Nothing
            this._graphicsCommands = new  Array();
        }
        
        
    }
}
