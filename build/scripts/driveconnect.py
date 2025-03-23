import pandas as pd
from pathlib import Path

from pydrive.auth import GoogleAuth
from pydrive.drive import GoogleDrive
from pydrive.auth import ServiceAccountCredentials

def connectGoogleDrive():
    SCOPES = ['https://www.googleapis.com/auth/drive']
    SERVICE_ACCOUNT_KEY_FILE = f'{Path.home()}/workspace/.sacreds/guia-anuros_service_account_key.json'

    gauth = GoogleAuth()
    gauth.credentials = ServiceAccountCredentials.from_json_keyfile_name(SERVICE_ACCOUNT_KEY_FILE,SCOPES)
    return GoogleDrive(gauth)
