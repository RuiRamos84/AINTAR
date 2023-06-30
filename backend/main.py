# /myapp/main.py

from api import app
import eventlet


if __name__ == '__main__':
    eventlet.wsgi.server(eventlet.listen(('', 5000)), app)
