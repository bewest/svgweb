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

package com.sgweb.svg.nodes.mask
{
    import com.sgweb.svg.nodes.SVGNode;
    import com.sgweb.svg.nodes.SVGRoot;
    import com.sgweb.svg.nodes.mask.SVGMask;
    import com.sgweb.svg.nodes.mask.SVGClipMaskParent;
    import com.sgweb.svg.nodes.SVGFilterNode;
    
    import flash.events.Event;
    import flash.geom.Matrix;
    import flash.geom.Rectangle;
    import flash.utils.setTimeout;
 
    /* This class was created to hold a mask for blurred objects.
       The reason for this is that SVG clips gaussian blur effects
       to a rectangle.
       
       In order to simulate this blur clip, a clip is created with
       the same shape as the object to be clipped and is used
       for the clipping area. Then, a parent stub object is created
       to hold the clip and the child to be clipped. The reason for
       this is that if the child was assigned the mask directly,
       then the blur would affect the clip and the clip will not work.

       Unfortunately, the clip needs to be larger than the object to
       be clipped because that is the way SVG handles the clipping.
       The rough amount the object needs to be scaled is not difficult to
       compute, but actually computing the clip for aribitrary paths
       is difficult.
       Two techniques were tried:
           1. Filling the path and using a wide stroke-width to make extra
           room failed because flash ignores strokes when applying a mask. :(
           2. Filling the path and then bluring the mask object did not
           work because flash ignores blur filters with applying a mask.
           3. Computing a matrix scale for rects worked, but applying
           the same technique to paths has unreliable results.
    
     */


    public class SVGBlurMaskParent extends SVGNode
    {

        protected var _childToMaskXML:XML;
        protected var _filterStr:String;

        protected var _childSVGMask:SVGMask;
        protected var _clipShapeId:String;

        protected var _isClipAdjusted:Boolean = false;
        protected var _originalClipTransform:String = null;
        protected var _adjustedClipTransform:String;

        protected var _childToMaskLastWidth:Number = -1;
        protected var _childToMaskLastHeight:Number = -1;

        public function SVGBlurMaskParent(svgRoot:SVGRoot, 
                                          childToMaskXML:XML,
                                          filterStr:String):void {
            this._childToMaskXML = childToMaskXML;
            this._filterStr = filterStr;

            super(svgRoot, this._childToMaskXML);
        }    


        override protected function parse():void {
            var childClipXML:XML = this._childToMaskXML.copy();

            //  Clip objects are stripped of these attributes
            //  and they draw with black fills.
            if (childClipXML.@['clip-path']) {
                delete childClipXML.@['clip-path'];
            }
            if (childClipXML.@['mask']) {
                delete childClipXML.@['mask'];
            }
            if (childClipXML.@['style']) {
                delete childClipXML.@['style'];
            }


            /* A blurred object does not seem to work as a mask :(
            //  Add the Mask.
            var clipPathXML:XML = <clipPath></clipPath>;
            clipPathXML.appendChild(childClipXML.toXMLString());
            this._childSVGMask = new SVGMask(this.svgRoot, clipPathXML);
            this._clipShapeId = this._childSVGMask.getClipId();
            this.mask = this._childSVGMask;
            this.addChild(this._childSVGMask);
            */

            //  Add the Child to be Masked:
            //      If clip-path exists, create a SVGClipMaskParent to hold
            //      the clip-path and child.
            var clipList:XMLList;
            if (   (this._childToMaskXML.attribute('clip-path').length() > 0)
                || (this._childToMaskXML.attribute('mask').length() > 0) ) {
                this.addChild(new SVGClipMaskParent(this.svgRoot, this._childToMaskXML));
            }
            else {
                //  Otherwise, add the child directly.
                var childToMask:SVGNode = this.parseNode(this._childToMaskXML);
                if (childToMask) {
                    this.addChild(childToMask);
                }
            }

        }

        override protected function setupFilters():void {
        }

        override public function transformNode():void {
            this.transform.matrix = new Matrix();
        }

        /*
            Adjust the transform on the clipping node to reflect
            the proper scaling defined by the gaussian filter.
        */
        public function updateBlurMaskTransform():void {

            this.svgRoot.debug("UpdateBlurMask: looking up id: " + this._clipShapeId);
            var clipNode:SVGNode = this.svgRoot.getElement(this._clipShapeId);
            if (clipNode == null) {
                this.svgRoot.debug("UpdateBlurMask: clip not found");
                return;
            }
            var childToMask:SVGNode = this.svgRoot.getElement(this._childToMaskXML.@id);
            if (childToMask == null) {
                this.svgRoot.debug("UpdateBlurMask: child not found");
                return;
            }
            //this.svgRoot.debug("childtomask,Y,height: " + childToMask.xml.@id + " , " + childToMask.y + "," + childToMask.height);
            //this.svgRoot.debug("childToMask matrix: " + childToMask.transform.matrix);
            //this.svgRoot.debug("clip,X,width: " + clipNode.xml.@id + " , " + clipNode.x + "," + clipNode.width);
            //this.svgRoot.debug("clip,Y,height: " + clipNode.xml.@id + " , " + clipNode.y + "," + clipNode.height);
            //this.svgRoot.debug("clip matrix: " + clipNode.transform.matrix);

            if (  (this._childToMaskLastWidth == childToMask.width)
                && (this._childToMaskLastHeight == childToMask.height) ) {
                return;
            }

            if ( !this._isClipAdjusted
                 && childToMask.width > 0 && childToMask.height > 0
                 && clipNode.width > 0 && clipNode.height > 0) {
                var matches:Array = this._filterStr.match(/url\(#([^\)]+)\)/si);
                if (matches.length > 0) {
                    var filterName:String = matches[1];
                    var filterNode:SVGFilterNode = this.svgRoot.getElement(filterName);
                    if (filterNode) {
                        this._childToMaskLastWidth = childToMask.width;
                        this._childToMaskLastHeight = childToMask.height;
                        if (this._originalClipTransform == null) {
                            if (childToMask.xml.@transform == undefined) {
                                this._originalClipTransform = "matrix(1,0,0,1,0,0)"; 
                            }
                            else {
                                this._originalClipTransform = childToMask.xml.@transform;
                            }
                        }
                        if (filterNode.xml.@width == undefined) {
                            filterNode.xml.@width = '1.2';
                        }
                        if (filterNode.xml.@height == undefined) {
                            filterNode.xml.@height = '1.2';
                        }
                        var oldMatrix:Matrix = this.parseTransform(this._originalClipTransform);

                        this.svgRoot.debug("ADJMAT: old " + oldMatrix.toString());
                        var newMatrix:Matrix = new Matrix();

                        newMatrix.translate(-(childToMask.x),
                                            -(childToMask.y));
                        newMatrix.scale(Number(filterNode.xml.@width),
                                        Number(filterNode.xml.@height));
                        newMatrix.translate(childToMask.x,
                                            childToMask.y);


                        newMatrix.translate(-(childToMask.width * Number(filterNode.xml.@width)
                                                - childToMask.width) / 2, 0);
                        newMatrix.translate(0, -(childToMask.height * Number(filterNode.xml.@height)
                                                       - childToMask.height) / 2);



                        var saveTx:Number = newMatrix.tx;
                        var saveTy:Number = newMatrix.ty;
                        newMatrix.translate(-saveTx,-saveTy);
                        newMatrix.concat(oldMatrix);
                        newMatrix.translate(saveTx,saveTy);

                        this._adjustedClipTransform = "matrix(" + newMatrix.a + ","
                                                          + newMatrix.b + ","
                                                          + newMatrix.c + ","
                                                          + newMatrix.d + ","
                                                          + newMatrix.tx + ","
                                                          + newMatrix.ty + ")";

                        clipNode.xml.@transform = this._adjustedClipTransform;
                        this._isClipAdjusted = true;
                        clipNode.transform.matrix = new Matrix();
                        clipNode.invalidateDisplay();

                    }
                    else {
                        this.svgRoot.debug("filter " + filterName + " not available for " + this.xml.@id);
                    }
                } 
            }


        }


        override protected function registerId(event:Event):void {
            this.removeEventListener(Event.ADDED, registerId);
        }

    }
}
