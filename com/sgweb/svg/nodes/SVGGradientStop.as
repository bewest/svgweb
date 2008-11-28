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
    import flash.events.Event;

    public class SVGGradientStop extends SVGNode
    {                
        public function SVGGradientStop(svgRoot:SVGRoot, xml:XML):void {
            super(svgRoot, xml);
        }    
        
        override protected function redrawNode(event:Event):void {
            super.redrawNode(event);
            //this.svgRoot.debug("stop " + this.xml.@id + " drawn. invalidating referers to " + SVGNode(this.parent).xml.@id);
            // XXX assumes parent has id
            this.svgRoot.invalidateReferers(SVGNode(this.parent).xml.@id);
        }

        /**
         * Override parent function to do nothing
        override protected function parse():void {
            //Do Nothing
        }
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
