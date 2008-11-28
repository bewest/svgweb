# To use the examples, copy the html, swf, and svg files to your web server directory.

build/svgviewer.swf: SVGViewer.as *.as data/*.as nodes/*.as utils/*.as nodes/mask/*.as
	mxmlc -output build/svgviewer.swf -use-network=false -compiler.source-path ../../../ -- SVGViewer.as
	cp *.html tests/scimitar.svg build/

clean:
	rm build/*


