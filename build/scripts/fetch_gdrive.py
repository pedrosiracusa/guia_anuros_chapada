import re, os, shutil
from pathlib import Path

import pandas as pd

import driveconnect
import settings
settings.init()



TEMP_DIR = settings.SCRIPTS_TMPDIR
DIR_TEXTOS_ESPECIES = f"{TEMP_DIR}/textos-perfil/especies"
DIR_TEXTOS_FAMILIAS =f"{TEMP_DIR}/textos-perfil/familias"

# Ids das planilhas e diretórios no gdrive
PLANILHA_ESPECIES_GDRIVE_ID = "15S4MzEaFHTljkEHVEnvUm32t5Mr0AdNHBk-H818nKsE"
PLANILHA_AUTORES_GDRIVE_ID = "1uJvHm1erMKXguO1qCnS_kdTl-CDd50zff2Vwj1zDTvw"
GDRIVE_DIR_AVATARS_AUTORES_ID = "1ef4j2eAyJPedQ7A0CGWPz58sASa1u_Zu"
GDRIVE_DIR_AVATARS_ESPECIES_ID = "18vrp_kabZRKTMjBvoum-dniVvtICQEbd"

# Caminhos para salvar os arquivos temporariamente
PATH_TABELA_ESPECIES = f"{TEMP_DIR}/especiesdata.csv" 
PATH_TABELA_AUTORES = f"{TEMP_DIR}/autoresdata.csv"
DIR_AVATARS_ESPECIES = f"{TEMP_DIR}/sp-avatar"
DIR_AVATARS_AUTORES = f"{TEMP_DIR}/authors-avatar"




drive = driveconnect.connectGoogleDrive()

PROJECT_ID = '0B0M5IL0AEOXidHZmTjZzMHlLLWc'
ROOT_ID = drive.ListFile({'q': f"title contains 'dados_guia_digital' and '{PROJECT_ID}' in parents"}).GetList()[0]['id']
DIRECTORY_ESPECIES_ID = drive.ListFile({'q': f"title contains 'especies_perfil_textos' and '{ROOT_ID}' in parents"}).GetList()[0]['id']
DIRECTORY_FAMILIAS_ID = drive.ListFile({'q': f"title contains 'familias_perfil_textos' and '{ROOT_ID}' in parents"}).GetList()[0]['id']

### =============================================================
### Baixar textos de perfis (espécies e famílias)

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

def fetchTabelaEspecies():
    fpath = PATH_TABELA_ESPECIES
    
    print("Baixando a tabela de espécies...")
    gc = driveconnect.connectGoogleSheets()
    sh = gc.open_by_key(PLANILHA_ESPECIES_GDRIVE_ID)
    
    print("salvando a tabela de espécies...") 
    df = pd.DataFrame( sh.get_worksheet(0).get_all_records() ).dropna(how='all',axis=0)
    df = df[ df['Espécie']!='']
    df.to_csv(fpath, index=False)
    
def fetchTabelaAutores():
    fpath = PATH_TABELA_AUTORES
    
    print("Baixando a tabela de autores...")
    gc = driveconnect.connectGoogleSheets()
    sh = gc.open_by_key(PLANILHA_AUTORES_GDRIVE_ID)
    
    print("salvando a tabela de autores...") 
    df = pd.DataFrame( sh. get_worksheet(0).get_all_records() ).dropna(how='all',axis=0)
    df.to_csv(fpath, index=False)





### =======================================
### Baixar avatares (imagens) de espécies e de autores

def fetchAvatarsAutores():
    os.makedirs(f'{DIR_AVATARS_AUTORES}',exist_ok=True)
    
    autoresAvatars = drive.ListFile({
        'q': f"'{GDRIVE_DIR_AVATARS_AUTORES_ID}' in parents"
    }).GetList()
    
    for img in autoresAvatars:
        print(f"Baixando imagem de autor: {img['title']}")
        img.GetContentFile(f"{DIR_AVATARS_AUTORES}/{img['title'].lower()}")
        
def fetchAvatarsEspecies():
    os.makedirs(f'{DIR_AVATARS_ESPECIES}',exist_ok=True)
    
    autoresAvatars = drive.ListFile({
        'q': f"'{GDRIVE_DIR_AVATARS_ESPECIES_ID}' in parents"
    }).GetList()
    
    for img in autoresAvatars:
        print(f"Baixando imagem de espécie: {img['title']}")
        img.GetContentFile(f"{DIR_AVATARS_ESPECIES}/{img['title'].lower()}")


def run():
    os.makedirs(f'{DIR_TEXTOS_ESPECIES}',exist_ok=True)
    os.makedirs(f'{DIR_TEXTOS_FAMILIAS}', exist_ok=True)

    fetchProfilesDocuments()
    
    fetchTabelaEspecies()
    
if __name__=='__main__':

    run()



