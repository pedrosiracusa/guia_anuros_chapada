import os
from pathlib import Path

def init():
    global PROJECT_BASEPATH 
    global SCRIPTS_TMPDIR
    
    PROJECT_BASEPATH = f"{Path( os.path.dirname(__file__) ).parents[1]}"
    SCRIPTS_PATH = f"{os.path.dirname(__file__)}"
    SCRIPTS_TMPDIR = f"{SCRIPTS_PATH}/tmp"
    
    

