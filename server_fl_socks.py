from flask import Flask, send_from_directory
from flask_sockets import Sockets
import json

# Start Flask server + init flask_sockets.Socket
app = Flask(__name__, static_url_path='/game', static_folder='game')
app.config['DEBUG'] = True
sockets = Sockets(app)

class GameServer(object):
	""" Expandable game server object """
	def __init__(self):
		self.clients = {}

# Flask
@app.route('/')
def root():
	return send_from_directory('game', 'index.html')

@app.route('/<any(css, img, js, sound):folder>/<path:filename>')
def toplevel_static(folder, filename):
    filename = safe_join(folder, filename)
    cache_timeout = app.get_send_file_max_age(filename)
    return send_from_directory(app.static_folder, filename,
                               cache_timeout=cache_timeout)

gs = GameServer()

# Flask sockets
@sockets.route('/broadcast')
def echo_socket(ws):
	delete_list = []									# list of delete-able clients (determined when we can't message them)
	while True:
		try:
			message = ws.receive()	# try to receive incoming connection message or do nothing
		except Exception:
			pass
		if message:
			obj = json.loads(message)	# if we got a message, parse it from json into a dict

			if 'player_key' in obj:						# new player registration
				new_player_key = obj['player_key']
				if new_player_key not in gs.clients:
					gs.clients[new_player_key] = ws 	# add new player to the client list
			
			for c in gs.clients:
				try:									# try to send messages
					gs.clients[c].send(message)
				except Exception:						# remove clients whose connections are closed
					delete_list.append(gs.clients[c])
			for i in delete_list:
				del i