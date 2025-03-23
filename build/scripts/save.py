
import os, glob, shutil
import settings

settings.init()

TMPDIR = settings.SCRIPTS_TMPDIR
TMPDIR_ESPECIES_PROCESSADO = f"{TMPDIR}/textos-perfil/especies/processado"
TMPDIR_FAMILIAS_PROCESSADO = f"{TMPDIR}/textos-perfil/familias"

PROJECT_BASE=settings.PROJECT_BASEPATH
TGTDIR_ESPECIES = f"{PROJECT_BASE}/especies"
TGTDIR_FAMILIAS = f"{PROJECT_BASE}/familias"

def saveEspeciesPages():
    print("Salvando textos processados de espécies...")
    print(f"{TMPDIR_ESPECIES_PROCESSADO}/*.md")

    for fpath in glob.glob(f"{TMPDIR_ESPECIES_PROCESSADO}/*.md"):
        print(fpath)
        src = fpath
        dest = f"{TGTDIR_ESPECIES}/{os.path.basename(fpath)}"
        print(src,dest)
        shutil.copyfile(src,dest)
    print("[OK]")
        


def saveFamiliasPages():
    print("Salvando textos processados de famílias...")
    for fpath in glob.glob(f"{TMPDIR_FAMILIAS_PROCESSADO}/*.md"):
        print(fpath)
        src = fpath
        dest = f"{TGTDIR_FAMILIAS}/{os.path.basename(fpath)}"

        shutil.copyfile(src,dest)
    print("[OK]")




def run():
    saveEspeciesPages()
    saveFamiliasPages()
    
if __name__=="__main__":
    run()





