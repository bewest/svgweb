# To use the examples, copy the html, swf, and svg files to your web server directory.

# Location to rsync entire package to
SVGSRV='codinginparadise.org:~/codinginparadise.org/html/projects/svg-web/'

# Whether to compress JavaScript
COMPRESS=1

all: com/sgweb/svg/build/svg.swf com/sgweb/svg/build/svg.js com/sgweb/svg/build/svg.htc
	cp html/*.html com/sgweb/svg/build/
	cp samples/*.svg com/sgweb/svg/build/

com/sgweb/svg/build/svg.swf: com/sgweb/svg/SVGViewer.as com/sgweb/svg/data/*.as com/sgweb/svg/nodes/*.as com/sgweb/svg/utils/*.as com/sgweb/svg/nodes/mask/*.as
	@echo Building svg.swf file...
	(cd com/sgweb/svg;mxmlc -output build/svg.swf -use-network=false -warnings=false -compiler.strict=true -compiler.optimize=true -compiler.debug=false -compiler.source-path ../../../ -- SVGViewer.as)

ifeq ($(COMPRESS), 1)
com/sgweb/svg/build/svg.js: html/svg.js
	@echo Compressing svg.js file...
	java -jar utils/yuicompressor-2.4.1.jar --type js --nomunge --preserve-semi -o com/sgweb/svg/build/svg.js html/svg.js 2>&1
	@echo Final size: svg.js \(`ls -lrt com/sgweb/svg/build/svg.js | awk '{print $$5}'` bytes\)
else
com/sgweb/svg/build/svg.js: html/svg.js
	cp html/svg.js com/sgweb/svg/build/
endif

ifeq ($(COMPRESS), 1)
com/sgweb/svg/build/svg.htc: html/svg.htc
	@echo Compressing svg.htc file...
	# compress the Microsoft Behavior HTC file and strip out XML style comments.
	# we can't directly compress the HTC file; we have to extract the SCRIPT
	# portion, compress that, then put it back into the original HTC file.
	# we use sed to do the bulk of the work. We store the intermediate results into
	# shell variables then paste them all together at the end to produce the final
	# result.
	(compressed_js=`sed -n -e '/script/, /\/script/ p' -e 's/script//' <html/svg.htc | grep -v 'script>' | grep -v '<script' | java -jar utils/yuicompressor-2.4.1.jar --type js --nomunge --preserve-semi 2>&1`; \
   top_of_htc=`sed -e '/script/,/<\/html>/ s/^.*$$//' <html/svg.htc | sed '/\<\!\-\-/,/\-\-\>/ s/.*//' | cat -s`; \
   echo $$top_of_htc '<script type="text/javascript">' $$compressed_js '</script></body></html>' >com/sgweb/svg/build/svg.htc;)
	@echo Final size: svg.htc \(`ls -lrt com/sgweb/svg/build/svg.htc | awk '{print $$5}'` bytes\)
else
com/sgweb/svg/build/svg.htc: html/svg.htc
	cp html/svg.htc com/sgweb/svg/build/
endif

size: com/sgweb/svg/build/svg.swf com/sgweb/svg/build/svg.js com/sgweb/svg/build/svg.htc
	# Determines file sizes to help with size optimization
	@swf_after=`ls -lrt com/sgweb/svg/build/svg.swf | awk '{print $$5}'`; \
      js_after=`ls -lrt com/sgweb/svg/build/svg.js | awk '{print $$5}'`; \
      htc_after=`ls -lrt com/sgweb/svg/build/svg.htc | awk '{print $$5}'`; \
      \
      swf_before=`ls -lrt html/svg.swf | awk '{print $$5}'`; \
      js_before=`ls -lrt html/svg.js | awk '{print $$5}'`; \
      htc_before=`ls -lrt html/svg.htc | awk '{print $$5}'`; \
      \
      total_after=$$(expr $$swf_after + $$js_after + $$htc_after); \
      total_before=$$(expr $$swf_before + $$js_before + $$htc_before); \
      \
      echo Total non-optimized size: $$total_before bytes; \
      echo Total optimized size: $$total_after bytes; \
      \
      gzip --quiet --to-stdout com/sgweb/svg/build/svg.swf > com/sgweb/svg/build/svg.swf.gz; \
      swf_gzip=`ls -lrt com/sgweb/svg/build/svg.swf.gz | awk '{print $$5}'`; \
      rm com/sgweb/svg/build/svg.swf.gz; \
      gzip --quiet --to-stdout com/sgweb/svg/build/svg.js > com/sgweb/svg/build/svg.js.gz; \
      js_gzip=`ls -lrt com/sgweb/svg/build/svg.js.gz | awk '{print $$5}'`; \
      rm com/sgweb/svg/build/svg.js.gz; \
      gzip --quiet --to-stdout com/sgweb/svg/build/svg.htc > com/sgweb/svg/build/svg.htc.gz; \
      htc_gzip=`ls -lrt com/sgweb/svg/build/svg.htc.gz | awk '{print $$5}'`; \
      rm com/sgweb/svg/build/svg.htc.gz; \
      total_gzip=$$(expr $$swf_gzip + $$js_gzip + $$htc_gzip); \
      echo Total size if gzip compression is turned on: $$total_gzip; \
      \
      echo Individual optimized file sizes:; \
      echo '    ' svg.swf \($$swf_after bytes\) / svg.js \($$js_after bytes\) / svg.htc \($$htc_after bytes\);

release: clean all
	tar cvzpf svgviewer-src-`date +'%F'`.tgz --exclude="*svn*" --exclude="*.tgz" *
	tar cvzpf svgviewer-`date +'%F'`.tgz --exclude="*svn*" --exclude="*.tgz" --exclude="com*" --exclude="Makefile" --exclude="utils" --exclude="w3c-tests" *

install:
	# Set SVGSRV to the server and directory target for the rsync.
	# Example: make SVGSRV='codinginparadise.org:~/codinginparadise.org/html/projects/svg-web/' install
	rsync --recursive --delete --exclude=*svn* com/sgweb/svg/build/* $(SVGSRV)

clean:
	rm -f com/sgweb/svg/build/*

