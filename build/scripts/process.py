import re, json
import os, glob, shutil
from bs4 import BeautifulSoup
from slugify import slugify
from collections import namedtuple
import markdown
from lxml import etree

import pandas as pd
import numpy as np



import settings
settings.init()

TEMP_DIR = settings.SCRIPTS_TMPDIR

DIR_TEXTOS_ESPECIES = f"{TEMP_DIR}/textos-perfil/especies"
DIR_TEXTOS_ESPECIES_PROCESSADO = f"{DIR_TEXTOS_ESPECIES}/processado"
DIR_TEXTOS_FAMILIAS =f"{TEMP_DIR}/textos-perfil/familias"

PATH_TABELA_ESPECIES = f"{TEMP_DIR}/especiesdata.csv" 
PATH_TABELA_AUTORES = f"{TEMP_DIR}/autoresdata.csv"

PATH_DADOS_JSON = f"{TEMP_DIR}/_data"
PATH_DADOS_ESPECIES_JSON = f"{PATH_DADOS_JSON}/species.json"




### ======================================================
### Processamento de texto (artigos) de espécies para HTML

def markdownToHtml(fpath):
    # Faz o parse do markdown p/ html e coloca os elementos de cabeçalho principais em divs, com as classes correspondentes
    with open(fpath, 'r', encoding='utf-8-sig') as f:
        txt = f.read()
        htmlDoc = markdown.markdown(txt,extensions=['extra'])
        
    soup = BeautifulSoup(htmlDoc,'lxml')

    elements = [i for i in soup.body.children ]
    headersIdxs = [i for i,e in enumerate(soup.body.children) if e.name=='h1' ]

    elementGroups = [ elements[iStart:iEnd] for iStart,iEnd in zip([0]+headersIdxs, headersIdxs+[None]) ]
    elementGroups = [ [ i for i in g if i!='\n' ] for g in elementGroups ]

    for i,g in enumerate(elementGroups):
        
        div = soup.new_tag("div")
        div.extend(g)
        div['class'] = slugify( g[0].text if g[0].name in ['h1','h2','h3','h4','h5','h6'] else 'descricao-geral' )
        soup.html.insert(i,div)

    soup.body.decompose()
    return BeautifulSoup( "\n".join(str(i) for i in list(soup.html.children) ),'html.parser' ).prettify()


def processarTextosEspecies():
    print("\nIniciando processamento de textos de espécies:")
    os.makedirs( DIR_TEXTOS_ESPECIES_PROCESSADO, exist_ok=True )
    
    for fpath in glob.glob(f"{DIR_TEXTOS_ESPECIES}/*.md"):
        fileNameNoExtension = os.path.splitext(os.path.basename(fpath))[0]
        print(f"  Processando arquivo {os.path.basename(fpath)}")
        
        try:
            res = markdownToHtml(fpath)
            with open(f"{DIR_TEXTOS_ESPECIES_PROCESSADO}/{fileNameNoExtension}.md",'w') as f:
                f.write(res)
            print("[OK]")
            
        except(AttributeError) as e:
            print(f"Erro no processamento de {os.path.basename(fpath)}: {e}")
            print("[ERRO]")
            
        

### ===============================================
### Processamento das tabelas de espécies e autores

def processarTabelaEspecies():
    print("Processando tabela de Espécies")
    dataFile = PATH_TABELA_ESPECIES
    df = pd.read_csv(dataFile)
    df = df[df['incluir_guia_web']==1]

    df.rename( {'Espécie':'scientificName',
                'Família':'family',
                'Nome Comum': 'vernacularNames',
                'Fitofisionomias': 'phytos',
                'Red List - sigla':'Red List',
                'Postura dos ovos (habitat breeding)*': 'habitat_breeding',
                'Habitat de vida (mata ou floresta/area aberta/pedras)*':'habitat',
                'Tamanho real (mm) - fêmea':'tamanho_femea',
                'Tamanho real (mm) - macho':'tamanho_macho',
                'Chances de encontros (muito raro/raro/frequente/muito frequente)': 'detectability'}, axis=1, inplace=True)


    # Species name, id and Authorship
    df['scientificName_withAuthorship']=df['scientificName']
    df['scientificName'] = df['scientificName_withAuthorship'].apply(lambda x: re.findall( '^\w+(?: cf.| aff.)? \w+\.?', str(x))[0])
    df['scientificNameAuthorship'] = df[['scientificName_withAuthorship','scientificName']].apply(lambda x: x[0][len(x[1]):], axis=1)
    df['scientificNameAuthorship'] = df['scientificNameAuthorship'].apply(lambda x: re.findall( '[\w,\s\-&]+', str(x) )).apply(lambda x: ''.join(x).strip())

    ids = df['scientificName'].str.replace('\s','-', regex=True).str.replace('[.]','', regex=True).str.lower()
    df.insert(0, 'id', ids)
    df.drop('scientificName_withAuthorship', axis=1, inplace=True)

    # Family name and id
    df['family'] = df['family'].str.extract("([A-Za-z]+)")[0].apply(lambda x: x.capitalize())
    df['family_id'] = df['family'].str.lower()

    # Vernacular name
    def extractVernacularNames(string):
        if pd.isna(string): string=''
        names = re.split('/|;|,',string)
        names = [ n.strip().replace(' ','-').capitalize() for n in names ]
        if len(names)==1 and names[0]=='':
            return []
        else:
            return names

    df['vernacularNames'] = df['vernacularNames'].apply(extractVernacularNames)

    # Red list
    df['redlist_eval'] = df['Red List'].str.lower()
    # df = pd.get_dummies(data=df, prefix='redlist', columns=['Red List'], dtype=int)

    # Endemicidade
    df['endemic_cerrado'] = df['Endêmico (Cerrado)'].apply(lambda x: 1 if x=='sim' else 0)
    df['endemic_chapada'] = df['Endêmico (Chapada)'].apply(lambda x: 1 if x=='sim' else 0)
    df.drop('Endêmico (Chapada)', axis=1, inplace=True)
    df.drop('Endêmico (Cerrado)', axis=1, inplace=True)

    # Helpers
    getInsideParentheses = lambda x: [ str.lower(e) for e in re.findall( '\((.{0,5})\)', str(x) ) ]

    # Detectability
    df['detectability'] = df['detectability']\
        .str.replace('[^\w]','',regex=True)\
        .str.replace('ê','e')\
        .str.lower()
        
    subst_dict = {
        'muitofrequente': 'ff',
        'frequente':'f',
        'raro': 'r',
        'muitoraro': 'rr'
    }

    df['detectability'] = df['detectability'].apply(lambda x: subst_dict[x] if x is not np.NaN else x)
    df = pd.get_dummies(df, prefix='detectability',columns=['detectability'], dtype=int)

    # Poleiro
    df['poleiro'] = df['Poleiro (tipical calling perch)* '].apply( getInsideParentheses )
    df.drop('Poleiro (tipical calling perch)* ', axis=1, inplace=True)

    poleiro_types = list(set( el for ls in df['poleiro'] for el in ls))
    for tp in poleiro_types:
        df[f'tcp_{tp}'] = df['poleiro'].apply(lambda x: 1 if f'{tp}' in x else 0)
        
    df.drop('poleiro', axis=1, inplace=True)

    # Habitat breeding
    matches = df['habitat_breeding'].str.lower().str.extractall('\((\w+)\)')
    hb_dummies = pd.get_dummies(matches, prefix="habitat_breeding").groupby(level=0).sum()
    hb_dummies = hb_dummies.reindex(df.index).fillna(0).astype(int)

    df = pd.concat([df,hb_dummies], axis=1)
    df.drop('habitat_breeding',axis=1, inplace=True)

    # Phytophysiognomies categoricals
    replaces = {
    } 
    df['phytos'] = df['phytos'].str.lower().str.strip().str.split('\s*,\s*')\
        .apply(lambda x: [replaces.get(i,i) for i in x] if isinstance(x,list) else '')\
        .str.join(',')

    # Atividade
    df['atividade_diu'] = df['Atividade (noturno/diurno)'].apply(lambda x: 1 if 'diurno' in str(x) else 0)
    df['atividade_not'] = df['Atividade (noturno/diurno)'].apply(lambda x: 1 if 'noturno' in str(x) else 0)
    df.drop('Atividade (noturno/diurno)', axis=1, inplace=True)

    # Tamanho
    def calculaTamanhoMedio(strTamanho):
        # Recebe valores em string como '2.3-1.2'
        if type(strTamanho)!=str:
            return None
        listaMedidas = [ float(medida.strip().replace(',','.')) for medida in re.findall('([0-9/.,]+)',strTamanho) ]
        return sum(listaMedidas)/len(listaMedidas)

    df['tamanho_femea_med'] = df['tamanho_femea'].apply(calculaTamanhoMedio)
    df['tamanho_macho_med'] = df['tamanho_macho'].apply(calculaTamanhoMedio)
    df['tamanho_med'] = df['tamanho_macho_med']

    # Meses de ocorrência

    # 1. Extract month ranges from strings
    def occurrence_months(m_start, m_end):
        d=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
        idx_mstart = d.index(m_start)
        idx_mend = d.index(m_end)
        
        if idx_mstart > idx_mend:
            return d[idx_mstart:]+d[:idx_mend+1]
        else:
            return d[idx_mstart:idx_mend+1]
        
        
    def months_to_array(mths):
        d=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
        return [ 1 if i in mths else 0 for i in d ]

    def monthsToArray(periods):
        if type(periods) is not list:
            return [0 for i in range(12)]
        
        d=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
        def getOcurrenceMonths(month_start, month_end):
            idx_mstart = d.index(month_start)
            idx_mend = d.index(month_end)
            if idx_mstart > idx_mend:
                return d[idx_mstart:]+d[:idx_mend+1]
            else:
                return d[idx_mstart:idx_mend+1]
            
        months = [ month for period in periods for month in getOcurrenceMonths(*period.strip().split('-')) ]
        return [1 if i in months else 0 for i in d]


    df['month_vec'] = df['meses_ocorrencia'].str.split(',').apply(monthsToArray )

    # Select fields to use
    fieldsToUse = ["id", "family", "scientificName","vernacularNames",
    "phytos", "scientificNameAuthorship", "family_id",
    "endemic_cerrado", "endemic_chapada", "redlist_eval",
    "detectability_f", "detectability_ff", "detectability_r", "detectability_rr",
    "habitat_breeding_le","habitat_breeding_lo","habitat_breeding_tr",
    "atividade_diu","atividade_not",
    "tamanho_med","month_vec"] +\
    [ c for c in df.columns if "redlist_" in c ] +\
    [ c for c in df.columns if "tcp_" in c]

    df = df[fieldsToUse]

    # ### Sort dataframe by Family and id
    df = df.sort_values(by=['family','id'])

    # ### Write to json
    d = df.to_dict(orient='records')

    ## Salva em tmp/_data
    os.makedirs(PATH_DADOS_JSON, exist_ok=True)
    with open(PATH_DADOS_ESPECIES_JSON, 'w') as f:
        json.dump(d, f,indent=1, ensure_ascii=False)
        
    ## Salva em tmp/assets
    path_assets = f"{TEMP_DIR}/assets/data"
    os.makedirs(path_assets, exist_ok=True)
    with open(f"{path_assets}/species.json",'w') as f:
        json.dump(d, f,indent=1, ensure_ascii=False)
    
    print("[OK]")
        
        
def processarTabelaAutores():
    print("Processando tabela de Autores")
    dataFile = PATH_TABELA_AUTORES
    df = pd.read_csv(dataFile)

    def strToJson(str):
        if pd.notnull(str):
            return { k:v  for link in str.split(";") for k,v in re.findall("(.*):\s*(http.*)",link) }
        else:
            return {}
    df['Links'] = df['Links'].apply(strToJson)

    # ### Renomeação de campos
    df.rename( {'Nome':'nome',
                'Tipo': 'tipo',
                'Papel': 'papel',
                'Descrição': 'descricao',
                'Links': 'links',
                'avatar-id':'avatar-img'}, axis=1, inplace=True)

    d = {'autores': df[df['tipo']=='Autor'].drop('tipo',axis=1).to_dict(orient='records'),
    'colaboradores': df[df['tipo']=='Colaborador'].drop('tipo',axis=1).to_dict(orient='records')}

    # # Exportação
    species_data_path = f"{TEMP_DIR}/_data/autores.json"

    with open(species_data_path, 'w') as f:
        json.dump(d, f,indent=1, ensure_ascii=False)
    print("[OK]")






    
def run():
    pass

if __name__=='__main__':
    run()

