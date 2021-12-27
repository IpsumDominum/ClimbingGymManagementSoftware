import datetime
from pytz import timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta


class Family(db.Model):
    __tablename__ = "family"
    id = db.Column(db.String, primary_key=True)

    # Checkin type = casual, consession, membership

    created = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    members = db.relationship("Member", backref=db.backref("member", lazy=True))

    def __init__(self):
        self.id = uuid.uuid1()

    def __repr__(self):
        return "<Family {}>".format(self.id)

    def serialize(self):
        members = list(map(lambda x: x.serialize(), self.members))
        return {"id": self.id, "members": members}

    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), Family.query.all()))
