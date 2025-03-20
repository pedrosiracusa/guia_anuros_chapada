if(document.querySelector("div.species-page")){ // Only runs in species pages

    var speciesList = []
    const nextSpeciesButton = document.querySelector('a#next-species');
    const previousSpeciesButton = document.querySelector('a#previous-species')

    const baseUrl = document.URL.substr(0,document.URL.lastIndexOf('/'))
    const speciesId = document.URL.substr( document.URL.lastIndexOf('/')+1)

    // load species list from session storage
    speciesList = JSON.parse( sessionStorage.getItem("guia_activeSpeciesList") );

    // Event listener for click on next species
    nextSpeciesButton.addEventListener("click", (event)=>{
        let currentSpeciesIdx = speciesList.indexOf(speciesId);
        let nextSpeciesIdx = (currentSpeciesIdx+1) % speciesList.length
        let nextSpeciesId=speciesList[nextSpeciesIdx]
        nextSpeciesButton.href= `${baseUrl + '/' + nextSpeciesId}`
    })

    // Event listener for click on previous species
    previousSpeciesButton.addEventListener("click",(event)=>{
        let currentSpeciesIdx = speciesList.indexOf(speciesId);
        let previousSpeciesIdx = (speciesList.length + currentSpeciesIdx - 1) % speciesList.length
        let previousSpeciesId=speciesList[previousSpeciesIdx]
        previousSpeciesButton.href=`${baseUrl + '/' + previousSpeciesId}`
    })

    // window.addEventListener('load', function(){
    // })

    
}


