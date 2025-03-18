var speciesList = [];

const nextSpeciesButton = document.querySelector('a#next-species');
const previousSpeciesButton = document.querySelector('a#previous-species')

const baseUrl = document.URL.substr(0,document.URL.lastIndexOf('/'))
const speciesId = document.URL.substr( document.URL.lastIndexOf('/')+1)

try{
    loadSpeciesListFromSessionStorage()
    assignLinksToButtons()
}catch(e){null}

function loadSpeciesListFromSessionStorage(){
    this.speciesList = JSON.parse( sessionStorage.getItem("guia_activeSpeciesList") );
}

function assignLinksToButtons(){
    const currentSpeciesIdx = this.speciesList.indexOf(speciesId);
    const nextSpeciesIdx = (currentSpeciesIdx+1) % this.speciesList.length
    const previousSpeciesIdx = (this.speciesList.length + currentSpeciesIdx - 1) % this.speciesList.length

    const nextSpeciesId=this.speciesList[nextSpeciesIdx]
    const previousSpeciesId=this.speciesList[previousSpeciesIdx]
    
    nextSpeciesButton.addEventListener("click", (event)=>{
        nextSpeciesButton.href= `${baseUrl + '/' + nextSpeciesId}`
    })
    previousSpeciesButton.addEventListener("click",(event)=>{
        previousSpeciesButton.href=`${baseUrl + '/' + previousSpeciesId}`
    })
}
