import datetime
from pytz import timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta

class SystemBackUp(db.Model):
    __tablename__ = "system"

    id = db.Column(db.String, primary_key=True)

    backup_date = db.Column(db.DateTime)

    def __init__(self, data):        
        self.id = uuid.uuid1()
    def __repr__(self):
        return "<System {}>".format(self.id)

    def serialize(self):
        return {
            "id": self.id,
            "last_checked":self.last_checked.isoformat()
        }
        
    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), Restock.query.all()))
        
class SystemChecks(db.Model):
    __tablename__ = "system_check"

    id = db.Column(db.String, primary_key=True)
    checked_date = db.Column(DateTime)
    error_amount = db.Column(db.Integer)
    time_taken = db.Column(db.Float)
    note = db.Column(db.String)

    def __init__(self, error_amount,time_taken,note=""):
        self.id = uuid.uuid1()
        self.checked_date = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.error_amount = error_amount
        self.time_taken = time_taken
        self.note =note
    def __repr__(self):
        return "<System {}>".format(self.id)

    def serialize(self):
        def fill(num):
            if(len(str(num))<2):
                return "0"+str(num)
            else:
                return str(num)
        return {
            "id": self.id,
            "checked_date_format":"{}-{}-{}".format(self.checked_date.year,
                                                   fill(self.checked_date.month),fill(self.checked_date.day)),
            "checked_date":self.checked_date.timestamp(),
            "error_amount":self.error_amount,
            "time_taken":self.time_taken,
            "note":self.note
        }

    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), SystemChecks.query.all()))

class SystemLog(db.Model):
    __tablename__ = "system_log"
    id = db.Column(db.String, primary_key=True)
    log_date = db.Column(DateTime)
    log_type = db.Column(db.String)
    log_message = db.Column(db.String)
    log_status = db.Column(db.String)
    log_note = db.Column(db.String)
    log_level = db.Column(db.String)

    def __init__(self, log_message="",log_type="system",log_status="normal",log_level="1",log_note=""):
        self.id = uuid.uuid1()
        self.log_date = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.log_message = log_message
        self.log_type = log_type
        self.log_status = log_status
        self.log_note = log_note
        self.log_level = log_level
        
    def __repr__(self):
        return "<System Log {}>".format(self.id)

    def serialize(self):
        return {
            "id": self.id,
            "log_date":self.log_date.isoformat(),
            "log_level":self.log_level,
            "log_type":self.log_type,
            "log_message":self.log_message,
            "log_status":self.log_status,
            "log_note":self.log_note,
        }
    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), SystemLog.query.all()))
