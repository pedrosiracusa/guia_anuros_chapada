---
---

const speciesDataFile = "{{site.baseurl}}" + "/assets/data/species.json";
const pageIsSpeciesList = Boolean(document.querySelector("section#species-list"));

let allSpecies = []; // Array of species data objects
let selectedSpecies = new Set(); // Set([sp1, sp2, ...])
let filtrosAplicados = {}; // Object of {'filter-id': Set([sp1, sp2, ...])}
let searchQuery = "";
const currentMonth = new Date().getMonth();
let flagSessionStorageEmpty = false;

const MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

document.querySelectorAll(".set-month").forEach(el => {
    el.textContent = MONTH_NAMES[currentMonth];
});

window.addEventListener("load", function () {
    loadSessionStorage();

    fetch(speciesDataFile)
        .then(response => response.json())
        .then(speciesData => {
            allSpecies = speciesData;
            onDataLoaded();
        });
});

function onDataLoaded() {
    if (flagSessionStorageEmpty) {
        selectedSpecies = new Set(allSpecies.map(sp => sp.id));
        filtrosAplicados = {};
        writeSessionStorage();
    }

    selectedSpecies = combineFilters(filtrosAplicados);

    // Register click events on filter buttons
    document.querySelectorAll(".filter-bar .btn").forEach(btn => {
        btn.addEventListener("click", event => {
            toggleFiltrar(event.currentTarget);
        });
    });

    document.querySelectorAll(".btn-limpar-filtros").forEach(btn => {
        btn.addEventListener("click", () => {
            limpaTodosFiltros();
        });
    });

    // Register click events on dropdown buttons
    document.querySelectorAll("#filtro-habitat.filter-dropdown ul button").forEach(btn => {
        btn.addEventListener("click", event => {
            selectPhytoInDropdown(event.currentTarget);
        });
    });

    // Register input event on text search
    const searchInput = document.getElementById("filtro-busca");
    if (searchInput) {
        searchInput.addEventListener("input", event => {
            applyTextSearch(event.target.value);
        });
    }

    // Restore active filters UI state without re-triggering click side-effects
    inicializarFiltros();

    // Update UI
    atualizaNav();
    if (pageIsSpeciesList) {
        atualizaTelaListaEspecies();
    }
}

function applyHabitatDropdownUI(btn) {
    const dropdownButton = document.querySelector("#filtro-habitat.filter-dropdown button.dropdown-toggle");
    if (!dropdownButton) return;

    document.querySelectorAll(".filter-dropdown button.dropdown-item").forEach(i => i.classList.remove("active"));

    if (!btn || btn.dataset.id === "reset") {
        dropdownButton.innerText = "Habitat";
        dropdownButton.dataset.selected = "null";
        dropdownButton.classList.remove("active");
    } else {
        dropdownButton.innerText = btn.textContent;
        dropdownButton.dataset.selected = btn.dataset.id;
        dropdownButton.classList.add("active");
        btn.classList.add("active");
    }
}

function selectPhytoInDropdown(btn) {
    for (const key in filtrosAplicados) {
        if (key.startsWith("filtro-habitat")) {
            delete filtrosAplicados[key];
        }
    }

    applyHabitatDropdownUI(btn);

    if (btn.dataset.id !== "reset") {
        const activePhyto = btn.dataset.id;
        filtrosAplicados[`filtro-habitat-${activePhyto}`] = new Set(
            allSpecies
                .filter(sp => sp.phytos.split(",").includes(activePhyto))
                .map(sp => sp.id)
        );
    }

    selectedSpecies = combineFilters(filtrosAplicados);
    writeSessionStorage();
    atualizaNav();
    if (pageIsSpeciesList) {
        atualizaTelaListaEspecies();
    }
}

function inicializarFiltros() {
    const botoesAtivos = Object.keys(filtrosAplicados);

    document.querySelectorAll(".filter-bar .btn").forEach(btnFiltro => {
        const isActive = botoesAtivos.includes(btnFiltro.id);
        btnFiltro.classList.toggle("active", isActive);
        btnFiltro.setAttribute("aria-pressed", String(isActive));
        if (btnFiltro.children[0]) {
            btnFiltro.children[0].style.display = isActive ? "inline" : "none";
        }
    });

    const activeHabitatBtn = Array.from(
        document.querySelectorAll("#filtro-habitat.filter-dropdown button.dropdown-item")
    ).find(btnDropdown => botoesAtivos.includes(btnDropdown.id));

    if (activeHabitatBtn) {
        applyHabitatDropdownUI(activeHabitatBtn);
    }
}

function normalizeText(str) {
    return String(str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function applyTextSearch(query) {
    searchQuery = query || "";
    if (pageIsSpeciesList) {
        atualizaTelaListaEspecies();
    }
}

function toggleFiltrar(btn) {
    const btnActive = btn.classList.contains("active");

    const filterQueries = {
        "filtro-noturnas": sp => sp.atividade_not === 1,
        "filtro-diurnas": sp => sp.atividade_diu === 1,
        "filtro-comuns": sp => sp.detectability_ff === 1,
        "filtro-pequenas": sp => sp.tamanho_med < 40,
        "filtro-grandes": sp => sp.tamanho_med > 80,
        "filtro-mes": sp => sp.month_vec[currentMonth] === 1
    };

    if (btnActive && filterQueries[btn.id]) {
        filtrosAplicados[btn.id] = new Set(
            allSpecies.filter(filterQueries[btn.id]).map(sp => sp.id)
        );
        if (btn.children[0]) btn.children[0].style.display = "inline";
    } else {
        delete filtrosAplicados[btn.id];
        if (btn.children[0]) btn.children[0].style.display = "none";
    }

    selectedSpecies = combineFilters(filtrosAplicados);
    writeSessionStorage();
    atualizaNav();
    if (pageIsSpeciesList) {
        atualizaTelaListaEspecies();
    }
}

function writeSessionStorage() {
    sessionStorage.setItem(
        "guia_activeSpeciesFilters",
        JSON.stringify(filtrosAplicados, (_key, value) => (value instanceof Set ? [...value] : value))
    );

    sessionStorage.setItem(
        "guia_activeSpeciesList",
        JSON.stringify(Array.from(selectedSpecies))
    );
}

function loadSessionStorage() {
    const activeSpeciesFiltersLoaded = sessionStorage.getItem("guia_activeSpeciesFilters");
    if (activeSpeciesFiltersLoaded) {
        flagSessionStorageEmpty = false;
        const parsed = JSON.parse(activeSpeciesFiltersLoaded);
        // Ignore legacy filtro-busca if present in sessionStorage
        delete parsed["filtro-busca"];
        filtrosAplicados = Object.keys(parsed).reduce((result, key) => {
            result[key] = new Set(parsed[key]);
            return result;
        }, {});
        selectedSpecies = combineFilters(filtrosAplicados);
    } else {
        flagSessionStorageEmpty = true;
        selectedSpecies = new Set(allSpecies.map(sp => sp.id));
    }
}

function intersectSets(setA, setB) {
    const result = new Set();
    setA.forEach(item => {
        if (setB.has(item)) result.add(item);
    });
    return result;
}

function differenceSets(setA, setB) {
    const result = new Set();
    setA.forEach(item => {
        if (!setB.has(item)) result.add(item);
    });
    return result;
}

function combineFilters(filters) {
    const allIds = new Set(allSpecies.map(sp => sp.id));
    const filtersList = Object.values(filters);
    if (filtersList.length === 0) {
        return allIds;
    }

    let finalSetFilter = allSpecies.length > 0 ? intersectSets(allIds, filtersList[0]) : new Set(filtersList[0]);
    for (let i = 1; i < filtersList.length; i++) {
        finalSetFilter = intersectSets(finalSetFilter, filtersList[i]);
    }
    return finalSetFilter;
}

function atualizaNav() {
    const filtrosAtivos = Object.keys(filtrosAplicados);
    const hasActiveFilters = filtrosAtivos.length > 0;

    const filterIndicator = document.querySelector("#filter-indicator-nav");
    if (filterIndicator) {
        filterIndicator.style.display = hasActiveFilters ? "inline" : "none";
    }

    document.querySelectorAll(".nav-filtros-ativos-list > span[data-filter-id]").forEach(filtro => {
        filtro.style.display = filtrosAtivos.includes(filtro.dataset.filterId) ? "inline" : "none";
    });

    const navFiltrosAtivos = document.querySelector(".nav-filtros-ativos");
    if (navFiltrosAtivos) {
        navFiltrosAtivos.style.display = hasActiveFilters ? "block" : "none";
    }

    const sppageFiltrosAtivos = document.querySelector(".sppage-filtros-ativos");
    if (sppageFiltrosAtivos) {
        sppageFiltrosAtivos.style.display = hasActiveFilters ? "block" : "none";
    }
}

function atualizaTelaListaEspecies() {
    const trimmedSearch = normalizeText(searchQuery.trim());
    let speciesToShow = selectedSpecies;

    if (trimmedSearch) {
        const searchMatches = new Set(
            allSpecies
                .filter(sp => {
                    const haystack = normalizeText(
                        `${sp.scientificName} ${sp.family} ${(sp.vernacularNames || []).join(" ")}`
                    );
                    return haystack.includes(trimmedSearch);
                })
                .map(sp => sp.id)
        );
        speciesToShow = intersectSets(selectedSpecies, searchMatches);
    }

    const allSpeciesIds = new Set(allSpecies.map(sp => sp.id));
    const speciesToHide = differenceSets(allSpeciesIds, speciesToShow);

    speciesToHide.forEach(id => {
        document.querySelectorAll(`[data-species="${id}"]`).forEach(el => {
            el.style.display = "none";
        });
    });

    speciesToShow.forEach(id => {
        document.querySelectorAll(`[data-species="${id}"]`).forEach(el => {
            el.style.display = "block";
        });
    });

    const hasActiveFilters = Object.keys(filtrosAplicados).length > 0 || trimmedSearch.length > 0;
    const contadorContainer = document.getElementById("contador-especies-container");
    const contadorEl = document.getElementById("contador-especies");
    if (contadorContainer && contadorEl) {
        contadorContainer.style.setProperty("display", hasActiveFilters ? "flex" : "none", "important");
        contadorEl.textContent = speciesToShow.size;
    }

    document.querySelectorAll(".familia-header").forEach(fh => {
        const emptySpeciesList = fh.nextElementSibling && fh.nextElementSibling.clientHeight === 0;
        fh.style.display = emptySpeciesList ? "none" : "block";
    });
}

function limpaTodosFiltros() {
    filtrosAplicados = {};
    searchQuery = "";
    selectedSpecies = new Set(allSpecies.map(sp => sp.id));

    const searchInput = document.getElementById("filtro-busca");
    if (searchInput) {
        searchInput.value = "";
    }

    document.querySelectorAll(".filter-bar .btn").forEach(btn => {
        btn.classList.remove("active");
        btn.setAttribute("aria-pressed", "false");
        if (btn.children[0]) btn.children[0].style.display = "none";
    });

    applyHabitatDropdownUI(null);
    writeSessionStorage();
    atualizaNav();
    if (pageIsSpeciesList) {
        atualizaTelaListaEspecies();
    }
}
