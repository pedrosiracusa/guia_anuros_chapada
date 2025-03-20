var soundIsPlaying=false;
var loopCounter=0;


if(document.querySelector(".species-page")){

    const speciesId = document.URL.substr( document.URL.lastIndexOf('/')+1)
    const fileUrl = `../assets/audio/species_calls/${speciesId}`

    var sound = new Howl({
        src: [`${fileUrl}.wav`,`${fileUrl}.mp3`,`${fileUrl}.webm`],
        autoplay: false,
        loop:true,
        onstop: onStop,
        onplay: onPlay,
        onend: onEnd
    })


    function onStop(){
        document.querySelector("#sound-player #ctrl-play").style.display = "inline-block"
        document.querySelector("#sound-player #ctrl-pause").style.display = "none"
        loopCounter=0
    }
    
    function onPlay(id){
        document.querySelector("#sound-player #ctrl-play").style.display = "none"
        document.querySelector("#sound-player #ctrl-pause").style.display = "inline-block"
    }

    function onEnd(){
        loopCounter+=1
        if (loopCounter>3)
            this.stop()
    }

    sound.once("load",()=>{
        showMediaControls()
    })

    function showMediaControls(){
        document.querySelector("#sound-player").style.display="flex";
    }

    document.querySelector("#sound-player").addEventListener('click',(e)=>{
        if( sound.playing() )
            sound.stop()
        else
            sound.play()

    })

}
