var PLAYER_MOVE_SPEED=10; // How fast player can move

var sc; 			// Scene
//var pond; 			// Sprite for the  background
var player; 		// our player sprite
var players;		// array of player sprites (other players and our own)
var player_keys;	// array of the keys used to store players

var center_x;		// Center of the screen
var center_y;

var mp; 			// MultiplayerConnection Object
var my_player_key;	// global player key

var chatHelper;		// An input field that helps keep things straight during chat time
var typingTimer; 	// Timer for better typing

var waterSoundWav;		// A water sound
var waterSoundOgg;

var notTooManySoundsTimer;

function Player(player_key) {
	// make a sprite
	tPlayer = new Sprite(sc, "game/fishy_sprite_sheet.png", 100, 100); tPlayer.setSpeed(0); tPlayer.setPosition(center_x, center_y);
	tPlayer.loadAnimation(450, 300, 150, 150);
	tPlayer.generateAnimationCycles();
	tPlayer.renameCycles(new Array("swimming", "sitting"));
	tPlayer.setAnimationSpeed(500);
	tPlayer.setCurrentCycle("swimming");
	tPlayer.playAnimation();
	// If a player key was passed in, we can store it right away. Otherwise, this is our player and one will be generated for us.
	tPlayer.player_key = player_key;

	tPlayer.checkKeys = function() {
		if(NORTH.condition()){
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
		for(var i=0; i<keysDown.length; i++) {
			if(keysDown[i]) {
				this.setText(chatHelper.value);
			}
		}
		if(keysDown[13]) this.clearChat();
		if(notTooManySoundsTimer.getTimeElapsed() >= 15) {
			waterSoundOgg.play();
			waterSoundWav.play();
			notTooManySoundsTimer.reset();
		}
	}

	tPlayer.moveMe = function(new_x, new_y) {  // Quick move, causes choppy motion, don't use ever, even now
		this.x = new_x;
		this.y = new_y;
	}

	tPlayer.transmit = function() { // What to send to server. First arg is always a player key
		mp.transmit(my_player_key, {x:players[my_player_key].x, y:players[my_player_key].y, heading:players[my_player_key].getImgAngle(), chat:players[my_player_key].getText() });
	}

	tPlayer.textbox = document.createElement("p");	// create a paragraph
	tPlayer.textbox.setAttribute("id", "chatbox");  // set id for css 
	tPlayer.textbox.style.position = "absolute";	// Make position absolute
	tPlayer.textbox.style.left = tPlayer.x;			// move the textbox
	tPlayer.textbox.style.top = tPlayer.y;
	tPlayer.textbox.style.zIndex = 5;				// arbitrary high z index
	tPlayer.textbox.style.color = randomGoodColor(); // Random color text
	document.body.appendChild(tPlayer.textbox);

	tPlayer.clearChat = function() {
		chatHelper.value = "";
		this.textbox.innerHTML = '';
		chatHelper.focus();
	}

	tPlayer.getText = function() {
		return this.textbox.innerHTML;
	}

	tPlayer.setText = function(text) {
		this.textbox.innerHTML = text;
	}

	tPlayer.moveChat = function() {
		this.textbox.style.left = this.x;
		this.textbox.style.top = this.y;
	}

	return tPlayer;
}

function init() {
	// Keep an array of players and player keys for fast key search
	players = {};
	player_keys = Array();

	// Start a new Multiplayer connection
	mp = new MultiplayerConnection('broadcast');

	// Create a scene
	sc = new AwesomeScene();
	//pond = new Sprite(sc, "game/koipond.png", 800, 600);
    //pond.setPosition(400, 300);
    //pond.setSpeed(0);
	sc.setTileBackground("game/koipond.png"); center_x = sc.width / 2; center_y = sc.height / 2;

	// Create our player and register them with the multiplayer connector
	player = new Player();
	mp.addPlayer(player);

	// Remember our new key and store our player in an object structure
	player_keys.push(player.player_key);
	players[player.player_key] = player;

	// Store our player key
	my_player_key = player.player_key;

	initSounds();

	notTooManySoundsTimer = new Timer();

	// Start the scene
	sc.start();

	// setReceive is the behavior that should take place when a new update is received
	// from the server
	mp.setReceive(function(e) {
		obj = JSON.parse(e.data);				// parse the json string
		k = obj.player_key;						// store the key that should have been broadcasted
		if(!playerExists(k)) {					// if a new key is found
			players[k] = new Player(k);			// 		create a new Player
			player_keys.push(k);				// 		add the key to list of recognized keys
		}
		if(k != my_player_key) {					// if the key isn't our own
			players[k].setImgAngle(obj.heading);	//  set the image angle of other players
			players[k].moveMe(obj.x, obj.y);		// 	move the associated player
			players[k].setText(obj.chat);
			players[k].moveChat();
		}
	});

	chatHelper = document.createElement("input");
	chatHelper.setAttribute("type", "text")
	chatHelper.style.position = "absolute";
	chatHelper.style.opacity = 0;
	document.body.appendChild(chatHelper);
	chatHelper.focus();
}

function playerExists(key) {
	return player_keys.indexOf(key) > -1;
}

function update() {
	sc.clear();
	//pond.update();
	updatePlayers();
}

function updatePlayers() {
	// Update our own player and broadcast its data
	players[my_player_key].checkKeys();
	players[my_player_key].transmit();
	players[my_player_key].moveChat();
	players[my_player_key].update();

	// Update all the other players
	for(var key in players) {
		if(key != my_player_key) {
			players[key].update();
		}
	}
}


function initSounds() {
		// Load up some sound
	waterSoundWav = new Sound("game/water_sound_short.wav");
	waterSoundOgg = new Sound("game/water_sound_short.ogg");
}







/*--------------------- LOGISTICAL STUFF ---------------- */

/* Possible travel directions */
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

/* AwesomeScene inherits from Scene and implements a repeating image background */
function AwesomeScene() {
	var scene = new Scene();
	scene.setTileBackground = function(imageFile) {
		scene.canvas.style.backgroundImage = "url('"+imageFile+"')";
		scene.canvas.style.backgroundRepeat = "repeat";
	}
	return scene;
}

var goodColors = ["3399FF", "CCFF33", "33CC33", "FF3300", "CC0099", "CC9900", "00CC66"];

function randomGoodColor() {
	return goodColors[Math.floor(Math.random() * (goodColors.length-1 + 1) + 0)];
}