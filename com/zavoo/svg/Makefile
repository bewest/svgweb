# To use the examples, copy the html, swf, and svg files to your web server directory.


build/svgviewer.swf: SVGViewer.as svgviewer.mxml *.as data/*.as nodes/*.as utils/*.as events/*.as
	mxmlc -output build/svgviewer.swf -use-network=false -compiler.source-path ../../../ -- svgviewer.mxml
	cp *.html build/


clean:
	rm -f build/svgviewer.swf build/*.html


