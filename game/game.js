/* Global constants */
var NUM_ALIENS=20; // How many aliens we start with
var NUM_REMAINS=5; // How many dead aliens stay on the screen

var NUM_BULLETS=100; // Our ammo limit

var BULLET_SPEED = 12; // Bullet speed  (should probably be faster than player move speed)
var BULLET_DELAY = 0.05; // Our gun's reality check

var PLAYER_MOVE_SPEED=10; // How fast player can move

var PROGRESS_INTERVAL = 1; // How many seconds before game speeds up
var GAMESPEED_INCREMENT = 1.0005; // How much game speeds up every progress interval

var RESPAWN_PROBABILITY = 0.8; // 

/* Global varibales */
var desert; // Scene

var aliens; // Alien Sprite
var deadBuffer; // dead alien buffer
var waitBuffer; // waiting to respawn buffer

var goodMan; // Good man Sprite
var bullets; // Bullet Sprites array

var timer; // Game timer
var bullet_delay_timer; // Bullet delay timer

var gameSpeed = 2; // Starting speed of aliens
var current_bullet=0; // Bullet iterator

var aliens_slaughtered; // Count of slaughtered aliens
var bullets_fired; // Useful for ratio (kills/shots_fired)

// Game sounds
var owWav;
var owOgg;
var owMP3;
var shootArrowWav;
var shootArrowOgg;
var shootArrowMP3;

// Scene/screen/logistical properties
var center_x;
var center_y;

var game_top = 0;
var game_bottom = 600;
var game_left = 0;
var game_right = 800;

// Leaderboard text and HTML elements
var finalReport;
var leaderboard_list;
var leaderboard;

function debug(something) {
	/* Easier to type console logging */
	console.log(something);
}

var ws; // WebSocket Object

function GoodMan() {
	tGoodMan = new Sprite(desert, "game/goodman.png", 45, 45);
	tGoodMan.setSpeed(0);
	tGoodMan.setPosition(center_x, center_y);

	tGoodMan.checkKeys = function() {
		if(NORTH.condition()) {
			this.changeYby(-1 * PLAYER_MOVE_SPEED);
			this.setImgAngle(NORTH.angle);
		}
		if(SOUTH.condition()) {
			this.changeYby(PLAYER_MOVE_SPEED);
			this.setImgAngle(SOUTH.angle);
		}
		if(EAST.condition()) {
			this.changeXby(PLAYER_MOVE_SPEED);
			this.setImgAngle(EAST.angle);
		}
		if(WEST.condition()) {
			this.changeXby(-1 * PLAYER_MOVE_SPEED);
			this.setImgAngle(WEST.angle);
		}
		if(NORTHWEST.condition()) {
			this.setImgAngle(NORTHWEST.angle);
		}
		if(NORTHEAST.condition()) {
			this.setImgAngle(NORTHEAST.angle);
		}
		if(SOUTHWEST.condition()) {
			this.setImgAngle(SOUTHWEST.angle);
		}
		if(SOUTHEAST.condition()) {
			this.setImgAngle(SOUTHEAST.angle);
		}
		if(keysDown[K_SPACE]) {
			var elapsed = bullet_delay_timer.getElapsedTime();
			if(elapsed > BULLET_DELAY) {
				bullets[current_bullet].fire();
				current_bullet = current_bullet % (NUM_BULLETS-1) + 1;
				bullet_delay_timer.reset();
			}
		}
	}

	tGoodMan.isDead = function() {
		for(var i=0; i<aliens.length; i++) {
			if(tGoodMan.collidesWith(aliens[i])) return true;
		}
		return false;
	}

	return tGoodMan;
}

function Bullet() {
	var tBullet = new Sprite(desert, "game/bullet.png", 5, 15);
	tBullet.setBoundAction(DIE);
	tBullet.hide();

	tBullet.fire = function() {
		shootArrowOgg.play();
		shootArrowMP3.play();
		this.show();
		this.setPosition(goodMan.x, goodMan.y);
		this.setMoveAngle(goodMan.getImgAngle());
		this.setImgAngle(goodMan.getImgAngle() + 90);
		this.setSpeed(BULLET_SPEED);
		bullets_fired++;
	}

	tBullet.die = function() {
		this.hide();
	}

	return tBullet;
}

function Alien() {
	tAlien = new Sprite(desert, "game/alien.png", 32, 64);
	tAlien.alive = true;
	tAlien.setSpeed(gameSpeed);

	tAlien.updateSpeed = function() {
		this.setSpeed(gameSpeed);
	}

	tAlien.updateAngle = function() {
		this.setMoveAngle(goodMan.angleTo(this));
		this.setImgAngle(goodMan.angleTo(this));
	}

 	var start = null;
 	start = randomStartPosition();
	tAlien.setPosition(start.x, start.y);
	tAlien.setMoveAngle(goodMan.angleTo(tAlien));

	tAlien.die = function() {
		/*
			Insert dead aliens into a dead buffer. If the
			dead buffer grows significantly large, take one
			at a time and get them ready to respawn. This
			allows some dead bodies to remain on the scene.
			NUM_REMAINS dead bodies maximum can stay on the
			scene.
		 */
		var index = aliens.indexOf(this);
		if(deadBuffer.length >= NUM_REMAINS) {
			deadBuffer[0].setImage('game/alien.png');
			waitBuffer.push(deadBuffer[0]);
			deadBuffer.splice(0, 1);
		}
		this.setImage('game/deadalien.png');
		this.setSpeed(0);
		deadBuffer.push(this);
		aliens.splice(index, 1);

		this.alive = false;
	}

	return tAlien;
}

function init() {
	finalReport = document.getElementById("lose-text");
	leaderboard = document.getElementById("leaderboard");
	leaderboard_list = document.getElementById("leaderboard-list");

	desert = new AwesomeScene();
	//desert.setBG("#4C4C4C");
	desert.setTileBackground("game/bgrepeat.png");
	center_x = desert.width / 2;
	center_y = desert.height / 2;

	goodMan = new GoodMan();

	initBullets();	
	initAliens();
	initSounds();

	timer = new Timer();
	bullet_delay_timer = new Timer();

	aliens_slaughtered = 0;
	bullets_fired = 0;

	desert.start();

	ws = new WebSocket("ws://localhost:5000/echo")
	ws.onopen = function(e) {
		console.log(this.readyState);
		console.log("Opening a WebSocket connection to ws://localhost:9999/")
		ws.send("Hello server");
		setInterval(function() {
			ws.send(new Date());
		}, 1000);
	};
	ws.onmessage = function(e) { 
		console.log(e.data);
	};
	ws.onclose = function() {}
}

function AwesomeScene() {
	var scene = new Scene();
	scene.setTileBackground = function(imageFile) {
		scene.canvas.style.backgroundImage = "url('"+imageFile+"')";
		scene.canvas.style.backgroundRepeat = "repeat";
	}
	return scene;
}

function initBullets() {
	/* Make some bullets */
	bullets = new Array(NUM_BULLETS);
	for(var i=0; i<NUM_BULLETS; i++) {
		bullets[i] = new Bullet();
	}
}

function initAliens() {
	/* 
		Init all the living aliens and make dynamic length arrays
		for all the dead or waiting to respawn ones.
	 */
	aliens = new Array(NUM_ALIENS);
	for(var i=0; i < NUM_ALIENS; i++) {
		aliens[i] = new Alien();
	}
	deadBuffer = new Array();
	waitBuffer = new Array();
}

function initSounds() {
	owMP3 = new Sound("game/ow.mp3");
	owOgg = new Sound("game/ow.ogg");
	shootArrowMP3 = new Sound("game/shootarrow.mp3");
	shootArrowOgg = new Sound("game/shootarrow.ogg");
}

function update() {
	desert.clear();
	tGoodMan.checkKeys();
	checkTime();
	checkKills();
	respawnAliens();
	for(var i=0; i<deadBuffer.length; i++) {
		deadBuffer[i].update();
	}
	for(var i=0; i<aliens.length; i++) {
		aliens[i].updateSpeed();
		aliens[i].updateAngle();
		aliens[i].update();
	}
	for(var i=0; i<NUM_BULLETS; i++) {
		bullets[i].update();
	}
	checkLose();
	goodMan.update();
}

function checkKills() {
	/* Does any bullet collide with any alien? */
	for(var i=0; i<aliens.length; i++) {
		for(var j=0; j<NUM_BULLETS; j++) {
			if(typeof aliens[i] !== "undefined"){
				if(bullets[j].collidesWith(aliens[i])) {
					owOgg.play();
					owMP3.play();
					aliens[i].die();
					bullets[j].die();
					aliens_slaughtered++;
				}
			}
		}
	}
}

function respawnAliens() {
	/*	
		Make sure there are aliens waiting to be respawned
		and respawn them if there's enough
	 */
	if(waitBuffer.length >= 5) {
		if(Math.random() < RESPAWN_PROBABILITY) {
			for(var i=0; i < waitBuffer.length; i++) {
				var s = randomStartPosition();
				waitBuffer[i].setPosition(s.x, s.y);
				waitBuffer[i].show();
				waitBuffer[i].setSpeed(gameSpeed);
				aliens.push(waitBuffer[i]);
				waitBuffer.splice(i, 1);
			}
		}
	}
}

function checkTime() {
	/*
		Function to slightly add difficulty to the game
		as time progresses
	 */
	now = timer.getElapsedTime();
	if(now % PROGRESS_INTERVAL > -1 && now % PROGRESS_INTERVAL < 1) {
		// if we're "close to" another progress interval (PROGRESS_INTERVAL seconds)
		gameSpeed*=GAMESPEED_INCREMENT;
	}
}

function checkLose() {
	/* 
		Easy function to verify that player has died
		makes update() look cleaner
	*/
	if(goodMan.isDead()) endGame();
}


function endGame() {
	/* Record the game time and calculate the leaderboard results */
	var total_time = Math.floor(timer.getElapsedTime());
	desert.stop();
	finalReport.innerHTML = total_time + 's';

	name = window.prompt("Your name: ");
	if (name) {
		scoresArray = JSON.parse(localStorage.getItem('scoresArray'));
		if(!scoresArray) {
			scoresArray = new Array(); 
		}
		if(scoresArray.length < 1) {
			scoresArray.push({name:name, score:total_time, kills:aliens_slaughtered, shots:bullets_fired});
		} else {
			for(var i=0; i < scoresArray.length; i++) {
				if(total_time >= scoresArray[i]['score']) {
					scoresArray.splice(i, 0, {name:name,score:total_time, kills:aliens_slaughtered, shots:bullets_fired});
					break;
				}
				if(i == scoresArray.length-1) {
					scoresArray.push({name:name, score:total_time, kills:aliens_slaughtered, shots:bullets_fired});
					break;
				}
			}
		}
		localStorage.setItem("scoresArray", JSON.stringify(scoresArray));

		ten_or_less = (scoresArray.length > 10) ? 10 : scoresArray.length;

		for(var i=0; i < ten_or_less; i++) {
			leaderboard_list.innerHTML = leaderboard_list.innerHTML
			+ "<tr><td>" + (i + 1) + "</td>"
			+ "<td style='color:red;'>" + scoresArray[i]['name'] + "</td>"
			+ "<td>" + scoresArray[i]['score'] + "s </td>"
			+ "<td>" + scoresArray[i]['kills'] + "</td>"
			+ "<td>" + scoresArray[i]['shots'] + "</td>"
			+ "</tr>";
		}
	}

	leaderboard.style.display = 'block';
}

function randInterval(min,max)
{
	/* Simply give me a random integer between two values */
	return Math.floor(Math.random()*(max-min+1)+min);
}

function randomStartPosition() {
	/* Return a random off-screen position */
	var offX = [randInterval(-40, -10), randInterval(game_right + 10, game_right + 30)];
	var offY = [randInterval(-40, -10), randInterval(game_bottom + 10, game_bottom + 30)];
	return randInterval(0,1) ? 
	{ x : offX[randInterval(0,1)], y : randInterval(game_top-40, game_bottom + 50) } : 
	{ x : randInterval(game_left-40,game_right+50), y : offY[randInterval(0,1)] }
}

function degreesToRadians(degrees) {
	/* Conver degrees into radians for trig */
	degrees = degrees - 90;
	return (degrees * Math.PI / 180);
}

/*	
	Possible travel directions that contain the condition
	that needs to be met to travel that way and the angle
	you would be travelling if you satisfy the condition.
 */

var NORTH = {
	condition : function() {return keysDown[K_UP] },
	angle : 0
}
var SOUTH = {
	condition : function() {return keysDown[K_DOWN] },
	angle : 180
}
var EAST = {
	condition : function() {return keysDown[K_RIGHT]},
	angle : 90
}
var WEST = {
	condition : function() {return keysDown[K_LEFT]},
	angle : 270
}

var NORTHWEST = {
	condition : function() {return keysDown[K_UP] && keysDown[K_LEFT]},
	angle : 315
}
var NORTHEAST = {
	condition : function() {return keysDown[K_UP] && keysDown[K_RIGHT]},
	angle : 45
}
var SOUTHWEST = {
	condition : function() {return keysDown[K_DOWN] && keysDown[K_LEFT]},
	angle : 225
}
var SOUTHEAST = {
	condition : function() {return keysDown[K_DOWN] && keysDown[K_RIGHT]},
	angle : 135
}