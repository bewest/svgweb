# To use the examples, copy the html, swf, and svg files to your web server directory.

com/sgweb/svg/build/svgviewer.swf: com/sgweb/svg/SVGViewer.as com/sgweb/svg/data/*.as com/sgweb/svg/nodes/*.as com/sgweb/svg/utils/*.as com/sgweb/svg/nodes/mask/*.as
	(cd com/sgweb/svg;mxmlc -output build/svgviewer.swf -use-network=false -compiler.source-path ../../../ -- SVGViewer.as)
	cp html/* com/sgweb/svg/build/
	cp samples/*.svg com/sgweb/svg/build/

release:
	rm -f com/sgweb/svg/build/*
	(cd com/sgweb/svg;mxmlc -output build/svgviewer.swf -use-network=false -compiler.source-path ../../../ -- SVGViewer.as)
	mv com/sgweb/svg/build/svgviewer.swf html/
	tar cvzpf svgviewer-src-0.7.3.tgz --exclude="*svn*" --exclude="*.tgz" *
	tar cvzpf svgviewer-0.7.3.tgz --exclude="*svn*" --exclude="*.tgz" --exclude="com*" --exclude="Makefile" *


install:
	cp com/sgweb/svg/build/* $(SVGSRV)

clean:
	rm -f com/sgweb/svg/build/*


