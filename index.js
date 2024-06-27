const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
const scoreEl = document.querySelectorAll('.scoreEl');
const newGameUI = document.querySelector('#start');
const gameOverUI = document.querySelector('#game_over');
const buttonRestart = document.querySelector('#restartBtn');
const buttonStart = document.querySelector('#startBtn');
const volumeUpEl = document.querySelector('#volumeUpEl');
const volumeOffEl = document.querySelector('#volumeOffEl');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player;
let projectiles = [];
let enemies = [];
let particles = [];
let animationId;
let intervalId;
let spawnPowerUpsId;
let score = 0;
let powerUps = [];
let frames = 0;
let bacgroundParticles = [];
let game = {
    active: false
}

function init() {
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    player = new Player(x, y, 10, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
    animationId;
    score = 0;
    scoreEl.forEach(item => item.innerHTML = score);
    powerUps = [];
    frames = 0;
    bacgroundParticles = [];
    game.active = true;

    const spacing = 30;

    for (let x = 0; x < canvas.width + spacing; x += spacing) {
        for (let y = 0; y < canvas.height + spacing; y += spacing) {
            bacgroundParticles.push(
                new BackgroundParticle({
                    position: {
                        x,
                        y
                    },
                    radius: 3
                })
            );
        }
    }
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

function spawnPowerUps() {
    spawnPowerUpsId = setInterval(() => {
        powerUps.push(new PowerUp({
            position: {
                x: -30,
                y: Math.random() * (canvas.height - 100) + 50
            },
            velocity: {
                x: Math.random() + 2,
                y: 0
            }
        }));
    }, 10000);
}

function createScoreLabel({ position, score }) {
    const scoreLabel = document.createElement('label');
    scoreLabel.innerHTML = score;
    scoreLabel.style.color = 'white';
    scoreLabel.style.position = 'absolute';
    scoreLabel.style.left = position.x + 'px';
    scoreLabel.style.top = position.y + 'px';
    scoreLabel.style.userSelect = 'none';
    scoreLabel.style.pointerEvents = 'none';
    document.body.appendChild(scoreLabel);
    gsap.to(scoreLabel, {
        opacity: 0,
        y: -30,
        duration: 0.75,
        onComplete: () => {
            scoreLabel.parentNode.removeChild(scoreLabel);
        }
    });
}

function animate() {
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0, 0, 0, 0.1)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    frames++;

    bacgroundParticles.forEach(bacgroundParticle => {
        bacgroundParticle.draw();

        const dist = Math.hypot(
            player.x - bacgroundParticle.position.x, 
            player.y - bacgroundParticle.position.y
        );
        if (dist < 100) {
            bacgroundParticle.alpha = 0;
            if (dist > 70) {
                bacgroundParticle.alpha = 0.5;
            }
        } else if (dist > 100 && bacgroundParticle.alpha < 0.1) {
            bacgroundParticle.alpha += 0.1;
        } else if (dist > 100 && bacgroundParticle.alpha > 0.1) {
            bacgroundParticle -= 0.1;
        }
    })

    player.update();

    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        if (powerUp.position.x > canvas.width) {
            powerUps.splice(i, 1);
        } else {
            powerUp.update();
        }

        const dist = Math.hypot(
            player.x - powerUp.position.x, 
            player.y - powerUp.position.y
        );

        // gain power up
        if (dist < powerUp.image.height / 2 + player.radius) {
            powerUps.splice(i, 1);
            player.powerUp = 'MachineGun';
            player.color = 'yellow';
            audio.powerUpNoise.play();

            //power up runs out
            setTimeout(() => {
                player.powerUp = null;
                player.color = 'white';
            }, 5000);
        }
    }

    // machine gun animation / implementation
    if (player.powerUp === 'MachineGun') {
        const angle = Math.atan2(
            (mouse.position.y - player.y), 
            (mouse.position.x - player.x));
        const velocity = {
            x: Math.cos(angle) * 4,
            y: Math.sin(angle) * 4
        }        

        if (frames % 3 === 0) {
            projectiles.push(new Projectile(player.x, player.y, 5, 'yellow', velocity));
        }
        if (frames % 5 === 0) {
            audio.shoot.play();
        }
    }

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
            audio.death.play();
            game.active = false;
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
                    audio.damageTaken.play();
                    scoreEl.forEach(item => item.innerHTML = score);
                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    });
                    createScoreLabel({
                        position: {
                            x: projectile.x,
                            y: projectile.y
                        },
                        score: 100
                    });
                    projectiles.splice(projectileIndex, 1);                   
                } else {
                    // remove enemy
                    score += 150;
                    scoreEl.forEach(item => item.innerHTML = score);
                    createScoreLabel({
                        position: {
                            x: projectile.x,
                            y: projectile.y
                        },
                        score: 150
                    });
                    // change background particle color
                    bacgroundParticles.forEach(bacgroundParticle => {
                        gsap.set(bacgroundParticle, {
                            color: 'white',
                            alpha: 1
                        });
                        gsap.to(bacgroundParticle, {
                            color: enemy.color,
                            alpha: 0.1
                        })
                    });

                    // remove enemy and projectile
                    audio.explode.play();
                    enemies.splice(index, 1);
                    projectiles.splice(projectileIndex, 1);
                }
            }
        }
    }
}

let audioInitialized = false;

function shoot({x, y}) {
    if (game.active === true) {
        const angle = Math.atan2(
            (y - player.y), 
            (x - player.x));
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
        audio.shoot.play();
    }    
}

window.addEventListener('click', (event) => {
    if (!audio.background.playing() && !audioInitialized) {
        audio.background.play();
        audioInitialized = true;
        volumeUpEl.style.display = 'block';
        volumeOffEl.style.display = 'none';
    }

    shoot({x: event.clientX, y: event.clientY});
});

window.addEventListener('touchstart', (event) => {
    const x = event.touches[0].clientX;
    const y = event.touches[0].clientY;

    mouse.position.x = event.touches[0].clientX;
    mouse.position.y = event.touches[0].clientY;

    shoot({ x, y });
});

const mouse = {
    position: {
        x: 0,
        y: 0
    }
};

addEventListener('mousemove', (event) => {
    mouse.position.x = event.clientX;
    mouse.position.y = event.clientY;
});

window.addEventListener('touchmove', (event) => {
    mouse.position.x = event.touches[0].clientX;
    mouse.position.y = event.touches[0].clientY;
});

// restart game
buttonRestart.addEventListener('click', () => {
    init();
    animate();
    spawnEnemies();
    spawnPowerUps();
    gsap.to('#game_over', {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: 'expo.in',
        onComplete: () => {
            gameOverUI.style.display = 'none';
        }
    });
    audio.select.play();
});
buttonStart.addEventListener('click', () => {
    init();
    animate();
    spawnEnemies();
    spawnPowerUps();
    gsap.to('#start', {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: 'expo.in',
        onComplete: () => {
            newGameUI.style.display = 'none';
        }
    });
    audio.select.play();
});

// mute everything
volumeUpEl.addEventListener('click', () => {
    audio.background.pause();
    volumeOffEl.style.display = 'block';
    volumeUpEl.style.display = 'none';

    for (let key in audio) {
        audio[key].mute(true);
    }
});

// unmute everything
volumeOffEl.addEventListener('click', () => {
    if (audioInitialized) audio.background.play();
    volumeUpEl.style.display = 'block';
    volumeOffEl.style.display = 'none';   

    for (let key in audio) {
        audio[key].mute(false);
    }
});

window.addEventListener('resize', () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    init();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(intervalId);
        clearInterval(spawnPowerUpsId);
    } else {
        spawnEnemies();
        spawnPowerUps();
    }
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