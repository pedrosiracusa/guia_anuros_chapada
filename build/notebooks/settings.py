import os
from pathlib import Path

def init():
    global PROJECT_BASEPATH 
    global NOTEBOOKS_TMPDIR
    
    PROJECT_BASEPATH = f"{Path( os.path.dirname(__file__) ).parents[1]}"
    NOTEBOOKS_PATH = f"{os.path.dirname(__file__)}"
    NOTEBOOKS_TMPDIR = f"{NOTEBOOKS_PATH}/tmp"
    
    

