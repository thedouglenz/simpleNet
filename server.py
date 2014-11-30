import sys, socket

import os
from flask import Flask, send_from_directory
from flask.ext.socketio import SocketIO, emit

import thread
import time

import hashlib, base64

HOST='localhost'
PORT=9999

# Start Flask server
app = Flask(__name__, static_url_path='/game', static_folder='game')
app.config['DEBUG'] = True
app.config['SECRET_KEY'] = 'WhySoSerious?'
socketio = SocketIO(app)


def compute_accept_key(key):
	# concatenate key with magic string and sha1 it
	h = hashlib.sha1(key)
	h.update("258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
	# return the base 64 encoding of it
	return base64.b64encode(h.digest())



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
			self.data = self.header.split('\r\n\r\n', 1)[0]
			key = self.data[self.data.find('Sec-WebSocket-Key: ') + 19:self.data.find('\r\nSec-WebSocket-Extensions: ')]
			accept_key = compute_accept_key(key)

			handshake_msg = 'HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept:' + accept_key + '\r\n\r\n'

			self.shake_done = True
			self.client.send(handshake_msg)

	def serve(self):
		self.data += self.client.recv(2048)
		validated = []
		msgs = self.data.split('\xff')
		self.data = msgs.pop()
		print(self.data.decode('utf8'))
		for msg in msgs:
			if msg[0] == '\x00':
				validated.append(msg[1:])
		for v in validated:
			print(v)
			self.client.send('\x00' + v + '\xff')

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

@socketio.on('connect', namespace='/test')
def test_connect():
	emit('my response', {'data' : 'Connected'})

# game server
def server():
	print('Server started')
	s = Server()
	s.init_sockets(HOST, PORT)
	s.listen()

	while True:
		if not s.is_shaked():
			s.shake()
		else:
			s.serve()

if __name__ == '__main__':
	socketio.run(app)

# Start WebSocket server
# thread.start_new_thread(server, ())