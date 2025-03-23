import re
import os, glob, shutil
from bs4 import BeautifulSoup
from slugify import slugify
from collections import namedtuple
import markdown
from lxml import etree


import settings
settings.init()

TEMP_DIR = settings.SCRIPTS_TMPDIR

DIR_TEXTOS_ESPECIES = f"{TEMP_DIR}/textos-perfil/especies"
DIR_TEXTOS_ESPECIES_PROCESSADO = f"{DIR_TEXTOS_ESPECIES}/processado"
DIR_TEXTOS_FAMILIAS =f"{TEMP_DIR}/textos-perfil/familias"


# # 1. Convertendo artigos de espécies para HTML

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
            
        
        
    
def run():
    pass

if __name__=='__main__':
    run()

