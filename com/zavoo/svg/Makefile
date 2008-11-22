# To use the examples, copy the html, swf, and svg files to your web server directory.

default: build/svgviewer.swf build/svgviewerdbg.swf

build/svgviewer.swf: SVGViewer.as *.mxml *.as data/*.as nodes/*.as utils/*.as nodes/mask/*.as
	mxmlc -output build/svgviewer.swf -use-network=false -compiler.source-path ../../../ -- SVGViewer.as
	cp *.html tests/scimitar.svg build/

build/svgviewerdbg.swf: SVGViewerDebug.as *.mxml *.as data/*.as nodes/*.as utils/*.as nodes/mask/*.as
	mxmlc -output build/svgviewerdbg.swf -use-network=false -compiler.source-path ../../../ -- svgviewerdbg.mxml
	cp *.html tests/scimitar.svg build/

clean:
	rm build/*


