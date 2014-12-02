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
@sockets.route('/broadscast')
def echo_socket(ws):
	# TODO: Dictionary changes size DURING iteration
	delete_list = []
	while True:
		try:
			message = ws.receive()
		except Exception:
			pass
		if message:
			print('Got message: ' + message)
			obj = json.loads(message)

			if 'player_key' in obj:			# new player registration
				new_player_key = obj['player_key']
				if new_player_key not in gs.clients:
					gs.clients[new_player_key] = ws 	# add new player to the client list
			
			for c in gs.clients:
				try:							# try to send messages
					gs.clients[c].send(message)
				except Exception:				# remove clients whose connections are closed
					print('Deleting client ' + c)
					delete_list.append(gs.clients[c])
			for i in delete_list:
				del i