from chat import db
from datetime import datetime
from chat import login_manager
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

@login_manager.user_loader
def load_user(id):
    return User.query.get(int(id))

class User(db.Model, UserMixin):
	id = db.Column("id", db.Integer(), primary_key=True)
	username = db.Column(db.String(length=50), nullable=False, unique=True)
	email = db.Column(db.String(length=50), nullable=False, unique=True)
	password_hash = db.Column(db.String(length=60), nullable=False, unique=True)

	def __init__(self, username, email, password):
		self.username = username
		self.email = email
		self.password = password

	@property
	def password(self):
		self.password

	@password.setter
	def password(self, password):
		self.password_hash = generate_password_hash(password)
		
	def check_password(self, password):
		return check_password_hash(self.password_hash, password)

class Message(db.Model):
	id = db.Column(db.Integer(), primary_key=True)
	message = db.Column(db.String(length=400), nullable=False)
	time = db.Column(db.DateTime(), default=datetime.utcnow())
	sender = db.Column(db.Integer())
	receiver = db.Column(db.Integer())
	is_read = db.Column(db.Boolean(), default=False, nullable=False)
	# room_id = db.Column(db.Integer(), db.ForeignKey('room.id'))

	def __init__(self, message, time, sender, receiver, is_read):
		self.message = message
		self.time = time
		self.sender = sender
		self.receiver = receiver
		self.unread = is_read


# class Room(db.Model):
# 	id = db.Column(db.Integer(), primary_key=True)
# 	name = db.Column(db.String(length=20), nullable=True)
# 	room_code = db.Column(db.String(), nullable=False, unique=True)
# 	created_by = db.Column(db.Integer(), db.ForeignKey('user.id'))
# 	created_time = db.Column(db.DateTime(), default=datetime.utcnow())

# 	def __init__(self, name, room_code, created_by, created_time):
# 		self.name = name
# 		self.room_code = room_code
# 		self.created_by = created_by
# 		self.created_time = created_time


