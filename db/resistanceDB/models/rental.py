import datetime
from pytz import timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta
from models.subproduct import SubProduct
from models.member import Member
from models.alerts import Alerts
from resources.emailFromTemplate import emailFromTemplate
from sqlalchemy import and_,or_


class Rental(db.Model):
    __tablename__ = "rental"
    id = db.Column(db.String, primary_key=True)

    # Checkin type = casual, consession, membership
    sub_product_id = db.Column(
        db.String, db.ForeignKey("sub_products.id"), nullable=False
    )

    member_id = db.Column(db.String, db.ForeignKey("member.id"), nullable=False)

    rental_date = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )
    due_date = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )
    returned_date = db.Column(DateTime)

    rental_item_size = db.Column(db.String(50))
    rental_item_color = db.Column(db.String(50))
    rental_item_name = db.Column(db.String(50))

    returned = db.Column(db.Boolean, default=False)
    status = db.Column(db.String, default="outstanding")
    note = db.Column(db.String, default="")

    def __init__(self, data):
        self.id = uuid.uuid1()
        self.member_id = data["member_id"]
        self.sub_product_id = data["sub_product_id"]
        self.rental_date = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.due_date = data["due_date"]
        self.status = "outstanding"
        self.rental_item_name = data["rental_item_name"]
        self.rental_item_size = data["rental_item_size"]
        self.rental_item_color = data["rental_item_color"]
        self.note = data["note"]
        # self.note = data["note"]
        
    def check_overdue(self, alert=False):
        if self.status == "outstanding":
            due_date_timestamp = datetime.datetime.timestamp(self.due_date)
            today_timestamp = datetime.datetime.timestamp(
                datetime.datetime.now(timezone("Pacific/Auckland"))
            )
            if today_timestamp > due_date_timestamp:
                return "overdue"
            else:
                return "outstanding"

    def alert_overdue(self):
        try:
            self.status = "overdue"
            alert = Alerts(
                alert_type="Rental Overdue",
                alert_level="2",
                alert_message=f"Overdue Rental",
                alert_status="unsolved",
                member_associated_id=self.member_id,
            )
            db.session.add(alert)
            customer_query = Member.query.get(self.member_id)
            email_response = emailFromTemplate(
                "Rental Due", recipient=customer_query, rental=self
            )
            if email_response["response"] == "success":
                pass
            else:
                # Actually log this...
                alert = Alerts(
                    alert_type="Email Failure::Rental Due",
                    alert_level="1",
                    alert_message=email_response["emailResponse"],
                    alert_status="unsolved",
                    member_associated_id=customer_query.id,
                )
                db.session.add(alert)
        except Exception as e:
            log = SystemLog("Error::{} while alerting overdue rentals for {} {}".format(str(e),customer_query.firstName,customer_query.lastName),log_status="error",log_level="3")
            db.session.add(log)
            db.session.commit()
            return 1

    def __repr__(self):
        return "<Rental {}>".format(self.id)

    def serialize(self):
        sub_product = SubProduct.query.get(self.sub_product_id)
        member = Member.query.get(self.member_id)
        if self.status == "outstanding":
            status = self.check_overdue(alert=False)
        else:
            status = self.status

        if self.returned_date:
            returned_date = self.returned_date.isoformat()
        else:
            returned_date = None
        return {
            "id": self.id,
            "member": member.serialize(),
            "sub_product": sub_product.serialize(),
            "rental_date": self.rental_date.isoformat(),
            "due_date": self.due_date.isoformat(),
            "returned_date": returned_date,
            "status": status,
            "note":self.note
        }

    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), Rental.query.filter(
            or_(
                Rental.status=="overdue",
                Rental.status=="outstanding"
            )
        )))

    @classmethod
    def perform_daily_check(cls, today):
        today_date_only = datetime.date(today.year, today.month, today.day)
        return list(
            map(
                lambda x: x.alert_overdue(),
                Rental.query.filter(
                    and_(
                        Rental.status == "outstanding",
                        Rental.due_date < today_date_only,
                    )
                ),
            )
        )
