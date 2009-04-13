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

package com.sgweb.svg.nodes
{
    import com.sgweb.svg.core.SVGNode;
    import com.sgweb.svg.utils.SVGColors;
    import com.sgweb.svg.utils.SVGUnits;

    
    import flash.text.TextField;
    import flash.text.TextFieldAutoSize;
    import flash.text.TextFormat;
    import flash.text.TextLineMetrics;
    
    /** SVG Text element node **/
    public class SVGTextNode extends SVGNode
    {    
        
        /**
         * Hold node's text
         **/
        private var _text:String = '';
        
        /**
         * Hold text path node if text follows a path
         **/
        private var _textPath:SVGNode = null;
        
        /**
         * TextField to render nodes text
         **/
        private var _textField:TextField;
        private var _svgFont:SVGFontNode;
        
        public function SVGTextNode(svgRoot:SVGSVGNode, xml:XML, original:SVGNode = null):void {
            super(svgRoot, xml, original);
        }
        
        /**
         * Get any child text (not text inside child nodes)
         * If this node has any text create a TextField at this._textField
         * Call SVGNode.parse()
         **/
        override protected function parseChildren():void {
            this._text = '';
            
            for each(var childXML:XML in this._xml.children()) {
                if (childXML.nodeKind() == 'text') {
                    this._text += childXML.toString();
                }
            }

            if (this._text == '') {
                return;
            }
            
            //Check for SVGFont
            var fontFamily:String = this.getAttribute('font-family');
            this._svgFont = this.svgRoot.getFont(fontFamily);
            if (this._svgFont != null) {
                var fontSize:String = this.getAttribute('font-size');
                var fontSizeNum:Number = SVGUnits.cleanNumber(fontSize);

                //Add a glyph for each character in the text
                var glyphX:Number = 0;
                for (var i:uint = 0; i < this._text.length; i++) {
                    var glyphChar:String = this._text.charAt(i);
                    var glyph:SVGGlyphNode = this._svgFont.getGlyph(glyphChar);
                    var glyphClone:SVGNode = glyph.clone();
                    glyphClone.setAttribute('transform',
                              'scale(' + (fontSizeNum / 2048) + ') scale(1,-1)');
                    glyphClone.setAttribute('x', String(glyphX));
                    var offsetX:Number = SVGUnits.cleanNumber(glyph.getAttribute('horiz-adv-x'));
                    glyphX = glyphX + offsetX;
                    SVGNode.addSVGChild(this, glyphClone);
                }
            }
            else {
                //If this is not an SVGFont, use a TextField
                this._textField = new TextField();
                this._textField.autoSize = TextFieldAutoSize.LEFT;
            }

        }

        override public function getAttribute(name:String, defaultValue:* = null, inherit:Boolean = true):* {
            if (name == 'stroke-width') {
                var fontSize:String = this.getAttribute('font-size');
                var fontSizeNum:Number = SVGUnits.cleanNumber(fontSize);
                var strokeWidthStr:String = super.getAttribute(name, defaultValue, inherit);
                var strokeWidth:Number = SVGUnits.cleanNumber(strokeWidthStr);
                strokeWidth = strokeWidth * (2048 / fontSizeNum);
                return String(strokeWidth);
            }
            else {
                return super.getAttribute(name, defaultValue, inherit);
            }
        }
        
        /**
         * Call SVGNode.setAttributes()
         * If this node contains text load text format (font, font-size, color, etc...)
         * Render text to a bitmap and add bitmap to node
         **/
        override protected function setAttributes():void {
            
            super.setAttributes();
            
            if (this._textField != null) {
                var fontFamily:String = this.getAttribute('font-family');                
                var fontSize:String = this.getAttribute('font-size');
                var fill:String = this.getAttribute('fill');
                if (fill == 'currentColor') {
                    fill = this.getAttribute('color');
                }
                var fontWeight:String = this.getAttribute('font-weight');
                var textAnchor:String = this.getAttribute('text-anchor');
                
                var textFormat:TextFormat = this._textField.getTextFormat();
                
                if (fontFamily != null) {
                    fontFamily = fontFamily.replace("'", '');
                    textFormat.font = fontFamily;
                }
                
                if (fontSize != null) {
                    //Handle floating point font size
                    var fontSizeNum:Number = SVGUnits.cleanNumber(fontSize);
                    
                    //Font size can be in user units, pixels (px), or points (pt); if no
                    //measurement type given defaults to user units
                    if (SVGUnits.getType(fontSize) == SVGUnits.PT) {
                        fontSizeNum = SVGUnits.pointsToPixels(fontSizeNum);
                    }
                    
                    var fontScale:Number = Math.floor(fontSizeNum);
                    textFormat.size = fontScale;
                    
                    fontScale = fontSizeNum / fontScale;
                    
                    _textField.scaleX = fontScale;
                    _textField.scaleY = fontScale;
                    
                }
                      
                if (fill != null) {
                    textFormat.color = SVGColors.getColor(fill);
                }
                
                // only bold/no bold supported for now (SVG has many levels of bold)
                var currentNode:SVGNode = this;
                while (fontWeight == 'inherit') {                    
                    if (currentNode.getSVGParent() != null) {
                        currentNode = currentNode.getSVGParent();
                        fontWeight = currentNode.getAttribute('font-weight');
                    }
                    else {
                        fontWeight = null;
                    }
                }                    
                if (fontWeight != null && fontWeight != 'normal') {
                    textFormat.bold = true;
                }
                                
                this._textField.text = this._text;
                this._textField.setTextFormat(textFormat);
                var textLineMetrics:TextLineMetrics = this._textField.getLineMetrics(0);
                
                currentNode = this;
                while (textAnchor == 'inherit') {                    
                    if (currentNode.getSVGParent() != null) {
                        currentNode = currentNode.getSVGParent();
                        textAnchor = currentNode.getAttribute('text-anchor');
                    }
                    else {
                        textAnchor = null;
                    }
                }    
                
                // Handle text-anchor attribute
                switch (textAnchor) {                    
                    case 'middle':
                        this._textField.x = textLineMetrics.x - Math.floor(textLineMetrics.width / 2);
                        break;
                    case 'end':
                        this._textField.x = textLineMetrics.x - textLineMetrics.width;
                        break;
                    default: //'start'
                        break;
                }
                
                // SVG Text elements position y attribute as baseline of text,
                // not the top
                this._textField.y = 0 - textLineMetrics.ascent - 1;
               
            }
        }    
        
        /**
         * 
         **/
        override protected function draw():void {
            super.draw();

            if (this._textField != null) {
                drawSprite.addChild(this._textField);            
            }            
        }             
    }
}
