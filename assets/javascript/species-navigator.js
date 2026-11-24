const speciesPageEl = document.querySelector("div.species-page");

if (speciesPageEl) {
    const nextSpeciesButton = document.querySelector("a#next-species");
    const previousSpeciesButton = document.querySelector("a#previous-species");
    const speciesId = speciesPageEl.id;

    function resolveSpeciesHref(anchor, offset) {
        let speciesList = null;
        try {
            speciesList = JSON.parse(sessionStorage.getItem("guia_activeSpeciesList"));
        } catch (_e) {
            speciesList = null;
        }

        if (!Array.isArray(speciesList) || speciesList.length === 0) return;

        const currentSpeciesIdx = speciesList.indexOf(speciesId);
        if (currentSpeciesIdx === -1) return;

        const targetIdx = (speciesList.length + currentSpeciesIdx + offset) % speciesList.length;
        const targetId = speciesList[targetIdx];
        const currentHref = anchor.getAttribute("href");
        if (currentHref) {
            anchor.setAttribute("href", currentHref.replace(/[^/]+\/?$/, targetId));
        }
    }

    if (nextSpeciesButton) {
        nextSpeciesButton.addEventListener("click", () => {
            resolveSpeciesHref(nextSpeciesButton, 1);
        });
    }

    if (previousSpeciesButton) {
        previousSpeciesButton.addEventListener("click", () => {
            resolveSpeciesHref(previousSpeciesButton, -1);
        });
    }
}
