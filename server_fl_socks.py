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
		try:
			message = ws.receive()
		except Exception:
			pass
		if message:
			print("Got message: " + message)

			obj = json.loads(message)

			if 'player_key' in obj:			# new player registration
				new_player_key = obj['player_key']
				if new_player_key not in gs.clients:
					print("New player: " + new_player_key)
					gs.clients[new_player_key] = ws 	# add new player to the client list
			
			for c in gs.clients:
				try:							# try to send messages
					gs.clients[c].send(message)
				except Exception:				# remove clients whose connections are closed
					del gs.clients[c]