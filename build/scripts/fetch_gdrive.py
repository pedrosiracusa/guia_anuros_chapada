import re, os, shutil
from pathlib import Path

import pandas as pd

from pydrive.auth import GoogleAuth
from pydrive.drive import GoogleDrive
from pydrive.auth import ServiceAccountCredentials

import settings
settings.init()

import driveconnect

TEMP_DIR = settings.SCRIPTS_TMPDIR
DIR_TEXTOS_ESPECIES = f"{TEMP_DIR}/textos-perfil/especies"
DIR_TEXTOS_FAMILIAS =f"{TEMP_DIR}/textos-perfil/familias"



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
        doc.GetContentFile(f"{DIR_TEXTOS_FAMILIAS}/{doc['title'].lower()}.md", mimetype="text/plain")
        
        
    for doc in getDocsEspecies():
        print(f"Baixando documento da espécie {doc['title']}")
        doc.GetContentFile(f"{DIR_TEXTOS_ESPECIES}/{doc['title'].lower()}.md", mimetype="text/plain")




### =======================================
### Baixar tabelas de espécies e de autores

fpath = f"{TEMP_DIR}/speciesdata.csv"

def fetchTabelaEspecies():
    print("Baixando a tabela de espécies...")
    gc = driveconnect.connectGoogleSheets()
    sh = gc.open_by_key("15S4MzEaFHTljkEHVEnvUm32t5Mr0AdNHBk-H818nKsE")
    
    print("salvando a tabela de espécies...") 
    df = pd.DataFrame( sh.get_worksheet(0).get_all_records() ).dropna(how='all',axis=0)
    df = df[ df['Espécie']!='']
    df.to_csv(fpath, index=False)
    


def run():
    os.makedirs(f'{DIR_TEXTOS_ESPECIES}')
    os.makedirs(f'{DIR_TEXTOS_FAMILIAS}')

    fetchProfilesDocuments()
    
    fetchTabelaEspecies()
    
if __name__=='__main__':

    run()



