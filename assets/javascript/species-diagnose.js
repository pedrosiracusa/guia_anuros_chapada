---
---

const speciesPageDiagnoseEl = document.querySelector("div.species-page");

if(speciesPageDiagnoseEl){ // Only runs in species pages


    window.addEventListener('load', function(){
        const speciesId = speciesPageDiagnoseEl.id;
        diagnoseDiv = document.createElement("div")
        diagnoseDiv.classList.add("col-xl-6", "col-lg-8")
        diagnoseDiv.id = "img-diagnose"
        diagnoseDiv.innerHTML = `<img src="{{site.baseurl}}/assets/img/diagnose/${speciesId}.jpg">`
    
        document.querySelector(".diagnose").appendChild( diagnoseDiv)
    
        document.querySelector(".diagnose img").addEventListener("error",(e)=>{
            e.currentTarget.style.display="none";
        })
    })


    
}