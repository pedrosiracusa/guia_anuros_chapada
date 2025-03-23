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
TEMP_DIR = f"{TEMP_DIR}/textos-perfil"
text_dir = f"{TEMP_DIR}/especies"

# # 1. Convertendo artigos de espécies para HTML

def markdownToHtml(fpath):
    with open(fpath, 'r', encoding='utf-8-sig') as f:
        txt = f.read()
        htmlDoc = markdown.markdown(txt,extensions=['extra'])
        
    # Este código pega o html resultante do parse markdown e coloca os elementos em divs correspondentes
    soup = BeautifulSoup(htmlDoc)

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


    
    
def run():
    try: shutil.rmtree(f"{text_dir}/processado")
    except(FileNotFoundError): pass
    os.makedirs(f'{text_dir}/processado')

    # Grava tudo no subdiretório de processados
    print("Iniciando processamento de dados...")

    for filePath in glob.glob(f"{text_dir}/*.md"):
        
        print(f"Processando arquivo: {filePath}")
        fileDir = os.path.dirname(filePath)
        fileNameNoExtension = os.path.splitext( os.path.basename(filePath) )[0]
        try:
            res = markdownToHtml(filePath)
            with open(f"{fileDir}/processado/{fileNameNoExtension}.md", 'w') as f:
                f.write(res)
            
        except(AttributeError) as e:
            print(f"Erro no processamento de {filePath}: {e}")

if __name__=='__main__':
    run()

