#!/usr/bin/python

import glob
import os
import re
import sys

for filename in glob.glob("../htmlObjectHarness/*.html"):
    if filename == "../htmlObjectHarness/full-color-prof-01-f.html":
        continue
    if filename == "../htmlObjectHarness/tiny-index.html":
        continue
    if filename == "../htmlObjectHarness/basic-index.html":
        continue
    if filename == "../htmlObjectHarness/full-index.html":
        continue

    infile = open (filename, "r")
    outfile = open (filename + ".new", "w")
    content = infile.read()

    svgfilename = re.sub("\.html", ".svg", filename)
    svgfilename = re.sub("../htmlObjectHarness/full-", "", svgfilename)
    svgfilename = re.sub("../htmlObjectHarness/tiny-", "", svgfilename)
    svgfilename = re.sub("../htmlObjectHarness/basic-", "", svgfilename)
    svgfilename = '../svggen/' + svgfilename

    #content = re.sub('src="\.\.\/\.\.\/html\/svg\.js"', 'src="../../src/svg.js"', content)
    #content = re.sub("<object.*\n.*\n.*\n.*\n.*\n.*\n.*\n.*\n.*\n.*\n.*\n", '<!--[if IE]>\n<object src="' + svgfilename + '" classid="image/svg+xml"\n\twidth="480" height="360">\n<![endif]-->\n<!--[if !IE]>-->\n<object data="' + svgfilename + '" type="image/svg+xml"\n\twidth="480" height="360">\n<!--<![endif]-->\n</object>\n', content)

    outfile.write(content)
    outfile.close()
    infile.close()
    os.rename(filename +".new", filename)
