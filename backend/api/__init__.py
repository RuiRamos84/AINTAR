# backend/api/__init__.py

from flask import Flask
from flask_restx import Api, Namespace
from .notification.views import create_socketio
import eventlet
from .config import *
from .auth.views import ns
from dotenv import load_dotenv
from .database import db
import os
from flask_jwt_extended import JWTManager
from .swagger_config import create_api
from flask_cors import CORS
from .config import *

load_dotenv()  

app = Flask(__name__)
jwt = JWTManager(app)  
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI')
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = JWT_ACCESS_TOKEN_EXPIRES
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = JWT_REFRESH_TOKEN_EXPIRES
app.config['JWT_TOKEN_LOCATION'] = JWT_TOKEN_LOCATION
app.config['JWT_HEADER_NAME'] = JWT_HEADER_NAME
app.config['JWT_HEADER_TYPE'] = JWT_HEADER_TYPE
app.config['DEBUG'] = FLASK_DEBUG
configure_mail(app)
db.init_app(app)
api = create_api(app, ns)
app.debug = True
socketio = create_socketio(app)
CORS(app)

if __name__ == '__main__':
    eventlet.wsgi.server(eventlet.listen(('0.0.0.0', 5000)), app, debug=True)


