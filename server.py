import sys, socket

import os
from flask import Flask, send_from_directory

HANDSHAKE = '\
HTTP/1.1 101 Web Socket Protocol Handshake\r\n\
Upgrade: WebSocket\r\n\
Connection: Upgrade\r\n\
WebSocket-Origin: http://localhost:8000\r\n\
WebSocket-Location: ws://localhost:9999/\r\n\r\n\
'

HOST='localhost'
PORT=9999

app = Flask(__name__, static_url_path='/game', static_folder='game')

class SimpleMessage:
	def __init__(self, msg, sender=None):
		self.msg = msg
		self.sender = sender

class Server:
	def __init__(self):
		self.client = None
		self.address = None
		self.data = ''
		self.header = ''
		self.sock = None
		self.shake_done = False
		self.handshake_message = '\
		HTTP/1.1 101 Web Socket Protocol Handshake\r\n\
		Upgrade: WebSocket\r\n\
		Connection: Upgrade\r\n\
		WebSocket-Origin: http://localhost:8000\r\n\
		WebSocket-Location: ws://localhost:9999/\r\n\r\n\
		'

	def is_shaked(self):
		return self.shake_done

	def init_sockets(self, host, port):
		self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		self.sock.bind((host, port))
		print('Socket created on ' + host + ':' + str(port))
	
	def listen(self):
		self.sock.listen(5)
		self.client, self.address = self.sock.accept()

	def shake(self):
		self.header += self.client.recv(16)
		if self.header.find('\r\n\r\n') != -1:
			self.data = self.header.split('\r\n\r\n', 1)[1]
			self.shake_done = True
			self.client.send(self.handshake_message)

	def serve(self):
		self.data += self.client.recv(128)
		print(self.data)
		validated = []
		msgs = self.data.split('\xff')
		self.data = msgs.pop()
		for msg in msgs:
			if msg[0] == '\x00':
				validated.append(msg[1:])
		for v in validated:
			self.client.send('\x00' + v + '\xff')

# Flask
@app.route('/')
def hello():
	return send_from_directory('game', 'index.html')

@app.route('/<any(css, img, js, sound):folder>/<path:filename>')
def toplevel_static(folder, filename):
    filename = safe_join(folder, filename)
    cache_timeout = app.get_send_file_max_age(filename)
    return send_from_directory(app.static_folder, filename,
                               cache_timeout=cache_timeout)