# backend/main.py

from api import app
import eventlet


if __name__ == '__main__':
    eventlet.wsgi.server(eventlet.listen(('0.0.0.0', 5000)), app)

