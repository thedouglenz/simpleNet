from flask import Flask, send_from_directory
from flask.ext.socketio import SocketIO, emit

# Start Flask server
app = Flask(__name__, static_url_path='/game', static_folder='game')
app.config['DEBUG'] = True
app.config['SECRET_KEY'] = 'WhySoSerious?'
socketio = SocketIO(app)

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

@socketio.on('my event', namespace='/test')
def new_connect():
	emit('my response', {'data' : 'Connected'})
	print('New connection')

if __name__ == '__main__':
	socketio.run(app)