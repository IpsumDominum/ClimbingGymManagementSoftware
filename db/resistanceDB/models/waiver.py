import datetime
from pytz import timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta


class Waiver(db.Model):
    __tablename__ = "waiver"
    id = db.Column(db.String, primary_key=True)

    # Checkin type = casual, consession, membership

    created = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    # The member it is signed for
    effective_member = db.Column(db.String, db.ForeignKey("member.id"), nullable=False)

    # The member which has signed the waiver
    signed_member = db.Column(db.String, db.ForeignKey("member.id"), nullable=False)

    signature = db.Column(db.String)
    # The member which has signed the waiver
    # waiver_link = db.Column(db.String)

    def __init__(self, data):
        self.id = uuid.uuid1()

    def __repr__(self):
        return "<Waiver {}>".format(self.id)

    def serialize(self):
        return {
            "id": self.id,
        }

    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), Waiver.query.all()))
