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

    content = re.sub("svgviewer.js", "svg.js", content)
    content = re.sub('<body class="bodytext">', '<body class="bodytext" onLoad="bodyOnLoad();">', content)
    content = re.sub("</head>", "    <script type=\"text/javascript\">\n    function bodyOnLoad() {\n        svgviewer.createSVG({ uniqueId: 'svg01', bgcolor:'#ffffff', parentId: 'svgParent',\n        sourceType: \"url_svg\", svgURL:\"../svggen/" + svgfilename + "\",\n        width:480, height:360 });\n    }\n    </script>\n\n</head>\n", content)
    content = re.sub("<td align=\"right\">\n.*\n<object.*\n.*\n.*\n.*\n.*\n.*\n.*\n.*\n.*\n.*\n.*\n", "<td align=\"right\" id=\"svgParent\">\n\n", content)

    outfile.write(content)
    outfile.close()
    infile.close()
    os.rename(filename +".new", filename)
