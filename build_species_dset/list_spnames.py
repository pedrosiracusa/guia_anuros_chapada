import sys
import json

# This script creates blank pages for each species listed in the data file
# It expects two positional arguments:
#    1. the relative path to the data file;
#    2. the relative path to the directory to store the pages.

spdata = sys.argv[1]
targetdir = sys.argv[2]

with open(spdata, 'r') as f:
  splist = [ i['id'] for i in json.load(f) ]

for sp in splist:
  open(f'{targetdir}/{sp}.md', 'a').close()
