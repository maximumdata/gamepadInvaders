var scoreEl = document.getElementById('score'),
    livesEl = document.getElementById('lives'),
    gameOverEl = document.getElementById('gameOver'),
    canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    width = window.innerWidth,
    height = window.innerHeight,
    player = {
      score: 0,
      lives: 5,
      speed: 5,
      rateOfFire: 250,
      lastFired: null,
      color: '#' + Math.random().toString(16).slice(2, 8),
      h: 20,
      w: 20,
      x: 0,
      y: height - 70,
      fire : function() {
        var shot = new Bullet(player.x);
      }
    },
    Bullet = function(x) {
      this.h = 10;
      this.w = 5;
      this.x = x + (player.w / 2);
      this.y = height - 75;
      shots.push(this);
    },
    Enemy = function() {
      this.r = Math.floor(Math.random() * 10 ) + 30;
      this.y = 0;
      this.color = '#' + Math.random().toString(16).slice(2, 8); // thanks jennifer dewalt!
      var randomStartingX = Math.floor(Math.random() * width - this.r);
      if(randomStartingX < 0) { randomStartingX = 0; }
      this.x = randomStartingX;
      this.speed = Math.random() + 1;
      if(this.speed > 1.5) {
        this.speed = 1.5;
      }
      enemies.push(this);
    },
    shots = [],
    enemies = [],
    playingGame,
    gameOver = false,
    started = false,
    intervalForGamepadPolling;

document.addEventListener('DOMContentLoaded', function(e) {
  canvas.width = width;
  canvas.height = height;
});

// game functions
function gameLoop() {
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
  if (!gamepads) {
    return;
  }
  var gamepad = gamepads[0];
  if(!started && !gameOver) {
    if(buttonPressed(gamepad.buttons[9])) {
      startGame();
    }
    playingGame = requestAnimationFrame(gameLoop);
  }
  if(!gameOver && started) {
    drawFrame(gamepad);
    playingGame = requestAnimationFrame(gameLoop);
  }
}

function drawPlayer(gamepad) {
  // figure out left stick position and modify player's x position based on it
  var leftStickX = gamepad.axes[0];
  if(leftStickX > 0.25) {
    player.x += player.speed;
    if(player.x >= width - player.w) {
      player.x = width - player.w; // prevent drawing player offscreen by creating a boundary equal to the player width on the right edge of the screen
    }
  } else if(leftStickX < -0.25) {
    player.x -= player.speed;
    if(player.x < 0) { player.x = 0; } // prevent drawing player offscreen to the left
  }

  if(buttonPressed(gamepad.buttons[0]) || buttonPressed(gamepad.buttons[7])) {
    if((Date.now() - player.lastFired > player.rateOfFire) || player.lastFired === null) {
      new Bullet(player.x);
      player.lastFired = Date.now();
    }
  }
  context.fillStyle = player.color;
  context.fillRect(player.x, player.y, player.w, player.h);
}

function drawShots() {
  context.fillStyle = "#FF0000";
  shots.forEach(function(shot, index) {
    context.fillRect(shot.x, shot.y, shot.w, shot.h);
    shot.y -= (shot.h / 2);
    enemies.forEach(function(enemy, indexEnemy) {
      if(shot.x < enemy.x + enemy.r && shot.x > enemy.x - enemy.r) { //if shot is horizontally between enemy's x center plus it's radius (center to right edge) or it's x center minus radius (center to left edge)
        if(shot.y <= enemy.y + enemy.r) { //if above is true and shot is vertically touching edge of enemy
          player.score++; // bump score
          shots.splice(index, 1); //remove this shot
          enemies.splice(indexEnemy, 1); //remove hit enemy
          new Enemy(); // create a new enemy
        }
      }
    });
    if(shot.y <= 0) {
      shots.splice(index, 1); // remove if it's at the top of the screen
    }
  });
}

function drawEnemies() {
  enemies.forEach(function(enemy, index) {
    context.beginPath();
    context.arc(enemy.x, enemy.y, enemy.r, 0, 2 * Math.PI);
    context.fillStyle = enemy.color;
    context.fill();
    context.lineWidth = 1;
    context.strokeStyle = '#000000';
    context.stroke();
    enemy.y += enemy.speed;
    if(enemy.y > player.y) {
      enemies.splice(index, 1);
      player.lives--;
      new Enemy();
      if(player.lives === 0) {
        doGameOver();
      }
    }
  });
}

function updateInfo() {
  scoreEl.innerText = 'Score: ' + player.score;
  livesEl.innerText = 'Lives: ' + player.lives;
}

function drawFrame(gamepad) {
  context.clearRect(0,0,width,height);
  drawPlayer(gamepad);
  drawShots();
  drawEnemies();
  updateInfo();
}

function doGameOver() {
  playingGame = cancelAnimationFrame(playingGame);
  gameOver = true;
  console.log('game over');
  gameOverEl.innerText = 'Game over!\nYour score was ' + player.score +'!\nRefresh this page to play again!';
  gameOverEl.style.display = 'flex';
}

function startGame() {
  var startOverlay = document.getElementById('start');
  start.style.display = 'none';
  var x = 3;
  while(x) {
    new Enemy();
    x--;
  }
  started = true;
}

// gamepad connection logic. first two work for firefox/ie. after that is a fallback for chrome.
window.addEventListener('gamepadconnected', function(e) {

  gameLoop();
});

window.addEventListener('gamepaddisconnected', function(e) {
  cancelAnimationFrame(playingGame);
});

if (!('ongamepadconnected' in window)) {
  // No gamepad events available, poll instead.
  intervalForGamepadPolling = setInterval(pollGamepads, 500);
}

function pollGamepads() {
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
  for (var i = 0; i < gamepads.length; i++) {
    var gp = gamepads[i];
    if (gp) {
      console.log("Gamepad connected at index " + gp.index + ": " + gp.id + ". It has " + gp.buttons.length + " buttons and " + gp.axes.length + " axes.");
      gameLoop();
      clearInterval(intervalForGamepadPolling);
    }
  }
}

// helper for button presses
function buttonPressed(b) {
  if (typeof(b) == "object") {
    return b.pressed;
  }
  return b == 1.0;
}
