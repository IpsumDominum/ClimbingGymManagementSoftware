import datetime
from pytz import timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta
from models.member import Member


class CheckIn(db.Model):
    __tablename__ = "checkin"
    id = db.Column(db.String, primary_key=True)

    # Checkin type = casual, consession, membership
    checkin_member_id = db.Column(db.String, db.ForeignKey("member.id"), nullable=True)
    checkin_type = db.Column(db.String(50), default="casual", nullable=False)
    checkin_date = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )
    checkin_status = db.Column(db.String, default="failed")
    checkin_message = db.Column(
        db.String, default="failed for unknown reasons::Please Contact Developer"
    )
    def __init__(
        self, checkin_type, checkin_status, checkin_member_id, checkin_message=""
    ):
        self.id = str(uuid.uuid1())
        self.checkin_date = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.checkin_type = checkin_type
        self.checkin_status = checkin_status
        self.checkin_member_id = checkin_member_id
        self.checkin_message = checkin_message

    def __repr__(self):
        return "<CheckIn {}>".format(self.id)

    def serialize(self):
        member = Member.query.get(self.checkin_member_id)
        if self.checkin_date.hour >= 18:
            is_after_hours = True
        else:
            is_after_hours = False
        return {
            "id": self.id,
            "member": member.serialize(),
            "checkin_date": self.checkin_date.isoformat(),
            "checkin_status": self.checkin_status,
            "checkin_message": self.checkin_message,
            "checkin_type": self.checkin_type,
            "is_after_hours": is_after_hours,
        }
    def csv_format(self):
        member = Member.query.get(self.checkin_member_id)
        currentMembership = list(
            filter(lambda x: x.is_active() == True, member.memberships)
        )
        if len(currentMembership) > 0:
            valid_membership = ""
            for item in currentMembership:
                if (not item.frozen) and (not item.on_holiday):
                    valid_membership = item.id
        else:
            valid_membership = ""
        return [
            self.id,
            member.firstName + " "+ member.middleName+" "+member.lastName,
            member.id,
            member.has_valid_membership(),
            valid_membership,
            self.checkin_date.isoformat(),
            self.checkin_status,
            self.checkin_message,
            self.checkin_type
        ]
    @classmethod
    def get_csv_keys(self):
        return [
            "id",
            "member",
            "member_id",
            "member_has_active_membership",
            "membership_id",
            "checkin_date",
            "checkin_status",
            "checkin_message",
            "checkin_type"
        ]
    
    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), CheckIn.query.all()))
