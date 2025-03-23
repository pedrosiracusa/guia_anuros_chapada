import os, shutil
import settings
import save, fetch_gdrive, process

settings.init()
os.environ["TMPDIR"] = settings.SCRIPTS_TMPDIR
os.environ["BASEPATH"] = settings.PROJECT_BASEPATH



def prepare():
    try: shutil.rmtree(os.environ['TMPDIR'])
    except(FileNotFoundError): pass
    os.makedirs(os.environ['TMPDIR'])
    
def cleanup():
    try: shutil.rmtree(os.environ['TMPDIR'])
    except(FileNotFoundError): pass

if __name__== '__main__':
    
    usrOption = input("""
    1. Atualizar textos de perfis (espécies e famílias)
    """)
    
    if usrOption=="1":
        prepare()
        fetch_gdrive.run()
        process.run()
        save.run()
        cleanup()
    
    