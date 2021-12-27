import datetime
from pytz import timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta


class User(db.Model):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    username = Column(String(50), nullable=False, unique=True)
    password = Column(String(200), nullable=False)
    userType = Column(String(50), default="staff", nullable=False)

    def __init__(self, username, password):
        self.id = uuid.uuid1()
        self.username = username
        self.set_password(password)
        self.userType = "staff"
        # User types:
        # Guest/Member/staff/admin

    def set_password(self, password):
        """Create hashed password."""
        self.password = generate_password_hash(password, method="sha256")

    def check_password(self, password):
        """Check hashed password."""
        return check_password_hash(self.password, password)

    def __repr__(self):
        return "<User {}>".format(self.username)

    @classmethod
    def return_all(cls):
        def to_json(x):
            return {
                "username": x.username,
                "userType": x.userType,
            }

        return {"users": list(map(lambda x: to_json(x), User.query.all()))}




class RevokedTokenModel(db.Model):
    __tablename__ = "revoked_tokens"
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(120))

    def add(self):
        db.session.add(self)
        db.session.commit()

    @classmethod
    def is_jti_blacklisted(cls, jti):
        query = cls.query.filter_by(jti=jti).first()
        return bool(query)
