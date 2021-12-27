import datetime
from pytz import timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta


class Alerts(db.Model):
    __tablename__ = "alerts"
    id = db.Column(db.String, primary_key=True)

    created = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )
    alert_type = db.Column(String(50))
    alert_level = db.Column(Integer)
    alert_message = db.Column(String)
    alert_status = db.Column(String(50))
    member_associated_id = db.Column(String())

    def __init__(
        self, alert_type, alert_level, alert_message, alert_status, member_associated_id
    ):
        self.id = uuid.uuid1()
        self.created = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.alert_type = alert_type
        self.alert_level = alert_level
        self.alert_message = alert_message
        self.alert_status = alert_status
        self.member_associated_id = member_associated_id

    def __repr__(self):
        return "<Alert {}>".format(self.id)

    def serialize(self):
        return {
            "id": self.id,
            "created": self.created.isoformat(),
            "alert_type": self.alert_type,
            "alert_level": self.alert_level,
            "alert_message": self.alert_message,
            "alert_status": self.alert_status,
            "member_associated": self.member_associated_id,
        }

    @classmethod
    def return_all(cls):
        return list(
            map(
                lambda x: x.serialize(),
                Alerts.query.filter(Alerts.alert_status == "unsolved").order_by(
                    Alerts.created.desc()
                ),
            )
        )
