import datetime
from pytz import timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta
from sqlalchemy import and_
import stripe
from models.member import Member
from resources.emailFromTemplate import emailFromTemplate
import models.membership as MembershipModel
from models.alerts import Alerts
from models.system import SystemLog


class MembershipInvoice(db.Model):
    __tablename__ = "membership_invoice"
    id = db.Column(db.String, primary_key=True)

    membership_id = db.Column(db.String, db.ForeignKey("membership.id"), nullable=False)
    membership = db.relationship(
        "Membership", primaryjoin="MembershipInvoice.membership_id==Membership.id"
    )

    member_id = db.Column(db.String, db.ForeignKey("member.id"), nullable=False)
    stripe_invoice_id = db.Column(db.String(50), nullable=True)
    description = db.Column(db.String(50), default="Invoice", nullable=False)
    next_invoice_id = db.Column(db.String(50))

    expected_amount = db.Column(db.Float, nullable=False)
    paid_amount = db.Column(db.Float, nullable=False)

    invoice_date = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    status = db.Column(db.String(50), default="pending")
    stripe_price_choice = db.Column(db.String(50))

    def __init__(
        self,
        membership_id,
        member_id,
        stripe_invoice_id,
        invoice_description,
        expected_amount,
        paid_amount,
        invoice_date,
        status,
        price_choice,
    ):
        self.id = str(uuid.uuid1())
        self.membership_id = membership_id
        self.member_id = member_id
        self.expected_amount = expected_amount
        self.paid_amount = paid_amount
        if stripe_invoice_id != None:
            self.stripe_invoice_id = stripe_invoice_id
        self.description = invoice_description
        self.invoice_date = invoice_date
        self.status = status
        self.stripe_price_choice = price_choice

    def __repr__(self):
        return "<MembershipInvoice {}>".format(self.id)

    def set_on_holiday(self):
        if self.status == "pending":
            self.status = "holiday"

    def handle_holiday(self):
        try:
            """
            If holiday then extend (date plus one)
            """
            member_query = Member.query.get(self.member_id)            
            if self.status == "holiday":
                self.invoice_date = self.invoice_date + timedelta(days=1)
                log = SystemLog("handled birthday for {} {}".format(member_query.firstName,member_query.lastName))
                db.session.add(log)
                db.session.commit()
        except Exception as e:            
            log = SystemLog("Error::{} while mailing birthday for {} {}".format(str(e),member_query.firstName,member_query.lastName),log_status="error",log_level="3")
            db.session.add(log)
            db.session.commit()
            return 1       


    def terminate_holiday(self):
        if self.status == "holiday":
            self.status = "pending"

    def void_self(self):
        if self.status == "pending":
            self.status = "void"
    def confirm_self(self):
        self.expected_amount = self.paid_amount
        self.status = "paid"
    def retry_self(self):
        if(self.status!="failed"):
            raise Exception("Invoice status is not 'failed',cannot retry")
        """
        Create Stripe Invoice Here.
        
        membership = MembershipModel.Membership.query.get(self.membership_id)
        customer_query = Member.query.get(self.member_id)
        stripe_response = stripe.InvoiceItem.create(
            customer=customer_query.stripe_id, price=self.stripe_price_choice
        )
        invoice = stripe.Invoice.create(
            customer=customer_query.stripe_id,
        )
        """
        """
        try payment, if succeeds. void self.
        """
        message = "unknown error"
        try:
            stripe_payment_response = stripe.Invoice.pay(self.stripe_invoice_id)
            # print(stripe_payment_response)
            payment_successful = stripe_payment_response["paid"] == True
        except Exception as e:
            payment_successful = False
            message = str(e)
        if(payment_successful):
            self.status = "paid-after-retry"
            #stripe.
            return "success"
        else:
            return message

    def attempt_payment_self(self):
        if(self.status != "pending"):
            return "Error::Invalid access,status isn't pending"
        
        """
        #assert Inovice.status =="pending"
        If invoice is pending:
            Attempt payment:
                If payment fails: 
                    1.Alert payment failed
                    2.Freeze Parent Membership
                    3.Create a new invoice for next invoice date...
                If payment successful:
                    1.Payment status set to paid
                    2.Payment paid_amount set to expected amount
                    3.(Unsure) If Parent is frozen, unfreeze parent???
        """
        membership = MembershipModel.Membership.query.get(self.membership_id)
        customer_query = Member.query.get(self.member_id)
        try:
            print("paying invoice for {} {}".format(customer_query.firstName,customer_query.lastName))
        except Exception:
            pass
        # Attempt payment
        try:
            stripe_payment_response = stripe.Invoice.pay(self.stripe_invoice_id)
            # print(stripe_payment_response)
            payment_successful = stripe_payment_response["paid"] == True
            # print(payment_successful)
            # print("Paying this invoice...")
            # If payment fails
            if payment_successful:
                log = SystemLog("successfully paid invoice{} for {} {}".format(self.description,customer_query.firstName,customer_query.lastName))
                db.session.add(log)
                db.session.commit()
                membership.paid += self.expected_amount
                self.paid_amount = self.expected_amount
                self.status = "paid"
                db.session.commit()
                # Send an email about invoice paid
                email_response = emailFromTemplate(
                    "Invoice Payment Successful", recipient=customer_query, invoice=self
                )
                if email_response["response"] == "success":
                    pass
                else:
                    # Actually log this...
                    alert = Alerts(
                        alert_type="Email Failure::On Invoice Receipt!!",
                        alert_level="3",
                        alert_message=email_response["emailResponse"],
                        alert_status="unsolved",
                        member_associated_id=customer_query.id,
                    )
                    db.session.add(alert)
                if membership.billing_frequency == "fortnightly":
                    membership.next_billing_date = membership.start_date + timedelta(
                        days=14
                    )
                elif membership.billing_frequency == "weekly":
                    membership.next_billing_date = membership.start_date + timedelta(
                        days=7
                    )
                else:
                    raise Exception("Invalid duration unit")
                db.session.commit()
            else:
                log = SystemLog("payment unsuccessful for invoice{} for {} {}".format(self.description,customer_query.firstName,customer_query.lastName))
                db.session.add(log)
                db.session.commit()
                membership.freeze(None)
                self.status = "failed"
                # Send an alert about payment failure
                invoice_failure_alert = Alerts(
                    alert_type="Invoice Failed",
                    alert_level="3",
                    alert_message="An Email Should Be Sent to the customer.",
                    alert_status="unsolved",
                    member_associated_id=customer_query.id,
                )
                db.session.add(invoice_failure_alert)
                # Send an email about invoice paid
                email_response = emailFromTemplate(
                    "Invoice Payment Failed", recipient=customer_query, invoice=self
                )
                if email_response["response"] == "success":
                    pass
                else:
                    # Actually log this...
                    alert_email_failed = Alerts(
                        alert_type="Email Failure::On Invoice Failure!!",
                        alert_level="3",
                        alert_message=email_response["emailResponse"],
                        alert_status="unsolved",
                        member_associated_id=customer_query.id,
                    )
                    db.session.add(alert_email_failed)
                db.session.commit()
        except Exception as e:            
            # Usually Means it is already paid
            if "Invoice is already paid" in str(e):
                self.status = "paid"
                return 0
            else:
                membership.freeze(None)
                self.status = "failed"
                # Send an alert about payment failure
                invoice_failure_alert = Alerts(
                    alert_type="Invoice Failed",
                    alert_level="3",
                    alert_message=str(e),
                    alert_status="unsolved",
                    member_associated_id=customer_query.id,
                )
                db.session.add(invoice_failure_alert)
                # Send an email about invoice paid
                email_response = emailFromTemplate(
                    "Invoice Payment Failed", recipient=customer_query, invoice=self
                )
                if email_response["response"] == "success":
                    pass
                else:
                    # Actually log this...
                    alert_email_failed = Alerts(
                        alert_type="Email Failure::On Invoice Failure!",
                        alert_level="3",
                        alert_message=email_response["emailResponse"],
                        alert_status="unsolved",
                        member_associated_id=customer_query.id,
                    )
                    db.session.add(alert_email_failed)
                db.session.commit()
            log = SystemLog("Warning::{} while attemping to pay invoice{} for {} {}".format(str(e),self.description,customer_query.firstName,customer_query.lastName),log_status="warning",log_level="2")
            db.session.add(log)
            db.session.commit()
            return 0
    def serialize(self):
        return {
            "id": self.id,
            "member_id": self.member_id,
            "membership_id": self.membership_id,
            "stripe_invoice_id": self.stripe_invoice_id,
            "description": self.description,
            "expected_amount": self.expected_amount,
            "paid_amount": self.paid_amount,
            "invoice_date": self.invoice_date.isoformat(),
            "status": self.status,
        }
    def csv_format(self):
        return [
            self.id,
            self.member_id,
            self.membership_id,
            self.stripe_invoice_id,
            self.description,
            self.expected_amount,
            self.paid_amount,
            self.invoice_date.isoformat(),
            self.status
        ]
    @classmethod
    def get_csv_keys(cls):
        return [
            "id",
            "member_id",
            "membership_id",
            "stripe_invoice_id",
            "description",
            "expected_amount",
            "paid_amount",
            "invoice_date",
            "status"
        ]
    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), MembershipInvoice.query.all()))

    @classmethod
    def perform_daily_check(cls, today):
        # Today is datetime
        today_date_only = datetime.date(today.year, today.month, today.day)

        holiday_invoices = list(
            map(
                lambda x: x.handle_holiday(),
                MembershipInvoice.query.filter(MembershipInvoice.status == "holiday"),
            )
        )

        db.session.commit()
        # Get pending invoices which are due
        pending_invoices_which_are_due = list(
            map(
                lambda x: x.attempt_payment_self(),
                MembershipInvoice.query.filter(
                    and_(
                        MembershipInvoice.status == "pending",
                        MembershipInvoice.invoice_date <= today_date_only,
                    )
                ),
            )
        )
        db.session.commit()
        return holiday_invoices + pending_invoices_which_are_due

