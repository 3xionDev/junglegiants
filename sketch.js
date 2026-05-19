let bgImg;
let state = "MENU";
let multiplayer = false;
let debugMode = false;

let players = [];
let branches = [];
let obstacles = [];

let camX = 0;
let camY = 0;
let zoom = 1.0;

let deathWallX = 0;
let scrollSpeed = 5.0;
let speedIncrement = 0.002;

let waterLevel = 700;
let highScore = 0;

function preload() {
  // Replace this with your real image if you have one:
  // bgImg = loadImage("your_image_filename.png");

  bgImg = createImage(1696, 927);
}

function setup() {
  createCanvas(1000, 700);
  resetGame();
}

function draw() {
  background(135, 206, 235);
  drawParallax();

  if (state === "MENU") {
    drawMenu();
  } else if (state === "PLAYING") {
    playGame();
  } else if (state === "GAMEOVER") {
    drawGameOver();
  }
}

function drawParallax() {
  let parallaxX = (camX * 0.2) % bgImg.width;
  image(bgImg, -parallaxX, 0, bgImg.width, height);
  image(bgImg, -parallaxX + bgImg.width, 0, bgImg.width, height);
}

function resetGame() {
  players = [];
  branches = [];
  obstacles = [];

  scrollSpeed = 5.0;
  deathWallX = 0;
  camX = 0;
  camY = 0;
  zoom = 1.0;
  waterLevel = height - 50;

  players.push(new Monkey(250, height / 2, color(150, 75, 0), 87)); // W key

  if (multiplayer) {
    players.push(new Monkey(250, height / 2 + 50, color(255, 165, 0), UP_ARROW));
  }

  for (let i = 0; i < 40; i++) {
    generateWorld(500 + i * 110);
  }
}

function generateWorld(x) {
  let verticalTiers = floor(random(2, 5));

  for (let i = 0; i < verticalTiers; i++) {
    let branchY = random(-1200, 350);
    branches.push(createVector(x, branchY));

    if (random() > 0.85) {
      obstacles.push({
        pos: createVector(x + 30, branchY + 80),
        w: 35,
        h: 70
      });
    }
  }
}

function playGame() {
  deathWallX += scrollSpeed;
  scrollSpeed += speedIncrement;

  if (frameCount % 60 === 0) {
    branches = branches.filter(b => b.x > deathWallX - 500);
    obstacles = obstacles.filter(o => o.pos.x > deathWallX - 500);
  }

  let avgX = 0;
  let avgY = 0;
  let active = 0;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  players.forEach(p => {
    if (!p.dead) {
      avgX += p.pos.x;
      avgY += p.pos.y;
      active++;

      minX = min(minX, p.pos.x);
      maxX = max(maxX, p.pos.x);
      minY = min(minY, p.pos.y);
      maxY = max(maxY, p.pos.y);
    }
  });

  if (active > 0) {
    let spread = max(maxX - minX, maxY - minY, 200);
    let targetZoom = constrain(800 / (800 + spread * 0.5), 0.65, 1.0);

    zoom = lerp(zoom, targetZoom, 0.05);
    camX = lerp(camX, avgX / active, 0.1);
    camY = lerp(camY, avgY / active, 0.1);
  }

  push();
  translate(width / 2, height / 2);
  scale(zoom);
  translate(-camX, -camY);

  drawWorldLayers();

  players.forEach(p => {
    p.update();
    p.show();
  });

  pop();

  drawUI();

  if (players.every(p => p.dead)) {
    let bestDistance = max(players.map(p => p.pos.x));
    highScore = max(highScore, floor(bestDistance / 10));
    state = "GAMEOVER";
  }
}

function drawWorldLayers() {
  // Death wall
  noStroke();
  fill(200, 0, 0, 70);
  rect(deathWallX - 2000, camY - 2000, 2000, 4000);

  fill(255, 0, 0, 150);
  rect(deathWallX, camY - 2000, 20, 4000);

  // Branches
  stroke(90, 50, 20);
  strokeWeight(8 / zoom);

  for (let b of branches) {
    line(b.x - 45, b.y, b.x + 45, b.y);
    fill(40, 160, 50);
    noStroke();
    ellipse(b.x - 35, b.y - 10, 35, 20);
    ellipse(b.x + 35, b.y - 10, 35, 20);

    stroke(90, 50, 20);
    strokeWeight(8 / zoom);
  }

  // Obstacles
  noStroke();
  fill(120, 60, 20);

  for (let o of obstacles) {
    rect(o.pos.x, o.pos.y, o.w, o.h, 8);
  }

  // Water / floor danger
  fill(0, 100, 255, 130);
  rect(camX - width, waterLevel, width * 3, 1000);
}

function drawUI() {
  fill(0);
  noStroke();
  textSize(22);
  textAlign(LEFT, TOP);

  let score = floor(max(players.map(p => p.pos.x)) / 10);

  text("Score: " + score, 20, 20);
  text("High Score: " + highScore, 20, 50);
  text("Speed: " + scrollSpeed.toFixed(1), 20, 80);

  if (multiplayer) {
    text("P1: W    P2: UP ARROW", 20, 110);
  } else {
    text("Hold W to swing. Release to launch.", 20, 110);
  }
}

function drawMenu() {
  fill(0, 120);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);

  textSize(60);
  text("Monkey Swing", width / 2, height / 2 - 120);

  textSize(28);
  text("Press 1 for Single Player", width / 2, height / 2 - 20);
  text("Press 2 for Multiplayer", width / 2, height / 2 + 25);

  textSize(20);
  text("Hold W to grab branches. Release to launch.", width / 2, height / 2 + 100);
}

function drawGameOver() {
  fill(0, 150);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);

  textSize(60);
  text("Game Over", width / 2, height / 2 - 100);

  textSize(28);
  text("High Score: " + highScore, width / 2, height / 2 - 30);
  text("Press R to Restart", width / 2, height / 2 + 30);
  text("Press M for Menu", width / 2, height / 2 + 75);
}

function keyPressed() {
  if (state === "MENU") {
    if (key === "1") {
      multiplayer = false;
      resetGame();
      state = "PLAYING";
    }

    if (key === "2") {
      multiplayer = true;
      resetGame();
      state = "PLAYING";
    }
  }

  if (state === "GAMEOVER") {
    if (key === "r" || key === "R") {
      resetGame();
      state = "PLAYING";
    }

    if (key === "m" || key === "M") {
      state = "MENU";
    }
  }
}

class Monkey {
  constructor(x, y, col, kCode) {
    this.pos = createVector(x, y);
    this.vel = createVector(scrollSpeed + 3, 0);

    this.col = col;
    this.kCode = kCode;

    this.gravity = 0.45;
    this.climbSpeed = 3.5;

    this.dead = false;

    this.isSwinging = false;
    this.isHooking = false;

    this.anchor = null;
    this.r = 0;
    this.visualR = 0;

    this.angle = 0;
    this.angleVel = 0;
  }

  update() {
    if (this.dead) return;

    if (this.pos.x < deathWallX || this.pos.y > waterLevel) {
      this.dead = true;
      return;
    }

    for (let o of obstacles) {
      if (
        this.pos.x > o.pos.x &&
        this.pos.x < o.pos.x + o.w &&
        this.pos.y > o.pos.y &&
        this.pos.y < o.pos.y + o.h
      ) {
        this.dead = true;
        return;
      }
    }

    if (keyIsDown(this.kCode)) {
      if (!this.isSwinging && !this.isHooking) {
        let bestB = null;
        let minDist = 950;

        for (let b of branches) {
          let d = dist(this.pos.x, this.pos.y, b.x, b.y);

          if (d < minDist && b.x > this.pos.x) {
            minDist = d;
            bestB = b;
          }
        }

        if (bestB) {
          this.isHooking = true;
          this.anchor = bestB;
          this.visualR = 0;
        }
      }

      if (this.isSwinging && this.r > 35) {
        this.r -= this.climbSpeed;
        this.angleVel *= 1.03;
      }
    } else {
      if (this.isSwinging) {
        let launchSpeed = this.angleVel * this.r;
        let boost = map(abs(cos(this.angle)), 0.8, 1.0, 1.0, 1.3, true);

        this.vel.x = launchSpeed * cos(this.angle) * boost;
        this.vel.y = -launchSpeed * sin(this.angle) * boost;

        if (this.vel.x < scrollSpeed + 7) {
          this.vel.x = scrollSpeed + 9;
        }
      }

      this.isSwinging = false;
      this.isHooking = false;
    }

    if (this.isHooking && !this.isSwinging) {
      this.vel.y += this.gravity;
      this.pos.add(this.vel);

      let targetR = dist(this.pos.x, this.pos.y, this.anchor.x, this.anchor.y);
      this.visualR += 140;

      if (this.visualR >= targetR) {
        this.isSwinging = true;
        this.isHooking = false;

        this.r = targetR;
        this.angle = atan2(this.pos.x - this.anchor.x, this.pos.y - this.anchor.y);

        let speed = this.vel.mag();
        let moveDirection = atan2(-this.vel.y, this.vel.x);

        this.angleVel = (speed / this.r) * cos(moveDirection - this.angle) * 1.15;
      }
    } else if (this.isSwinging) {
      this.angleVel += -1.1 * (this.gravity / this.r) * sin(this.angle);

      if (this.angle < 0 && this.angleVel > 0) {
        this.angleVel += 0.002;
      }

      this.angle += this.angleVel;

      this.pos.x = this.anchor.x + this.r * sin(this.angle);
      this.pos.y = this.anchor.y + this.r * cos(this.angle);
    } else {
      this.vel.y += this.gravity;
      this.pos.add(this.vel);
    }

    if (branches.length > 0 && this.pos.x > branches[branches.length - 1].x - 2000) {
      generateWorld(branches[branches.length - 1].x + 110);
    }
  }

  show() {
    if (this.dead) return;

    if ((this.isSwinging || this.isHooking) && this.anchor) {
      stroke(180, 100, 50);
      strokeWeight(5 / zoom);

      let d = dist(this.pos.x, this.pos.y, this.anchor.x, this.anchor.y);
      let ratio = this.isSwinging ? 1.0 : this.visualR / d;

      line(
        this.pos.x,
        this.pos.y,
        this.pos.x + (this.anchor.x - this.pos.x) * ratio,
        this.pos.y + (this.anchor.y - this.pos.y) * ratio
      );
    }

    noStroke();
    fill(this.col);
    ellipse(this.pos.x, this.pos.y, 45, 40);

    fill(255, 210, 180);
    ellipse(this.pos.x + 14, this.pos.y, 20, 20);
  }
}
