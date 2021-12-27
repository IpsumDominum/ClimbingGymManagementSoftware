import datetime
from pytz import timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta


class MembershipAdjustment(db.Model):
    __tablename__ = "membership_adjustment"
    id = db.Column(db.String, primary_key=True)

    # Checkin type = casual, consession, membership
    membership_id = db.Column(db.String, db.ForeignKey("membership.id"), nullable=False)

    action_date = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    action_type = db.Column(db.String(50))

    new_start_date = db.Column(DateTime, nullable=True)

    new_end_date = db.Column(DateTime, nullable=True)

    note = db.Column(db.String, default="")

    # action_doer = db.Column(db.String,db.ForeignKey('user.id'))

    def __init__(self, data):
        self.id = uuid.uuid1()
        self.membership_id = data["membership_id"]

        self.action_type = data["action_type"]
        # self.action_doer = data["action_doer"]
        self.note = data["note"]

    def __repr__(self):
        return "<MembershipAdjustment {}>".format(self.id)

    def serialize(self):
        return {
            "id": self.id,
            "membership_id": self.membership_id,
            "action_type": self.action_type,
            "action_date": self.action_date.isoformat(),
            "note": self.note,
        }

    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), Restock.query.all()))
