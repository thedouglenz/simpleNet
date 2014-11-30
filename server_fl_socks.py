from flask import Flask, send_from_directory
from flask_sockets import Sockets
import json

# Start Flask server
app = Flask(__name__, static_url_path='/game', static_folder='game')
app.config['DEBUG'] = True
sockets = Sockets(app)

class GameServer(object):
	""" Interface for games wanting to communicate via WebSockets """

	def __init__(self):
		self.clients = {}

# Flask
@app.route('/')
def root():
	print('root')
	return send_from_directory('game', 'index.html')

@app.route('/<any(css, img, js, sound):folder>/<path:filename>')
def toplevel_static(folder, filename):
    filename = safe_join(folder, filename)
    cache_timeout = app.get_send_file_max_age(filename)
    return send_from_directory(app.static_folder, filename,
                               cache_timeout=cache_timeout)

gs = GameServer()

# Flask sockets
@sockets.route('/echo')
def echo_socket(ws):
	while True:
		message = ws.receive()
		if message:
			print("Got message: " + message)

			obj = json.loads(message)

			if 'player_register' in obj:			# new player registration
				new_player_key = obj['player_register']
				print("New player: " + new_player_key)
				gs.clients[new_player_key] = ws 	# add new player to the client list
			else:
				for c in gs.clients:
					try:							# try to send messages
						gs.clients[c].send(message)
					except Exception:				# remove clients whose connections are closed
						del gs.clients[c]