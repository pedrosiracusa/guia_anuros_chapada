import re, os, shutil
from pathlib import Path

from pydrive.auth import GoogleAuth
from pydrive.drive import GoogleDrive
from pydrive.auth import ServiceAccountCredentials

import settings
settings.init()

import driveconnect

TEMP_DIR = settings.SCRIPTS_TMPDIR
TEMP_DIR = f"{TEMP_DIR}/textos-perfil"


drive = driveconnect.connectGoogleDrive()

PROJECT_ID = '0B0M5IL0AEOXidHZmTjZzMHlLLWc'
ROOT_ID = drive.ListFile({'q': f"title contains 'dados_guia_digital' and '{PROJECT_ID}' in parents"}).GetList()[0]['id']
DIRECTORY_ESPECIES_ID = drive.ListFile({'q': f"title contains 'especies_perfil_textos' and '{ROOT_ID}' in parents"}).GetList()[0]['id']
DIRECTORY_FAMILIAS_ID = drive.ListFile({'q': f"title contains 'familias_perfil_textos' and '{ROOT_ID}' in parents"}).GetList()[0]['id']

### =============================================================
### Funções para coleta de textos de perfis (espécies e famílias)

arquivos_ignorar = ['modelo','README']

def getDocsFamilias():
    return [ f for f in drive.ListFile({'q':f"'{DIRECTORY_FAMILIAS_ID}' in parents and mimeType contains 'document'"}).GetList() 
                if f['title'] not in arquivos_ignorar ]
    
def getDocsEspecies():
    return [ f for f in drive.ListFile({'q': f"'{DIRECTORY_ESPECIES_ID}' in parents and mimeType contains 'document'"}).GetList()
                if f['title'] not in arquivos_ignorar ]
    
# Fetch all documents for each family
def fetchProfilesDocuments():    
    
    for doc in getDocsFamilias():
        print(f"Baixando documento da família {doc['title']}")
        doc.GetContentFile(f"{TEMP_DIR}/familias/{doc['title'].lower()}.md", mimetype="text/plain")
        
        
    for doc in getDocsEspecies():
        print(f"Baixando documento da espécie {doc['title']}")
        doc.GetContentFile(f"{TEMP_DIR}/especies/{doc['title'].lower()}.md", mimetype="text/plain")




### =======================================
### Baixar tabelas de espécies e de autores


def run():
    os.makedirs(f'{TEMP_DIR}/especies')
    os.makedirs(f'{TEMP_DIR}/familias')

    fetchProfilesDocuments()
    
if __name__=='__main__':

    run()



