---
---

const speciesDataFile = "{{site.baseurl}}"+"/assets/data/species.json"

var allSpecies=[];
var selectedSpecies;
var filtrosAplicados={};
var currentMonth;

this.currentMonth = new Date().getMonth()

document.querySelector("#filtro-mes") ? document.querySelector("#filtro-mes .set-month").textContent += ["Jan","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"][this.currentMonth] : null



window.onload = function(){

    // Load session storage
    loadSessionStorage()
    
    // Register click events on buttons
    const buttons = document.querySelectorAll('.filter-bar .btn');
    buttons.forEach( btn =>{
        btn.addEventListener("click", (event)=>{
            toggleFiltrar(event.currentTarget)
            atualizaDadosTela(event.currentTarget)
        })
    })

    // Read species data
    fetch(speciesDataFile)
        .then(response => response.json() )
        .then( speciesData => {
            allSpecies = speciesData;
            onDataLoaded();
        })
        
}

function onDataLoaded(){
    // Rotinas para executar após o carregamento dos dados
    this.selectedSpecies = new Set(allSpecies.map(sp=>sp.id));
    inicializarFiltros()
}

function inicializarFiltros(){
    // Ao carregar a página, inicializa filtros que já estavam ativos
    const botoesAtivos = Object.keys(this.filtrosAplicados);
    document.querySelectorAll('.filter-bar .btn').forEach(btnFiltro=>
        botoesAtivos.includes(btnFiltro.id) ? btnFiltro.click() : null
    )
}

function toggleFiltrar(btn){
    const btnActive = btn.classList.contains('active') ? true : false
    const allSpecies = new Set( this.allSpecies.map(sp=>sp.id) )

    filterQueries={
        'filtro-noturnas': sp=>sp.atividade_not===1,
        'filtro-diurnas': sp=>sp.atividade_diu===1,
        'filtro-comuns': sp=>sp.detectability_ff==1,
        'filtro-endemicas': sp=>(sp.endemic_cerrado===1 || sp.endemic_chapada===1),
        'filtro-pequenas': sp=>sp.tamanho_med < 40,
        'filtro-grandes': sp=>sp.tamanho_med>80,
        'filtro-mes': sp=>sp.month_vec[this.currentMonth]===1
    }

    if(btnActive){
        filtrosAplicados[btn.id]=new Set( this.allSpecies.filter( filterQueries[btn.id] ).map(sp=>sp.id) );
        btn.children[0].style.display='inline'
        
    }
    else{
        delete filtrosAplicados[btn.id]
        btn.children[0].style.display='none'
    }

    // Iteração final para fazer interseção de todos os filtros aplicados
    const filtersList = Object.values(filtrosAplicados)
    let finalSetFilter = filtersList.length>0 ? filtersList[0] : allSpecies;

    for(let i=1; i< filtersList.length;i++ ){
        finalSetFilter = filtersList[i].intersection(finalSetFilter)
    }

    // Esconde/mostra as espécies filtradas
    const speciesToShow = finalSetFilter
    this.selectedSpecies=speciesToShow
    const speciesToHide = allSpecies.difference(speciesToShow)

    speciesToHide.forEach(hide)
    speciesToShow.forEach(show)

    // Grava filtros no localstorage
    sessionStorage.setItem("guia_activeSpeciesFilters", JSON.stringify( 
        this.filtrosAplicados,
        (_key, value) => (value instanceof Set ? [...value] : value) )
    )

    // Grava lista de espécies filtradas no localstorage
    sessionStorage.setItem("guia_activeSpeciesList", JSON.stringify(
        Array.from( this.selectedSpecies )
    ));
    
}

function loadSessionStorage(){
    // Carrega os dados do session storage
    function objectMap(object, mapFn) {
        return Object.keys(object).reduce(function(result, key) {
            result[key] = mapFn(object[key])
            return result
        }, {})
    }
    
    let activeSpeciesFiltersLoaded = sessionStorage.getItem("guia_activeSpeciesFilters")
    if (activeSpeciesFiltersLoaded){
        activeSpeciesFiltersLoaded = JSON.parse( sessionStorage.getItem("guia_activeSpeciesFilters") );
        this.filtrosAplicados = objectMap(activeSpeciesFiltersLoaded, (spList)=>new Set(spList))
    }

}

function atualizaDadosTela(btn){
    document.getElementById("contador-especies-container").style.display = selectedSpecies.size === this.allSpecies.length ? "none" : "block"
    document.getElementById("contador-especies").innerHTML = selectedSpecies.size;
    toggleHideEmptyFamilies()

}

function toggleHideEmptyFamilies(){
    document.querySelectorAll(".familia-header").forEach(fh => {
        const emptySpeciesList = fh.nextElementSibling.clientHeight===0 ? true : false
        fh.style.display = emptySpeciesList ? "none" : "block"
    })
}



function hide(speciesToHide){
    let element = document.querySelectorAll(`[data-species="${speciesToHide}"]` )
    element[0].style.display = "none"
}
function show(speciesToShow){
    let element = document.querySelectorAll(`[data-species="${speciesToShow}"]` )
    element[0].style.display = "block"
}