let canvas = document.getElementById("canvas");
const gui = new dat.GUI();
const Score = document.querySelector("#score");
const StartGameBTN = document.querySelector("#StartGameBTN");
const UI = document.querySelector("#UI");
canvas.style.backgroundColor = "rgba(0,0,0,1)";

canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

let bgMusic = new Audio('./bg.mp3');
bgMusic.play();

var c = canvas.getContext("2d");

const properties = {
    EnemyVelocity : 0.5,
    BulletVelocity : 4,
    EnemyDelay : 1
}
const modes = gui.addFolder("Modes");
modes.add(properties,"EnemyVelocity",0.2,2)
modes.add(properties,"BulletVelocity",2,8)
modes.add(properties,"EnemyDelay",0,3)


// --------------------- UTILITY FUNCTIONS --------------------------------------------------

function randomInt(min,max){
    return Math.floor((Math.random() * (max-min+1)) + min); 
}
const colorArray = ["#363432","#196774","#90A19D","#F0941F","#EF6024"];
function randomColor(colorArray){
    var x = Math.floor(Math.random()*colorArray.length);
    return colorArray[x];
};
window.addEventListener('resize',function(){
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
})
function getDistance(x1,y1,x2,y2){
    var xDistance = x2-x1;
    var yDistance = y2-y1;
    return Math.sqrt(Math.pow(xDistance,2)+Math.pow(yDistance,2));
}
var mouse = {
    x:innerWidth/2,
    y:innerHeight/2
}
window.addEventListener('mousemove',function(event){
    mouse.x = event.x;
    mouse.y = event.y;
})

// ---------------SHOOTER---------------------------------------------------------------------

function Shooter(x,y,radii){
    this.x = x;
    this.y = y;
    this.radius = radii;
    this.color = "red";
    this.draw = function(){
        c.beginPath();
        c.arc(this.x,this.y,this.radius,0,Math.PI*2);
        c.fillStyle = this.color;
        c.fill();
    }
}

const shooter = new Shooter(innerWidth/2,innerHeight/2,20);

//-------------BULLET-----------------------------------------------------------------------

function Bullet(x,y,radii,dx,dy){
    this.x = x;
    this.y = y;
    this.radius = radii;
    this.color = "white";
    this.velocity = {
        x : dx,
        y : dy
    }
    this.draw = function(){
        c.beginPath();
        c.arc(this.x,this.y,this.radius,0,Math.PI*2);
        c.fillStyle = this.color;
        c.fill();
    }
    this.update = function(){
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.draw();
    }
}
//-------------------PARTICLE----------------------------------------------------------

let friction = 0.5;
var particles = [];
function Particle(x,y,radii,color,dx,dy){
    this.x = x;
    this.y = y;
    this.radius = radii;
    this.color = color;
    this.alpha = 1;
    var angle = Math.atan2((innerHeight/2-this.y),(innerWidth/2-this.x));
    this.velocity = {
        x : dx,
        y : dy
    }
    this.draw = function(){
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x,this.y,this.radius,0,Math.PI*2);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }
    this.update = function(){
        this.x += this.velocity.x*friction;
        this.y += this.velocity.y*friction;
        this.draw();
        this.alpha -= 0.005;
    }
}

//-------------------ENEMY--------------------------------------------------------------

function Enemy(x,y,radii,dx,dy){
    this.x = x;
    this.y = y;
    this.radius = radii;
    this.color = `hsl(${Math.random()*360},50%,50%)`;
    var angle = Math.atan2((innerHeight/2-this.y),(innerWidth/2-this.x));
    this.velocity = {
        x : Math.cos(angle)*properties.EnemyVelocity,
        y : Math.sin(angle)*properties.EnemyVelocity
    }
    this.draw = function(){
        c.beginPath();
        c.arc(this.x,this.y,this.radius,0,Math.PI*2);
        c.fillStyle = this.color;
        c.fill();
    }
    this.update = function(){
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.draw();
    }
}
var Enemies = [];
function spawnEnemies(){
    setInterval(()=>{
        let EnemyX;
        let EnemyY;
        let radii = Math.random() * (30-5) + 10;
        if(Math.random() < 0.5){
            EnemyY = Math.random()*innerHeight;
            EnemyX = Math.random() < 0.5 ? 0 - radii : innerWidth + radii;
        }else{
            EnemyX = Math.random() * innerWidth;
            EnemyY = Math.random() < 0.5 ? 0 - radii : innerHeight + radii;
        }
        Enemies.push(new Enemy(EnemyX,EnemyY,radii,1,1));
    },properties.EnemyDelay*1000)
}
//--------------------------------------------------------------------------------------

let score = 0;
var Bullets = [];
$(window).on("click",(event)=>{
    if(UI.style.display == "none"){
        var angle = Math.atan2((event.clientY-innerHeight/2),(event.clientX-innerWidth/2));
        var xVel = properties.BulletVelocity*Math.cos(angle);
        var yVel = properties.BulletVelocity*Math.sin(angle);
        Bullets.push(new Bullet(innerWidth/2,innerHeight/2,5,xVel,yVel));
        async function play(){
            const Bullet = await new Audio('./Bullet.mp3');
            Bullet.play();   
        }
        play();
    }
})
let animationId;
function animate(){
    animationId = requestAnimationFrame(animate);
    c.fillStyle=`rgba(0,0,0,0.07)`;
    c.fillRect(0,0,innerWidth,innerHeight);
    shooter.draw();
    particles.forEach((Particle,ParticleIndex)=>{
        Particle.update();
        if(Particle.alpha < 0){
            particles.splice(ParticleIndex,1);
        }
    })
    Enemies.forEach((Enemy,EnemyIndex)=>{
        Enemy.update();
        if(getDistance(shooter.x,shooter.y,Enemy.x,Enemy.y)-shooter.radius-Enemy.radius <= 0){
            cancelAnimationFrame(animationId);
            $("#UIscore").html(score);
            UI.style.display = "flex";
        }
        Bullets.forEach((Bullet,BulletIndex)=>{
            if((getDistance(Enemy.x,Enemy.y,Bullet.x,Bullet.y)-Bullet.radius-Enemy.radius) < 0){

                if(Enemy.radius > 20){
                    score += 10;
                    gsap.to(Enemy,{
                        radius : Enemy.radius-10
                    })
                    setTimeout(() => {
                        Bullets.splice(BulletIndex,1);
                    }, 0);
                }else{
                    score += 25;
                    const Explosion = new Audio('./Explosion.mp3');
                    Explosion.play();

                    setTimeout(()=>{
                        Bullets.splice(BulletIndex,1);
                        Enemies.splice(EnemyIndex,1);
                    },0)
                }

                Score.innerHTML = score;

                for(let i=0;i<Enemy.radius;i++){
                    particles.push(new Particle(Enemy.x,Enemy.y,Math.random()*3,Enemy.color,(Math.random()-0.5)*8,(Math.random()-0.5)*8));
                }
            }
        })
    })
    Bullets.forEach((Bullet,BulletIndex)=>{
        Bullet.update();
        if(Bullet.x-Bullet.radius < 0 || Bullet.y-Bullet.radius < 0 || Bullet.x+Bullet.radius > innerWidth || Bullet.y+Bullet.radius > innerHeight){
            setTimeout(() => {
               Bullets.splice(BulletIndex,1); 
            }, 0);
        }
    })
}

function reInitialize(){
    Score.innerHTML = 0;
    score = 0;
    particles = [];
    Enemies = [];
    Bullets = [];
}
StartGameBTN.addEventListener("click",()=>{
    reInitialize();
    animate();
    spawnEnemies();
    UI.style.display = "none";
})