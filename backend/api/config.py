# /backend/api/config.py

from flask_mail import Mail
from datetime import timedelta
from dotenv import load_dotenv
import os
load_dotenv()  # carregar variáveis de um arquivo .env
mail = Mail()
# Aqui, 'DB_USER' é o nome da variável que você definiu no seu arquivo .env
DB_USER = os.getenv('DB_USER')

# Você pode fazer o mesmo para todas as outras variáveis
DB_NAME = os.getenv('DB_NAME')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')

SECRET_KEY = os.getenv('SECRET_KEY')
FLASK_APP = os.getenv('FLASK_APP')
FLASK_DEBUG = os.getenv('FLASK_DEBUG') == 'True'

MAIL_SERVER = os.getenv('MAIL_SERVER')
MAIL_PORT = os.getenv('MAIL_PORT')
MAIL_USE_TLS = os.getenv('MAIL_USE_TLS') == 'True'
MAIL_USE_SSL = os.getenv('MAIL_USE_SSL') == 'True'
MAIL_USERNAME = os.getenv('MAIL_USERNAME')
MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER')

SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI')

JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)
JWT_REFRESH_TOKEN_EXPIRES = timedelta(hours=4)
JWT_TOKEN_LOCATION = ['headers']
JWT_HEADER_NAME = 'Authorization'
JWT_HEADER_TYPE = 'Bearer'


def configure_mail(app):
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
    app.config['MAIL_PORT'] = os.getenv('MAIL_PORT')
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
    app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL') == 'True'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')
    mail.init_app(app)
