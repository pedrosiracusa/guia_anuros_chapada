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
    1. Atualizar textos de espécies e famílias;
    2. Atualizar dados de espécies e autores;
    3. Atualizar avatares de espécies e autores;
    """)
    
    if False:
        #prepare()
        #fetch_gdrive.fetchTextosFamilias()
        #fetch_gdrive.fetchTextosEspecies()
    
        process.processarTextosEspecies()
    
    elif usrOption=="1":
        prepare()
        fetch_gdrive.fetchTextosFamilias()
        fetch_gdrive.fetchTextosEspecies()
        process.processarTextosEspecies()
        save.saveFamiliasPages()
        save.saveEspeciesPages()
        cleanup()
        
    elif usrOption=="2":
        prepare()
        fetch_gdrive.fetchTabelaAutores()
        fetch_gdrive.fetchTabelaEspecies()
        process.processarTabelaEspecies()
        # cleanup()
    