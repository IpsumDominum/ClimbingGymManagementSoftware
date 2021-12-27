import datetime
from pytz import timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta


class WaiverTempFetchLog(db.Model):
    __tablename__ = "waiver_temp_fetch_log"
    id = db.Column(db.String, primary_key=True)

    created = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    fetched_amount = db.Column(db.Integer, default=0)
    fetched_time = db.Column(db.Float, default=0.0)
    server_response = db.Column(String, default="failed")

    def __init__(self, fetched_amount, fetch_time, server_response):
        self.id = uuid.uuid1()
        self.fetched_amount = fetched_amount
        self.fetched_time = fetch_time
        self.server_response = server_response
        self.created = datetime.datetime.now(timezone("Pacific/Auckland"))

    def __repr__(self):
        return "<WaiverTempFetchLog {}>".format(self.id)

    def serialize(self):
        return {
            "id": self.id,
            "log_date": self.created.isoformat(),
            "fetched_amount": self.fetched_amount,
            "fetched_time": round(self.fetched_time, 3),
            "server_response": self.server_response,
        }

    @classmethod
    def return_all(cls):
        return list(
            map(
                lambda x: x.serialize(),
                WaiverTempFetchLog.query.order_by(WaiverTempFetchLog.created.desc())
                .limit(8)
                .all(),
            )
        )
