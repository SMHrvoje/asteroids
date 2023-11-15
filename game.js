
var can = document.getElementById('canvas');
var ctx = can.getContext('2d');

//postavljanje dimenzija canvasa
can.width = innerWidth-4;
can.height = innerHeight-4;

//definiranje parametara igre
var ASTEROID_SPEED_MIN=0.8
var ASTEROID_SPEED_MAX=2
var PLAYER_SPEED=5
var GENERATE_ASTEROIDS=10

//definiranje pozadine
var img = new Image();
img.src = "wallpaperflare.com_wallpaper.jpg";


const backgroundMusic = document.getElementById('backgroundMusic');

//definiranje aktivnih pritisnutih strelica
var activeButtons=new Map()
activeButtons.set("ArrowLeft",false)
activeButtons.set("ArrowUp",false)
activeButtons.set("ArrowRight",false)
activeButtons.set("ArrowDown",false)

//varijable koje će se koristiti
var asteroids=[]
var startTime
var bestTime
var time2
var musicPlaying=false

/**
 *
 * @param score vrijeme koje će se spremiti
 */
function saveScore(score){
    //spremi u localstorage
    localStorage.setItem("bestTime",score)
}


/**
 * Kad je ekran aplikacije spreman napravi igrača i pozovi pokretanje igre
 */
window.onload = function() {
    window.player=new Ship(can,ctx)
    startGame()

}

/**
 * pokreni igru,
 * funkcija dodaje slušanje pritisaka i otpuštanja tipaka,
 * generira početni broj asteroida,
 * pokreće vrijeme
 *
 */
function startGame() {

    document.addEventListener('keydown', handleArrowKeysDown);
    document.addEventListener('keyup', handleArrowKeysUp);
    bestTime=localStorage.getItem("bestTime")
    startTime=new Date().getTime()

    //generiraj asteroide
    for (let i =0;i<GENERATE_ASTEROIDS;++i){
        let asteroid=new Asteroid(can,ctx)
        asteroid.draw()
        asteroids.push(asteroid)
    }
    GENERATE_ASTEROIDS*=1.1
    moveBackground(player,asteroids)
}

/**
 *funkcija koja kontrolira prikaz ekrana
 */
function moveBackground(){
    let moveOn=true
    var imgHeight = 0;
    var scrollSpeed = 2;
    ctx.fillStyle = '#ffffff';
    ctx.font = '15px Arial';


    /**
     * funkcija koja svaki frame upravlja prikazom na ekranu
     */
    function loop(){
        let time=new Date().getTime();
        let diff=time-startTime
        ctx.shadowBlur = 0;
        ctx.shadowColor = "green";
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        //obriši ekran
        ctx.clearRect(0,0,can.width,can.height)

        //crtaj pozadinu tako da se čini da se kreće igrač
        ctx.drawImage(img, 0,imgHeight,can.width,can.height);
        ctx.drawImage(img, 0, imgHeight - can.height,can.width,can.height);

        //postavke za sjenu
        ctx.shadowBlur = 10;
        ctx.shadowColor = "red";
        ctx.shadowOffsetY = 5;
        ctx.shadowOffsetX = 0;
        player.update()
        ctx.shadowColor = "green";

        //ažuriraj poziciju asteroida i makni ako je izašao iz ekrana
        for(let asteroid of asteroids){
            if(!asteroid.update())
                asteroids.splice(asteroids.indexOf(asteroid),1)
        }
        //izračunaj trenutno vrijeme i prikaži na ekranu
       time2=Math.floor(diff/(1000*60)).toString().padStart(2,'0')+':'+(Math.floor(diff/(1000)%60)).toString().padStart(2,'0') +':'+(diff%1000).toString().padStart(3,'0')
        ctx.fillText('Time: ' +time2 , can.width-160, 40);
        ctx.fillText('Best time: ' + (bestTime!==null ? bestTime : 'None') , can.width-160, 70);

        //provjeri je li došlo do kolizije
        if(checkCollision(asteroids)){
            moveOn=false
            gameEnd()
        }

        imgHeight += scrollSpeed;

        //resetiraj slike pozadine za animaciju
        if (imgHeight === can.height)
            imgHeight = 0;

        //zatraži ponavljanje sljedeći frame
       if(moveOn){
           window.requestAnimationFrame(loop);
       }
    }
    if (moveOn){
        loop()
    }
}

/**
 * funkcija koja se pozove kad je došlo do sudara i prekinuta je igra,
 * zaustavlja glazbu i poziva ažuriranje najboljeg vremena
 */
function gameEnd(){
    backgroundMusic.pause();
    backgroundMusic.currentTime=0

    //ako je trenutno vrijeme novi highscore spremi ga
    if(time2>bestTime || bestTime===null){
        bestTime=time2
        saveScore(time2)
        ctx.clearRect(can.width-160,0,160,100)
        ctx.fillText('Time: ' +time2 , can.width-160, 40);
        ctx.fillText('Best time: ' +bestTime , can.width-160, 70);
    }
    //postavke i ispis kraja igre
    ctx.fillStyle = "#fff"
    ctx.font = "24px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
}

/**
 *
 * @param event događaj pritiska tipke
 * zabilježi da je tipka aktivna,
 * pri pokretanju omogućuje glazbu kada igrač postane aktivan
 */
function handleArrowKeysDown(event) {
    //pokretanje glazbe
    if(!musicPlaying){
        backgroundMusic.play();
        musicPlaying=true
    }
    //zabilježi pritisak strelice
    if (event.key ==="ArrowLeft" ||
        event.key ==="ArrowUp" ||
        event.key ==="ArrowRight" ||
        event.key ==="ArrowDown"
    ){
        event.preventDefault()
        activeButtons.set(event.key,true)
    }

}

/**
 *
 * @param event-događaj otpuštanja tipke
 * upravljaj otpuštanje strelice
 */
function handleArrowKeysUp(event) {
    //zabilježi otpuštanje strelice
    if (event.key ==="ArrowLeft" ||
        event.key ==="ArrowUp" ||
        event.key ==="ArrowRight" ||
        event.key ==="ArrowDown"
    ){
        event.preventDefault()
        activeButtons.set(event.key, false)
    }

}

/**
 *
 * @param x x koordinata točke
 * @param y y koordinata točke
 * @param rect  objekt oblika pravokutnika
 * @returns {boolean}  vraća nalazi li se točka u pravokutniku
 */
function pointInRectangle(x, y, rect) {
    return x >= rect.x+0.05*rect.width && x <= rect.x + 0.95*rect.width &&
        y >= rect.y+0.05*rect.height && y <= rect.y + 0.95*rect.height
}

/**
 *
 * @param triangle  trokut svemirskog broda igrača
 * @param rect  objekt oblika pravokutnika
 * @returns {boolean}  vraća presjeca li igrač objekt rect
 */
function playerIntersectsRectangle(triangle, rect) {
    //za svaku točku trokuta igrača
    for (let key in triangle) {
        let point=triangle[key]
        if (pointInRectangle(point.x, point.y, rect)) {
            return true
        }
    }
    return false;
}

/**
 *
 * @returns {boolean}  vraća je li došlo do kolizije igrača i bilokojeg objekta asteroida
 */
function checkCollision() {
    //za svaki asteroid provjeri sjeku li se on i igrač
    for(let asteroid of asteroids){
        if(playerIntersectsRectangle(player.Triangle, asteroid)){
            return true
        }
    }
    return false

}



//postavljanje intervala koji će otežavat igru
// povećava broj asteroida ili njihovu brzinu
window.setInterval(()=>{
    for(let i=0;i<GENERATE_ASTEROIDS;++i){
        asteroids.push(new Asteroid(can,ctx))
    }
    if(GENERATE_ASTEROIDS<30){
        GENERATE_ASTEROIDS*=1.1
    }
    else{
        ASTEROID_SPEED_MAX+=0.1
        ASTEROID_SPEED_MIN+=0.1
    }
},10000)


/**
 * klasa za objekt igrača
 */

class Ship{
    /**
     *
     * @param can canvas objekt
     * @param ctx kontekst canvas objekta
     * kreira brod i postavlja njegove dimenzije i sliku
     */
    constructor(can,ctx) {
    this.can = can;
    this.ctx = ctx;
    this.width = 50;
    this.height = 50;
    this.x=can.width/2-this.width/2;
    this.y=can.height/2-this.height/2;
    this.image=new Image()
    this.image.src="spaceship.png"

    }

    /**
     *
     * @returns {{a: {x: (*|number), y: *}, b: {x: *, y: *}, c: {x: *, y: *}}} vraća tri točke za svemirski brod igrača
     * @constructor
     */
    get Triangle(){
        return {
            a:{
                x:this.x,
                y:this.y+this.height*0.95
            },
            b:{
                x:this.x+this.width,
                y:this.y+this.height*0.95
            },
            c:{
                x:this.x+this.width/2,
                y:this.y+this.height*0.05
            }
        }
    }

    /**
     * crtanje igrača na canvasu
     */
    draw(){
        this.ctx.drawImage(this.image,this.x,this.y , this.width, this.height)
    }

    /**
     * ažuriranje koordinata igrača na temelju aktivnih pritisnutih strelica i postavljene brzine igrača,
     * ako se kreće dijagonalno osigurava se kretanje jednakom brzinom
     */
    update(){
        //dijagonalna brzina, jer nije isto kao kretanje u smjeru jedne osi
        const diagonalSpeed = PLAYER_SPEED / Math.sqrt(2);
        if(activeButtons.get("ArrowLeft") && activeButtons.get("ArrowUp")){
            this.x-=diagonalSpeed
            this.y-=diagonalSpeed
        }
        else if(activeButtons.get("ArrowLeft") && activeButtons.get("ArrowDown")){
            this.x-=diagonalSpeed
            this.y+=diagonalSpeed
        }
        else if(activeButtons.get("ArrowRight") && activeButtons.get("ArrowUp")){
            this.x+=diagonalSpeed
            this.y-=diagonalSpeed
        }
        else if(activeButtons.get("ArrowRight") && activeButtons.get("ArrowDown")){
            this.x+=diagonalSpeed
            this.y+=diagonalSpeed
        }
        else if(activeButtons.get("ArrowLeft")){
            this.x-=PLAYER_SPEED
        }
        else if(activeButtons.get("ArrowUp")){
            this.y-=PLAYER_SPEED
        }
        else if(activeButtons.get("ArrowRight")){
            this.x+=PLAYER_SPEED
        }
        else if(activeButtons.get("ArrowDown")){
            this.y+=PLAYER_SPEED
        }

        if(this.x+0.2*this.width<0){
            this.x=can.width-this.width-1
        }
        else if(this.x+this.width-0.2*this.width>can.width){
            this.x=1
        }
        else if(this.y+0.2*this.height<0){
            this.y=can.height-this.height-1
        }
        else if(this.y+this.height-0.2*this.height>can.height){
            this.y=1
        }
        //kada ažuriramo koordinate ponovno nacrtamo
        this.draw()
    }
}

/**
 * klasa za asteroid
 */
class Asteroid{

    /**
     * konstruktor za asteroid
     * postavljanje brzine, sjene, smjera, položaja
     * @param can canvas objekt
     * @param ctx kontekst canvas objekta
     */
    constructor(can,ctx) {
        this.can = can;
        this.ctx = ctx;
        this.width = Math.floor(Math.random()*(75-30+1))+30
        this.height = Math.floor(Math.random()*(75-30+1))+30
        this.image=new Image()
        this.image.src="asteroid.png"
        this.speed=(Math.floor(Math.random()*(ASTEROID_SPEED_MAX-ASTEROID_SPEED_MIN+1))+ASTEROID_SPEED_MIN)
       //generiraj položaj i brzinu i vektor kretanja
        this.create()
        if(this.movement.x<0){
            this.shadowOffsetX = 5;
        }
        else if(this.movement.x===0){
            this.shadowOffsetX=0
        }
        else{
            this.shadowOffsetX = -5;
        }
        if(this.movement.y<0){
            this.shadowOffsetY = 5;
        }
        else if(this.movement.y===0){
            this.shadowOffsetY=0
        }
        else{
            this.shadowOffsetY = -5;
        }
    }

    /**
     * slučajno generiranje položaja asteroida
     * slučajno generiranje vektora kretanja asteroida
     */
    create(){
        let deciderPosition=Math.floor(Math.random()*4)
        //console.log(deciderPosition)
        switch (deciderPosition){
            case 0:
            {
                this.x=0-this.width
                this.y=Math.round(Math.random()*can.height)+1
                let i=Math.abs(Math.random()-0.5)
                let j=(Math.random()-this.y/can.height)
                this.movement={
                    x:i/(Math.sqrt(Math.pow(i,2) + Math.pow(j,2))),
                    y:j/(Math.sqrt(Math.pow(i,2) + Math.pow(j,2)))
                }
                break
            }
            case 1:
            {
                this.x=Math.round(Math.random()*can.width)+1
                this.y=0-this.height
                let i=(Math.random()-this.x/can.width)
                let j=Math.abs(Math.random()-0.5)
                this.movement={
                    x:i/(Math.sqrt(Math.pow(i,2) + Math.pow(j,2))),
                    y:j/(Math.sqrt(Math.pow(i,2) + Math.pow(j,2)))
                }
                break
            }
            case 2:
            {
                this.x=can.width
                this.y=Math.round(Math.random()*can.height)+1
                let i=Math.abs(Math.random()-0.5)*-1
                let j=(Math.random()-this.y/can.height)
                this.movement={
                    x:i/(Math.sqrt(Math.pow(i,2) + Math.pow(j,2))),
                    y:j/(Math.sqrt(Math.pow(i,2) + Math.pow(j,2)))
                }
                break
            }
            case 3:
            {
                this.x=Math.round(Math.random()*can.width)+1
                this.y=can.height
                let i=(Math.random()-this.x/can.width)
                let j=Math.abs(Math.random()-0.5)*-1
                this.movement={
                    x:i/(Math.sqrt(Math.pow(i,2) + Math.pow(j,2))),
                    y:j/(Math.sqrt(Math.pow(i,2) + Math.pow(j,2)))
                }
                break
            }
        }
    }

    /**
     * funkcija koja crta asteroid
     */
    draw(){
        this.ctx.drawImage(this.image,this.x,this.y, this.width, this.height)
    }

    /**
     * ažuriraj koordinate asteroida na temelju njegovog vektora kretanja i brzine,
     * postavlja postavke za crtanje sjene
     * @returns {boolean} vraća nalazi li se asteroid unutar ekrana
     */
    update() {
        this.ctx.shadowOffsetX=this.shadowOffsetX
        this.ctx.shadowOffsetY=this.shadowOffsetY
        this.x += this.movement.x*this.speed
        this.y += this.movement.y*this.speed
        if((this.x+this.width<0 && this.movement.x<0) ||
            (this.x>can.width && this.movement.x>0) ||
            (this.y+this.height<0 && this.movement.y<0) ||
            (this.y>can.height && this.movement.y>0)){
            return false
        }
        //nakon ažuriranja koordinata nacrtaj asteroid
        this.draw()
        return true
    }
}
