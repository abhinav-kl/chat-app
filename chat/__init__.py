from flask import Flask
from flask_socketio import SocketIO
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chat.db'
app.config['SECRET_KEY'] = 'l\xb6\xb8C\xafV\xe0\xce\xa5\xb6\xf2c%\xf4\x8b!\xf1I\xc3\xed\xba\xaaI{'
# app.permanent_session_lifetime = timedelta(days=10)

db = SQLAlchemy(app)
app.app_context().push()
login_manager = LoginManager(app)
login_manager.login_view = "login_page"
login_manager.login_message_category= "info"

socketio = SocketIO(app)

from chat import routes
