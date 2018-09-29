# coding: utf-8

from __future__ import print_function
from apiclient.discovery import build
from apiclient.http import MediaIoBaseDownload
from httplib2 import Http
from oauth2client import file, client, tools
import io,os




store = file.Storage('token.json')
creds = store.get()
service = build(serviceName='drive', version='v3', http=creds.authorize(Http()))


project_id = service.files().list( q="name contains 'Guia Anuro' " ).execute().get('files')[0].get('id')
project_root_items = service.files().list( q=f"'{project_id}' in parents").execute()


# Get species data table
print("Getting species data table")
species_table = list(filter( lambda x: 'tabela_especies' in x.get('name'), project_root_items.get('files') ))[0]
file_content = service.files().export_media( fileId=species_table.get('id'), mimeType='text/csv').execute()

fname = 'speciesdata.csv'
with open (fname, 'wb') as f:
    f.write(file_content)

print(f"Done! Created file {fname} with species data.\n")

# Get species and families articles
print("Getting species and families articles ids")
articlesFolderId = list(filter( lambda x: x.get('name')=='Artigos', project_root_items.get('files')))[0].get('id')
def getFamiliesFoldersIds():
    results = service.files().list( q=f"'{articlesFolderId}' in parents and mimeType contains 'vnd.google-apps.folder'",
                                  fields='files(id,name)').execute().get('files')
    return  { r['name']: r['id'] for r in results }

def getFamilyDocuments( family, families_folders_ids ):
    family_folder_id = families_folders_ids.get(family)
    results = service.files().list( 
        q=f"'{family_folder_id}' in parents and mimeType contains 'document'",
        fields='files(id,name)').execute().get('files')
    return results

families_folders_ids = getFamiliesFoldersIds()
ids_to_download = [ f.get('id') for f in getFamilyDocuments( 'leptodactylidae', families_folders_ids ) ]
family_folders_ids = getFamiliesFoldersIds()
data = { family: [doc for doc in getFamilyDocuments(family, family_folders_ids)] for family, family_id in family_folders_ids.items()}

print("Done\n")

# Update species pages
print("Getting articles contents and updating species pages...")

basepath = '../especies/'
if not os.path.exists(basepath):
    os.makedirs(basepath)

for family in data:
    for doc in [ doc for doc in data[family] if doc['name']!='familia' ]:
        docid = doc['id']
        species = doc['name']
        
        print(f"Requesting article for species {species} ({family})")
        request = service.files().export_media(fileId=docid, mimeType='text/plain')
        fname = basepath+f'{species}.md'
        with open(fname, 'wb') as f:
            f.write(request.execute())
            print(f"Wrote file {fname}")

print("Done")




print("Updating families pages")
basepath = '../familias/'
if not os.path.exists(basepath):
    os.makedirs(basepath)

for family in data:
    for doc in [doc for doc in data[family] if doc['name']=='familia']:
        docid=doc['id']
        
        print(f"Requesting article for family {family}")
        request = service.files().export_media(fileId=docid, mimeType='text/plain')
        fname = basepath+f'{family}.md'
        with open(fname, 'wb') as f:
            f.write(request.execute())
            print(f"wrote file {fname}")

print("Done")
