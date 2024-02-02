from datetime import datetime
from chat import app, db, socketio
from chat.models import User, Message
from chat.form import RegisterForm, LoginForm
from flask_socketio import send, emit, join_room
from flask_login import login_user, logout_user, current_user, login_required
from flask import render_template, request, redirect, url_for, flash, jsonify



# @app.route('/home')
@app.route('/', methods=['GET', 'POST'])
def home_page():
	return render_template('home.html')

@app.route('/register', methods=['GET', 'POST'])
def register_page():
	form = RegisterForm()
	if form.validate_on_submit():
		create_user = User(username=form.username.data,
					 email=form.email.data,
					 password=form.password_hash.data)
		db.session.add(create_user)
		db.session.commit()
		login_user(create_user)
		flash(f"Account Created Successfully.. You Logged in as {create_user.username}", category="success")
		return redirect(url_for('chat_room'))
	else:
		# flash("An Error occurred!....", category="danger")
		return render_template('register.html', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login_page():
	form = LoginForm()
	if form.validate_on_submit():
		user = User.query.filter_by(username=form.username.data).first()
		if user and user.check_password(password=form.password.data):
			login_user(user)
			flash(f"Welcome {user.username}", category="success")
			return redirect(url_for('chat_room'))
		else:
			flash(f"Error!..., Check the Username and Password")
	return render_template('login.html', form=form)

@app.route('/logout')
def logout_page():
	logout_user()
	flash("You have been logged out!...", category="info")
	return redirect(url_for('login_page'))

# chat.

@app.route('/room', methods=['GET', 'POST'])
@login_required
def chat_room():
	users_list = User.query.filter(User.id != current_user.id).all()

	# message_count = { }

	# for filter_user in users_list:
		# unread_count = Message.query.filter(Message.sender.in_([filter_user.id]),
									   		# Message.receiver.in_([current_user.id]),
											# Message.is_read==False).count()
		# print(unread_count,"message from", filter_user.id)
		# print('counter::',unread_count)
		# message_count[filter_user.id] = unread_count

	# print('counter:',message_count)
	# print('username:',current_user.id)

	# return jsonify(message_count)  # Returns a JSON response

	return render_template('chat-new.html', users=users_list, username=current_user.username)



@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')


@socketio.on('message')
def send_message(data):
	user_id = current_user.id  # Get sender's user ID from session
	selected_user_id = data['selectedUserId']  # Get receiver's user ID from the message data
	message = data['message']	# Get data messages
	sender = f"user_{user_id}"
	receiver = f"user_{selected_user_id}"

	new_message = Message(sender=user_id, receiver=selected_user_id, message=message, time=datetime.now(), is_read=False)
	db.session.add(new_message)
	db.session.commit()

	# Broadcast the message to the sender and receiver
	send({'message': message, 'sender': user_id, 'receiver': selected_user_id, 'is_read': False}, room=sender)
	send({'message': message, 'sender': user_id, 'receiver': selected_user_id, 'is_read': False}, room=receiver)

	# send({'message': message, 'sender': user_id, 'receiver': selected_user_id,},room=sender)  
	# send({'message': message, 'sender': user_id, 'receiver': selected_user_id,},room=receiver)


@socketio.on('join')
def join(data):
	user_id = current_user.id
	selected_user_id = data['selectedUserId']
	sender = f"user_{user_id}"
	receiver = f"user_{selected_user_id}"

	join_room(sender)

	# messages = Message.query.filter(
	# 	((Message.sender == user_id) & (Message.receiver == selected_user_id)) |
	# 	((Message.sender == selected_user_id) & (Message.receiver == user_id))
	# ).order_by(Message.time).all() # here user_id is the current_user

	# for message in messages:
	# 	formatted_message = {
	# 		'message': message.message,
	# 		'sender': message.sender,
	# 		'receiver': message.receiver,
	# 		'time': message.time.strftime("%Y-%m-%d %H:%M:%S"),
	# 		'is_read': message.is_read
	# 	}
	# 	send(formatted_message, room=sender if message.sender == user_id else receiver)
		

@app.route('/get_messages/<int:selected_user_id>')
def get_messages(selected_user_id):
	user_id = current_user.id
	if user_id:
		messages = Message.query.filter(
			((Message.sender == user_id) & (Message.receiver == selected_user_id)) |
			((Message.sender == selected_user_id) & (Message.receiver == user_id))
		).order_by(Message.time).all()

		messages_data = [
			{'message': message.message,
			'sender': message.sender,
			'receiver': message.receiver,
			'time': message.time.strftime("%Y-%m-%d %H:%M:%S"),
			'is_read': message.is_read
			} for message in messages
		]

		return jsonify(messages_data)  # Return the list directly as a JSON response
		
@app.route('/get_unread_count', methods=['GET', 'POST'])
def unread_message_counter():
	message_count = { }

	users = User.query.filter(User.id != current_user.id).all()

	for filter_user in users:
		unread_count = Message.query.filter(Message.sender.in_([filter_user.id]),
									   		Message.receiver.in_([current_user.id]),
											Message.is_read == False).count()
		# print(unread_count,"message from", filter_user.id)
		# print('counter::',unread_count)
		message_count[filter_user.id] = unread_count

	# print('counter when user is not selected:',message_count)
	# print('username:',current_user.id)

	return jsonify(message_count)  # Returns a JSON response

@app.route('/get_message_read', methods=['GET', 'POST'])
def get_message_read():
	user_id = current_user.id
	selected_user_id = request.json.get('selectedUserId')
	message_counter = request.json.get('messageCounter')
	
	messages = Message.query.filter((Message.sender == user_id) and (Message.receiver == selected_user_id) or
								 	(Message.sender == selected_user_id) and (Message.receiver == user_id) and
								  	(Message.is_read == False)).all()
	try:
		for message in messages:
			message.is_read = True
			db.session.add(message)
		db.session.commit()

		message_counter[selected_user_id] = 0

		# print('counter when user is selected ',message_counter)
		return jsonify(message_counter)
	
	except Exception as e:
		return jsonify({'error': str(e)}), 500

@app.route('/update_message', methods=['GET', 'POST'])
def update_status():

	user_id = current_user.id
	selected_user_id = request.json.get('selectedUserId')
	message_counter = request.json.get('messageCounter')
	# print('update stat',message_counter)

	messages = Message.query.filter((Message.sender == user_id) and (Message.receiver == selected_user_id) or
								 	(Message.sender == selected_user_id) and (Message.receiver == user_id) and
								  	(Message.is_read == False)).all()

	for message in messages:
		message.is_read = True
	db.session.commit()

	message_counter[selected_user_id] = 0

	return jsonify(message_counter)

