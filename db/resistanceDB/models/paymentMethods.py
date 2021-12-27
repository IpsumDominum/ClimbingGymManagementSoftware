import datetime
from pytz import timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta
from models.member import Member
import stripe


class PaymentMethod(db.Model):
    __tablename__ = "payment_method"
    id = db.Column(db.String, primary_key=True)
    member_id = db.Column(db.String, db.ForeignKey("member.id"), nullable=True)
    last_four = db.Column(db.String(10), default="****")
    payment_method_type = db.Column(db.String, default="card", nullable=False)
    payment_method_stripe_id = db.Column(db.String, nullable=False)

    # Child
    def __init__(self, data, resource):
        self.id = uuid.uuid1()
        self.payment_method_type = "card"
        self.payment_method_stripe_id = resource.id
        self.last_four = data["number"][-4:]
        self.member_id = data["customer"]["id"]
        # Member.query.get(data["customer"]["id"]).add_payment_method(self.id)

    def __repr__(self):
        return "<PaymentMethod {}>".format(self.id)

    def serialize(self):
        # stripe_object = stripe.Customer.retrieve_source(
        #            Member.query.get(self.member_id).stripe_id,
        #            self.payment_method_stripe_id
        # )
        return {
            "id": self.id,
            "payment_method_type": self.payment_method_type,
            "payment_method_stripe_id": self.payment_method_stripe_id,
            "last_four": self.last_four,
        }

    @classmethod
    def return_all(cls):
        def to_json(x):
            stripe_object = stripe.Customer.retrieve_source(
                Member.query.get(x.member_id).stripe_id, x.payment_method_stripe_id
            )
            return {
                "id": x.id,
                "member_id": x.member_id,
                "payment_method_type": x.payment_method_type,
                "stripe_object": stripe_object,
                "last_four": x.last_four,
            }

        return list(map(lambda x: to_json(x), PaymentMethod.query.all()))
