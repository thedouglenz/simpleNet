var PLAYER_MOVE_SPEED=10; // How fast player can move

var sc; 			// Scene
var player; 		// our player sprite
var players;		// array of player sprites (other players and our own)
var player_keys;	// array of the keys used to store players

var center_x;		// Center of the screen
var center_y;

var mp; 			// MultiplayerConnection Object
var my_player_key;	// global player key

function Player(player_key) {
	// make a sprite
	tPlayer = new Sprite(sc, "game/fishy.gif", 100, 100); tPlayer.setSpeed(0); tPlayer.setPosition(center_x, center_y);

	// If a player key was passed in, we can store it right away. Otherwise, this is our player and one will be generated for us.
	tPlayer.player_key = player_key;

	tPlayer.checkKeys = function() {
		if(NORTH.condition()) this.changeYby(-1 * PLAYER_MOVE_SPEED);
		if(SOUTH.condition()) this.changeYby(PLAYER_MOVE_SPEED);
		if(EAST.condition()) this.changeXby(PLAYER_MOVE_SPEED);
		if(WEST.condition()) this.changeXby(-1 * PLAYER_MOVE_SPEED);
	}

	tPlayer.moveMe = function(new_x, new_y) {  // Quick move, causes choppy motion, don't use ever, even now
		this.x = new_x;
		this.y = new_y;
	}

	tPlayer.transmit = function() { // What to send to server. First arg is always a player key
		mp.transmit(my_player_key, {x:players[my_player_key].x, y:players[my_player_key].y });
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
	sc.setTileBackground("game/tile_water.png"); center_x = sc.width / 2; center_y = sc.height / 2;

	// Create our player and register them with the multiplayer connector
	player = new Player();
	mp.addPlayer(player);

	// Remember our new key and store our player in an object structure
	player_keys.push(player.player_key);
	players[player.player_key] = player;

	// Store our player key
	my_player_key = player.player_key;

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
		if(k != my_player_key) {				// if the key isn't our own
			players[k].moveMe(obj.x, obj.y);	// 		move the associated player
		}
	});
}

function playerExists(key) {
	return player_keys.indexOf(key) > -1;
}

function update() {
	sc.clear();
	updatePlayers();
}

function updatePlayers() {
	// Update our own player and broadcast its data
	players[my_player_key].checkKeys();
	players[my_player_key].transmit();
	players[my_player_key].update();

	// Update all the other players
	for(var key in players) {
		if(key != my_player_key) {
			players[key].update();
		}
	}
}








/*--------------------- LOGISTICAL STUFF ---------------- */

/* Possible travel directions */
var NORTH = { condition : function() {return keysDown[K_UP] } }; var SOUTH = { condition : function() {return keysDown[K_DOWN] } }; var EAST = { condition : function() {return keysDown[K_RIGHT]} }; var WEST = { condition : function() {return keysDown[K_LEFT]} };

/* AwesomeScene inherits from Scene and implements a repeating image background */
function AwesomeScene() {
	var scene = new Scene();
	scene.setTileBackground = function(imageFile) {
		scene.canvas.style.backgroundImage = "url('"+imageFile+"')";
		scene.canvas.style.backgroundRepeat = "repeat";
	}
	return scene;
}