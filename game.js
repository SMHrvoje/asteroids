
var can = document.getElementById('canvas');

var ctx = can.getContext('2d');


can.width = innerWidth-4;
can.height = innerHeight-4;
var ASTEROID_SPEED_MIN=0.8
var ASTEROID_SPEED_MAX=2
var PLAYER_SPEED=5
var GENERATE_ASTEROIDS=10

var img = new Image();
img.src = "wallpaperflare.com_wallpaper.jpg";

const backgroundMusic = document.getElementById('backgroundMusic');

var activeButtons=new Map()
activeButtons.set("ArrowLeft",false)
activeButtons.set("ArrowUp",false)
activeButtons.set("ArrowRight",false)
activeButtons.set("ArrowDown",false)

var asteroids=[]
var startTime
var bestTime
var time2
var musicPlaying=false

function saveScore(score){
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
 * pokreni igru
 * funkcija dodaje slušanje pritisaka i otpuštanja tipaka
 * generira početni broj asteroida
 * pokreće vrijeme
 *
 */
function startGame() {

    document.addEventListener('keydown', handleArrowKeysDown);
    document.addEventListener('keyup', handleArrowKeysUp);
    bestTime=localStorage.getItem("bestTime")
    startTime=new Date().getTime()

    for (let i =0;i<GENERATE_ASTEROIDS;++i){
        let asteroid=new Asteroid(can,ctx)
        asteroid.draw()
        asteroids.push(asteroid)
    }
    GENERATE_ASTEROIDS*=1.1
    moveBackground(player,asteroids)
}

/**
 *
 * @param player
 * @param asteroids
 */
function moveBackground(player,asteroids){
    let moveOn=true
    var imgHeight = 0;
    var scrollSpeed = 2;
    ctx.fillStyle = '#ffffff';
    ctx.font = '15px Arial';



    function loop(){
        let time=new Date().getTime();
        let diff=time-startTime
        ctx.shadowBlur = 0;
        ctx.shadowColor = "green";
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.clearRect(0,0,can.width,can.height)
        // draw image 1
        ctx.drawImage(img, 0,imgHeight,can.width,can.height);
        // draw image 2
        ctx.drawImage(img, 0, imgHeight - can.height,can.width,can.height);

        ctx.shadowBlur = 10;
        ctx.shadowColor = "red";
        ctx.shadowOffsetY = 5;
        ctx.shadowOffsetX = 0;
        player.update()
        ctx.shadowColor = "green";

        for(let asteroid of asteroids){
            if(!asteroid.update())
                asteroids.splice(asteroids.indexOf(asteroid),1)
        }
       time2=Math.floor(diff/(1000*60)).toString().padStart(2,'0')+':'+(Math.floor(diff/(1000)%60)).toString().padStart(2,'0') +':'+(diff%1000).toString().padStart(3,'0')
        ctx.fillText('Time: ' +time2 , can.width-160, 40);
        ctx.fillText('Best time: ' + (bestTime!==null ? bestTime : 'None') , can.width-160, 70);

        if(checkCollision(asteroids)){
            moveOn=false
            gameEnd()
        }
        imgHeight += scrollSpeed;

        if (imgHeight === can.height)
            imgHeight = 0;

       if(moveOn){
           window.requestAnimationFrame(loop);
       }
    }
    if (moveOn){
        loop()
    }
}
function gameEnd(){
    backgroundMusic.pause();
    backgroundMusic.currentTime=0

    if(time2>bestTime || bestTime===null){
        bestTime=time2
        saveScore(time2)
        ctx.clearRect(can.width-160,0,160,100)
        ctx.fillText('Time: ' +time2 , can.width-160, 40);
        ctx.fillText('Best time: ' +bestTime , can.width-160, 70);
    }
    ctx.fillStyle = "#fff"
    ctx.font = "24px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
}
function handleArrowKeysDown(event) {
    if(!musicPlaying){
        backgroundMusic.play();
        musicPlaying=true
    }
    if (event.key ==="ArrowLeft" ||
        event.key ==="ArrowUp" ||
        event.key ==="ArrowRight" ||
        event.key ==="ArrowDown"
    ){
        event.preventDefault()
        activeButtons.set(event.key,true)
    }

}
function handleArrowKeysUp(event) {
    if (event.key ==="ArrowLeft" ||
        event.key ==="ArrowUp" ||
        event.key ==="ArrowRight" ||
        event.key ==="ArrowDown"
    ){
        event.preventDefault()
        activeButtons.set(event.key, false)
    }

}

function pointInRectangle(x, y, rect) {
    return x >= rect.x+0.05*rect.width && x <= rect.x + 0.95*rect.width &&
        y >= rect.y+0.05*rect.height && y <= rect.y + 0.95*rect.height;
}

function triangleIntersectsRectangle(triangle, rect) {
    // Check each point of the triangle
    for (let key in triangle) {
        let point=triangle[key]
        if (pointInRectangle(point.x, point.y, rect)) {
            return true; // Collision detected
        }
    }
    return false; // No collision
}

function checkCollision() {
    let collision = false
    for(let asteroid of asteroids){
        if(triangleIntersectsRectangle(player.Triangle, asteroid)){
            collision=true
            break
        }
    }
    return collision

}

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



class Ship{
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
    draw(){
        this.ctx.drawImage(this.image,this.x,this.y , this.width, this.height)
    }
    update(){
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

        this.draw()
    }
}

class Asteroid{
    constructor(can,ctx) {
        this.can = can;
        this.ctx = ctx;
        this.width = Math.floor(Math.random()*(75-30+1))+30
        this.height = Math.floor(Math.random()*(75-30+1))+30
        this.image=new Image()
        this.image.src="asteroid.png"
        this.speed=(Math.floor(Math.random()*(ASTEROID_SPEED_MAX-ASTEROID_SPEED_MIN+1))+ASTEROID_SPEED_MIN)
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
    draw(){
        this.ctx.drawImage(this.image,this.x,this.y, this.width, this.height)
    }
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
        this.draw()
        return true
    }
}
