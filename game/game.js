/* Global constants */

var PLAYER_MOVE_SPEED=10; // How fast player can move


/* Global varibales */
var desert; // Scene

var goodMan; // Good man Sprite

var players;
var player_keys;

// Scene/screen/logistical properties
var center_x;
var center_y;

var game_top = 0;
var game_bottom = 600;
var game_left = 0;
var game_right = 800;


function debug(something) {
	/* Easier to type console logging */
	console.log(something);
}

var ws; // WebSocket Object
var my_player_key;

function GoodMan(player_key) {
	tGoodMan = new Sprite(desert, "game/goodman.png", 45, 45);
	tGoodMan.setSpeed(0);
	tGoodMan.setPosition(center_x, center_y);
	tGoodMan.player_key = player_key;

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
	}

	tGoodMan.isDead = function() {
		for(var i=0; i<aliens.length; i++) {
			if(tGoodMan.collidesWith(aliens[i])) return true;
		}
		return false;
	}

	tGoodMan.moveMe = function(new_x, new_y) {
		this.x = new_x;
		this.y = new_y;
	}

	tGoodMan.transmit = function() {
		// Transmit is used to start sending regular updates to the WebSocket server of information
		// we want the server to use
		ws.transmit(my_player_key, {x:players[my_player_key].x, y:players[my_player_key].y });
	}

	return tGoodMan;
}

function init() {
	players = {};
	player_keys = Array();
	ws = new SocketClientConnection('echo');
	desert = new AwesomeScene();

	desert.setTileBackground("game/bgrepeat.png");
	center_x = desert.width / 2;
	center_y = desert.height / 2;

	goodMan = new GoodMan();

	ws.addPlayer(goodMan);

	player_keys.push(goodMan.player_key);
	players[goodMan.player_key] = goodMan;

	my_player_key = goodMan.player_key;

	desert.start();

	ws.setReceive(function(e) {
		obj = JSON.parse(e.data);
		k = obj.player_key;
		if(!playerExists(k)) {
			debug("Player " + k + " doesn't exist yet.");
			players[k] = new GoodMan(k);
			player_keys.push(k);
		}
		if(k != my_player_key) {
			players[k].moveMe(obj.x, obj.y);
		}
	});
}

function playerExists(key) {
	return player_keys.indexOf(key) > -1;
}

function AwesomeScene() {
	var scene = new Scene();
	scene.setTileBackground = function(imageFile) {
		scene.canvas.style.backgroundImage = "url('"+imageFile+"')";
		scene.canvas.style.backgroundRepeat = "repeat";
	}
	return scene;
}

function update() {
	desert.clear();
	players[my_player_key].checkKeys();
	players[my_player_key].transmit();
	players[my_player_key].update();
	for(var key in players) {
		if(key != my_player_key) {
			players[key].update();
		}
	}
}

function randInterval(min,max)
{
	/* Simply give me a random integer between two values */
	return Math.floor(Math.random()*(max-min+1)+min);
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