import datetime
from pytz import timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta


class Restock(db.Model):
    __tablename__ = "restock"
    id = db.Column(db.String, primary_key=True)

    # Checkin type = casual, consession, membership
    sub_product_id = db.Column(
        db.String, db.ForeignKey("sub_products.id"), nullable=False
    )

    restock_date = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    restock_amount = db.Column(db.Integer, default=0)

    note = db.Column(db.String, default=0)

    def __init__(self, data):
        self.id = uuid.uuid1()
        self.sub_product_id = data["sub_product_id"]
        self.restock_date = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.restock_amount = data["restock_amount"]
        self.note = data["note"]

    def __repr__(self):
        return "<Restock {}>".format(self.id)

    def serialize(self):
        return {
            "id": self.id,
            "restock_date": self.restock_date.isoformat(),
            "restock_amount": self.restock_amount,
            "note": self.note,
        }

    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), Restock.query.all()))
