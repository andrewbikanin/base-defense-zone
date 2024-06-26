const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
const scoreEl = document.querySelectorAll('.scoreEl');
const newGameUI = document.querySelector('#start');
const gameOverUI = document.querySelector('#game_over');
const buttonRestart = document.querySelector('#restart');
const buttonStart = document.querySelector('#start');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = {
            x: 0,
            y: 0
        }
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill()
    }
    
    update() {
        this.draw();

        const friction = 0.99;

        this.velocity.x *= friction;
        this.velocity.y *= friction;

        if (this.x + this.radius + this.velocity.x <= canvas.width && 
            this.x - this.radius + this.velocity.x >= 0
        ) {
            this.x += this.velocity.x;
        } else {
            this.velocity.x = 0;
        }
        if (this.y + this.radius + this.velocity.y <= canvas.height && 
            this.y - this.radius + this.velocity.y >= 0
        ) {
            this.y += this.velocity.y;
        } else {
            this.velocity.y = 0;
        }
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill()
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }

}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.type = 'Linear';
        this.radians = 0;
        this.center = {
            x,
            y
        }

        if (Math.random() < 0.5) {
            this.type = 'Homing';

            if (Math.random() < 0.5) {
                this.type = 'Spinning';
            }
        }
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill()
    }

    update() {
        this.draw();
        this.radians += 0.1;

        if (this.type == 'Spinning') {
            this.center.x += this.velocity.x;
            this.center.y += this.velocity.y;       
    
            this.x = this.center.x + Math.cos(this.radians) * 30;
            this.y = this.center.y + Math.sin(this.radians) * 30;
        }

        else if (this.type === 'Homing') {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.velocity.x = Math.cos(angle);
            this.velocity.y = Math.sin(angle);

            this.x = this.x + this.velocity.x;
            this.y = this.y + this.velocity.y;
        } else {
            // linear
            this.x = this.x + this.velocity.x;
            this.y = this.y + this.velocity.y;
        }
    }

}

const friction = 0.98;
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill()
        c.restore();
    }

    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= 0.01;
    }

}

const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 10, 'white');

let projectiles = [];
let enemies = [];
let particles = [];
let animationId;
let intervalId;
let score = 0;

function init() {
    player = new Player(x, y, 10, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
    animationId;
    score = 0;
    scoreEl.forEach(item => item.innerHTML = score);
}

function spawnEnemies() {
    intervalId = setInterval(() => {
        const radius = Math.random() * (30 - 8) + 8;

        let x, y;

        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;

        const angle = Math.atan2(
            (canvas.height / 2 - y), 
            (canvas.width / 2 - x));
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }

        enemies.push(new Enemy(x, y, radius, color, velocity));
    }, 1000);
}

function animate() {
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0, 0, 0, 0.1)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.update();
    for (let index = particles.length - 1; index >= 0; index--) {
        const particle = particles[index];    
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    }
    for (let index = projectiles.length - 1; index >= 0; index--) {
        const projectile = projectiles[index];
        projectile.update();

        // remove from edges of screen
        if (projectile.x + projectile.radius < 0 || 
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height
        ) {
            projectiles.splice(index, 1);          
        }
    }

    for (let index = enemies.length - 1; index >= 0; index--) {
        const enemy = enemies[index];
        enemy.update();
        
        // game over
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId);
            clearInterval(intervalId);
            gameOverUI.style.display = 'flex';
            gsap.fromTo('#game_over', {scale: 0.8, opacity: 0}, {scale: 1, opacity: 1, ease: 'expo'});
        }

        for (let projectileIndex = projectiles.length - 1; projectileIndex >= 0; projectileIndex--) {
            const projectile = projectiles[projectileIndex];
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            
            // when projectiles touch enemy
            if (dist - enemy.radius - projectile.radius < 1) {
                // create explosions
                for (let i = 0; i < enemy.radius; i++) {
                    particles.push(new Particle(
                        projectile.x, 
                        projectile.y, 
                        Math.random() * 2, 
                        enemy.color, { 
                        x: (Math.random() - 0.5) * (Math.random() * 6), 
                        y: (Math.random() - 0.5) *  (Math.random() * 6)
                    }));
                }

                // shrink enemy
                if (enemy.radius - 10 > 10) {
                    score += 100;
                    
                    scoreEl.forEach(item => item.innerHTML = score);
                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    });
                    projectiles.splice(projectileIndex, 1);                   
                } else {
                    // remove enemy
                    score += 150;
                    scoreEl.forEach(item => item.innerHTML = score);
                    enemies.splice(index, 1);
                    projectiles.splice(projectileIndex, 1);
                }
            }
        }
    }
}

window.addEventListener('click', (event) => {
    const angle = Math.atan2(
        (event.clientY - player.y), 
        (event.clientX - player.x));
    const velocity = {
        x: Math.cos(angle) * 4,
        y: Math.sin(angle) * 4
    }
    projectiles.push(new Projectile(
        player.x,
        player.y,
        5,
        'white',
        velocity
    ));
});

// restart game
buttonRestart.addEventListener('click', () => {
    init();
    animate();
    spawnEnemies();
    gsap.to('#game_over', {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: 'expo.in',
        onComplete: () => {
            gameOverUI.style.display = 'none';
        }
    });
});
buttonStart.addEventListener('click', () => {
    init();
    animate();
    spawnEnemies();
    gsap.to('#start', {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: 'expo.in',
        onComplete: () => {
            newGameUI.style.display = 'none';
        }
    });
});

window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'd':
            player.velocity.x += 1;
            break;
        case 'a':
            player.velocity.x -= 1;
            break; 
        case 'w':
            player.velocity.y -= 1;
            break;  
        case 's':
            player.velocity.y += 1;
            break;                                    
    }
}); 