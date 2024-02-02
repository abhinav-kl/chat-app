from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import Length, EqualTo, Email, DataRequired


class RegisterForm(FlaskForm):
	username = StringField(label='Username', validators=[Length(min=4, max=30), DataRequired()])
	email = StringField(label='Email', validators=[Email(), DataRequired()])
	password_hash = PasswordField(label='Password', validators=[Length(min=6), DataRequired()])
	password_hash2 = PasswordField(label='Confirm Password', validators=[EqualTo('password_hash'), DataRequired()])
	submit = SubmitField(label='Create Account')

class LoginForm(FlaskForm):
	username = StringField(label='Username', validators=[DataRequired()])
	password = PasswordField(label='Password', validators=[DataRequired()])
	submit = SubmitField(label='Sign in')

