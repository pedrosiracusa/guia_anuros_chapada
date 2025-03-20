var sound = new Howl({
    src: ['frogsound.wav']
})

console.log(sound)
//sound.play();

sound.on("stop",()=>{
    document.querySelector("#sound-player #ctrl-play").style.display = "inline-block"
    document.querySelector("#sound-player #ctrl-pause").style.display = "none"
})
sound.on("play",()=>{
    document.querySelector("#sound-player #ctrl-play").style.display = "none"
    document.querySelector("#sound-player #ctrl-pause").style.display = "inline-block"
})

var soundIsPlaying=false;

if(document.querySelector(".species-page")){

    document.querySelector("#sound-player").addEventListener('click',(e)=>{
        console.log(sound.playing())
        if( sound.playing() )
            sound.stop()
        else
            sound.play()

    })

}
