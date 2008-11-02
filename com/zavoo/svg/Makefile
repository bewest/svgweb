# To use the examples, copy the html, swf, and svg files to your web server directory.


build/svgviewer.swf: SVGViewer.as *.mxml *.as data/*.as nodes/*.as utils/*.as nodes/mask/*.as
	mxmlc -output build/svgviewer.swf -use-network=false -compiler.source-path ../../../ -- svgviewer.mxml
	mxmlc -output build/svgviewerdbg.swf -use-network=false -compiler.source-path ../../../ -- svgviewerdbg.mxml
	cp *.html *.svg build/


clean:
	rm build/*


