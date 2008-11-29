# To use the examples, copy the html, swf, and svg files to your web server directory.

build/svgviewer.swf: SVGViewer.as *.as data/*.as nodes/*.as utils/*.as nodes/mask/*.as
	mxmlc -output build/svgviewer.swf -use-network=false -compiler.source-path ../../../ -- SVGViewer.as
	cp release/*.html release/*.svg build/

make_release:
	cp build/svgviewer.swf release/

clean:
	rm build/*


