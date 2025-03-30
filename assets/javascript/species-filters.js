---
---

const speciesDataFile = "{{site.baseurl}}"+"/assets/data/species.json"
const pageIsSpeciesList = document.querySelector("section#species-list")


var allSpecies=[]; // Species Data: Array of species data objects
var selectedSpecies; //  Set([sp1,sp2,...])
var filtrosAplicados={}; // Object of {'filter-id':Set([sp1,sp2,...])}
var currentMonth;
var flagSessionStorageEmpty;

// var allPhytos=[];

this.currentMonth = new Date().getMonth()
document.querySelectorAll("#filtro-mes .set-month").forEach(filtro=>{
    filtro.textContent += ["Jan","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"][this.currentMonth]
})


window.addEventListener('load', function(){
    // Load session storage
    loadSessionStorage()

    // Read species data
    fetch(speciesDataFile)
        .then(response => response.json() )
        .then( speciesData => {
            this.allSpecies = speciesData;
            onDataLoaded();
        })
})


function onDataLoaded(){
    // Rotinas para executar após o carregamento dos dados


    if(this.flagSessionStorageEmpty){
        this.selectedSpecies = new Set( this.allSpecies.map(sp=>sp.id))
        this.filtrosAplicados = {}
        writeSessionStorage()
    }

    this.selectedSpecies = combineFilters(this.filtrosAplicados)
        
    // Register click events on filter buttons
    document.querySelectorAll('.filter-bar .btn').forEach( btn =>{
        btn.addEventListener("click", (event)=>{
            toggleFiltrar(event.currentTarget)
        })
    })
    document.querySelector(".nav-filtros-ativos button#limpar-filtros").addEventListener("click",e=>{
        limpaTodosFiltros();
    });

    // Register click events on dropdown buttons
    document.querySelectorAll('#filtro-habitat.filter-dropdown ul button').forEach(btn=>{
        btn.addEventListener("click",(event)=>{
            selectPhytoInDropdown(event.currentTarget)
        })
    })

    // Retoma filtros já ativos
    inicializarFiltros()

    // Atualiza telas
    atualizaNav()
    pageIsSpeciesList ? atualizaTelaListaEspecies() : null
}

function loadPhytos(){
    // Carrega todas as fitofisionomias, inicialmente
    const phytosList = [];
    this.allSpecies.map( sp=>{
        sp.phytos.split(',').forEach( phyto=>phytosList.push(phyto))
    } )

    this.allPhytos = Array.from( new Set(phytosList))
}
function selectPhytoInDropdown(btn){
    // Função chamada quando o usuário seleciona uma opção no dropdown
    var dropdownButton = document.querySelector('#filtro-habitat.filter-dropdown button.dropdown-toggle')
    var activePhyto
    
    // clear all active 
    document.querySelectorAll('.filter-dropdown button.dropdown-item').forEach(i=>i.classList.remove('active'))
    for (var key in this.filtrosAplicados) if (key.startsWith("filtro-habitat")) delete this.filtrosAplicados[key]

    // reset case
    if(btn.dataset.id=="reset"){
        dropdownButton.innerText="Habitat"
        dropdownButton.dataset.selected="null"
        dropdownButton.classList.remove("active")
        
    }
    else{
        dropdownButton.innerText=btn.textContent
        dropdownButton.dataset.selected=btn.dataset.id
        dropdownButton.classList.add("active")
        btn.classList.add("active")
        activePhyto=btn.dataset.id
        
        this.filtrosAplicados[`filtro-habitat-${activePhyto}`] = new Set( this.allSpecies.filter( sp=>sp.phytos.split(',').includes(activePhyto)).map(sp=>sp.id))
    }
    this.selectedSpecies = combineFilters(filtrosAplicados)
    writeSessionStorage()
    atualizaNav()
    pageIsSpeciesList ? atualizaTelaListaEspecies() : null
}


function getActivePhytoInDropdown(){
    try{
        return document.querySelector('.filter-dropdown button.dropdown-item.active').dataset.id
    }catch(e){
        return null
    }
}
function setActivePhytoInDropdown(){

}

function inicializarFiltros(){
    // Ao carregar a página, inicializa filtros que já estavam ativos
    const botoesAtivos = Object.keys(this.filtrosAplicados);
    document.querySelectorAll('.filter-bar .btn').forEach(btnFiltro=>
        botoesAtivos.includes(btnFiltro.id) ? btnFiltro.click() : null
    )

    document.querySelectorAll('#filtro-habitat.filter-dropdown button.dropdown-item').forEach(btnDropdown=>
        botoesAtivos.includes(btnDropdown.id) ? btnDropdown.click(): null
    )
}

function toggleFiltrar(btn){
    // toggle nos botões de filtro que aparecem na barra (página lista de espécies)
    const btnActive = btn.classList.contains('active') ? true : false

    filterQueries={
        'filtro-noturnas': sp=>sp.atividade_not===1,
        'filtro-diurnas': sp=>sp.atividade_diu===1,
        'filtro-comuns': sp=>sp.detectability_ff==1,
        'filtro-pequenas': sp=>sp.tamanho_med < 40,
        'filtro-grandes': sp=>sp.tamanho_med>80,
        'filtro-mes': sp=>sp.month_vec[this.currentMonth]===1
    }

    if(btnActive){
        this.filtrosAplicados[btn.id]=new Set( this.allSpecies.filter( filterQueries[btn.id] ).map(sp=>sp.id) );
        btn.children[0].style.display='inline'
    }
    else{
        delete this.filtrosAplicados[btn.id]
        btn.children[0].style.display='none'
    }

    this.selectedSpecies = combineFilters(filtrosAplicados)

    writeSessionStorage()


    atualizaNav()
    pageIsSpeciesList ? atualizaTelaListaEspecies() : null

    
}

function writeSessionStorage(){
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
        this.flagSessionStorageEmpty=false;
        activeSpeciesFiltersLoaded = JSON.parse( sessionStorage.getItem("guia_activeSpeciesFilters") );
        this.filtrosAplicados = objectMap(activeSpeciesFiltersLoaded, (spList)=>new Set(spList))
        this.selectedSpecies = combineFilters(this.filtrosAplicados)
    }else{
        // Loading without session storage -> create it
        this.flagSessionStorageEmpty=true;
        this.selectedSpecies = new Set( this.allSpecies.map(sp=>sp.id) ); 
    }
}

function combineFilters(filters){
    // Recebe um objeto com filtros { 'filter-id':Set([item1,item2,...]) }
    // Retorna um conjunto (Set) com a combinação de todos (intersect)
    const filtersList = Object.values(filters)
    let finalSetFilter = filtersList.length>0 ? filtersList[0] : new Set( this.allSpecies.map(sp=>sp.id));

    for(let i=1; i< filtersList.length;i++ ){
        finalSetFilter = filtersList[i].intersection(finalSetFilter)
    }
    return finalSetFilter
}

function atualizaNav(){
    document.querySelector("#filter-indicator-nav").style.display = Object.keys(this.filtrosAplicados).length===0 ? "none" : "inline"

    let filtrosAtivos = Object.keys(this.filtrosAplicados)
    document.querySelectorAll("#nav-filtros-ativos-list>span").forEach(filtro=> filtro.style.display = filtrosAtivos.includes(filtro.id) ? "inline" : "none" )
    document.querySelector(".nav-filtros-ativos").style.display = filtrosAtivos.length>0 ? "block" : "none"
        
    if (document.querySelector(".species-page"))
        document.querySelector(".sppage-filtros-ativos").style.display = filtrosAtivos.length>0 ? "block" : "none"
    
}

function atualizaFiltrosAtivosPaginaEspecies(){

}

function atualizaTelaListaEspecies(){
    // rotinas para atualização na tela da lista de espécies
    // Executa após toggle dos botões e no carregamento inicial da página
    // Com base nos dados do localstorage

    // Esconde/mostra as espécies filtradas
    const speciesToShow = this.selectedSpecies
    const speciesToHide = new Set(this.allSpecies.map(sp=>sp.id)).difference(speciesToShow)

    speciesToHide.forEach(hide)
    speciesToShow.forEach(show)

    document.getElementById("contador-especies-container").style.display = selectedSpecies.size === this.allSpecies.length ? "none" : "block"
    document.getElementById("contador-especies").innerHTML = selectedSpecies.size;
    toggleHideEmptyFamilies()

    function hide(speciesToHide){
        let element = document.querySelectorAll(`[data-species="${speciesToHide}"]` )
        element[0].style.display = "none"
    }
    function show(speciesToShow){
        let element = document.querySelectorAll(`[data-species="${speciesToShow}"]` )
        element[0].style.display = "block"
    }
    function toggleHideEmptyFamilies(){
        document.querySelectorAll(".familia-header").forEach(fh => {
            const emptySpeciesList = fh.nextElementSibling.clientHeight===0 ? true : false
            fh.style.display = emptySpeciesList ? "none" : "block"
        })
    }
}

function limpaTodosFiltros(){
    this.filtrosAplicados={}
    this.selectedSpecies = new Set(this.allSpecies.map(sp=>sp.id))
    
    writeSessionStorage()
    window.location.reload()
}

