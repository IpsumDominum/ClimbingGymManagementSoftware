import datetime
from pytz import timezone
from app import db, paxton_api
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta
import stripe
from models.member import Member
from models.membershipAdjustment import MembershipAdjustment
from models.membershipInvoice import MembershipInvoice
from models.emailTemplate import EmailTemplate
from sqlalchemy import and_
from models.alerts import Alerts
from models.product import Product
from resources.emailFromTemplate import emailFromTemplate
import calendar


from models.system import SystemLog


class Membership(db.Model):
    __tablename__ = "membership"
    id = db.Column(db.String, primary_key=True)

    member_id = db.Column(db.String, db.ForeignKey("member.id"), nullable=False)

    member = db.relationship("Member", primaryjoin="Membership.member_id==Member.id")

    created = Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    # Start and end date
    start_date = Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )
    end_date = Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    paid = Column(db.Integer, default=0, nullable=False)

    membershipActive = Column(db.Boolean, default=True)

    expected_payment_amount = Column(db.Integer, default=0, nullable=False)

    description = Column(db.String(50), default="Membership")

    # Next Billing Cycle
    next_billing_date = Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    billing_frequency = Column(db.String(50), default="weekly")

    # Frozen Membership
    frozen = Column(db.Boolean, default=False)

    """
    When a membership gets frozen, all the invoices still keeps going,
    and membership is not active until the frozen date.
    """
    frozen_until = Column(DateTime)
    """
    When a membership goes on holiday, all the invoices is postponed,
    and membership is in-active but due date is postponed
    """
    on_holiday = Column(db.Boolean, default=False)

    holiday_until = Column(DateTime)
    # State of membership
    state = Column(db.String, default="not-active")

    billingType = Column(db.String(50))

    # Invoices
    membership_invoices = db.relationship(
        "MembershipInvoice", backref=db.backref("membership_invoice", lazy=True)
    )

    # subscription_stripe_id

    membership_auto_renew = Column(db.Boolean)

    membership_invoice_num = Column(db.Integer)

    membership_type = Column(db.String())

    # Child
    def __init__(self, data, customer_query):
        """
        =========================================
        Get weekly price
        =========================================
        """
        if data["membership_type"] == "Child":
            membership_product = Product.query.filter(
                Product.name_unchangeable == "membership_child"
            ).first()
        elif data["membership_type"] == "Young Adult":
            membership_product = Product.query.filter(
                Product.name_unchangeable == "membership_young_adult"
            ).first()
        elif data["membership_type"] == "Adult":
            membership_product = Product.query.filter(
                Product.name_unchangeable == "membership_adult"
            ).first()
        else:
            raise Exception("Invalid type for membership")

        price_dict = {
            "membership_1_week": membership_product.stripe_price_id,
            "membership_2_week": membership_product.stripe_price_fortnight_id,
        }

        week_price = membership_product.price
        """
        =========================================
        Begin Issue Membership
        =========================================
        """
        self.id = str(uuid.uuid1())
        self.member_id = data["customer"]["id"]
        self.created = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.start_date = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.description = data["membership_description"]  #: "ie. 3 Month Membership",
        self.membership_type = data["membership_type"]

        self.billing_frequency = data["billing_frequency"]
        self.billingType = data["paymentOption"]
        # ====================================================
        # Figure out duration
        # ====================================================
        duration = data["membership_duration"]
        duration_unit = data["membership_duration_unit"]
        
        if data["billing_frequency"] == "fortnightly":
            if duration_unit == "month":
                number_weeks = duration * 4 // 2
            elif duration_unit == "week":
                number_weeks = duration // 2
            billing_frequency = 14
            price_choice = price_dict["membership_2_week"]
        elif data["billing_frequency"] == "weekly":
            if duration_unit == "month":
                number_weeks = duration * 4 // 2
            elif duration_unit == "week":
                number_weeks = duration // 2
            billing_frequency = 7
            price_choice = price_dict["membership_1_week"]
        else:
            raise Exception("Invalid billing frequency")
        if data["paymentOption"] == "prepaidCash":
            """
            Create prepaid membership.
            """
            if duration_unit == "week":
                self.end_date = self.start_date + timedelta(days=7 * duration)
            elif duration_unit == "month":
                remainder = (self.start_date.month + duration) % 12
                dividend = (self.start_date.month + duration) // 12
                try:
                    self.end_date = self.start_date.replace(
                        month=remainder, year=self.start_date.year + dividend
                    )
                except ValueError:
                    # Find last day of month
                    last_day_of_month = calendar.monthrange(                    
                        self.start_date.year + dividend, remainder +1
                    )[1]
                    self.end_date = self.start_date.replace(
                        day=last_day_of_month,
                        month=remainder,
                        year=self.start_date.year + dividend,
                    )
            else:
                return "Invalid duration unit"

            self.paid = week_price * number_weeks
            self.expected_payment_amount = week_price * number_weeks
            self.next_billing_date = None
            invoice_description = "Invoice(Prepaid Full)"
            paid_amount = week_price * number_weeks
            expected_amount = week_price * number_weeks
            db.session.add(self)
            db.session.commit()
            """
            #Deprecated, now book keeping done with sales.
            stripe_invoice_id = None
            invoice_date = self.start_date
            invoice_status = "paid"
            membership_invoice = MembershipInvoice(
                self.id,
                customer_query.id,
                stripe_invoice_id,
                invoice_description,
                expected_amount,
                paid_amount,
                invoice_date,
                invoice_status,
                "",
            )
            self.membership_invoices.append(membership_invoice)
            """
        elif data["paymentOption"] == "recurring":
            """
            Set current card as default
            """
            # Till Next Month
            self.membership_auto_renew = True
            if self.membership_auto_renew == True:
                duration = 1
                remainder = (self.start_date.month + duration) % 12
                dividend = (self.start_date.month + duration) // 12
                self.end_date = self.start_date + timedelta(days=28)
                date_string = "{}/{}/{}".format(self.end_date.month,self.end_date.day,self.end_date.year)
                self.end_date = datetime.datetime.strptime(date_string,"%m/%d/%Y")
                #self.end_date = datetime.date(
                #    self.end_date.year, self.end_date.month, self.end_date.day
                #)
                """
                try:
                    self.end_date = self.start_date.replace(month=remainder,year=self.start_date.year+dividend)
                except ValueError:
                    last_day_of_month = calendar.monthrange(self.start_date.year+dividend,remainder)[1]
                    self.end_date = self.start_date.replace(day=last_day_of_month,month=remainder,year=self.start_date.year+dividend)
                """
                # self.paid = 0 #week_price
                # self.expected_payment_amount = 0#week_price * number_weeks
                # But Generate 4 invoices
                if self.billing_frequency == "fortnightly":
                    number_weeks = 2
                elif self.billing_frequency == "weekly":
                    number_weeks = 4
                else:
                    number_weeks = 4
            # Set selected card as default payment method
            stripe.Customer.modify(
                customer_query.stripe_id, default_source=data["customer"]["card_id"]
            )
            self.membership_invoice_num = 1
            try:
                # Generate an initial invoice
                self.make_invoices_recurring(
                    customer_query,
                    number_weeks,
                    week_price,
                    self.start_date,
                    price_choice,
                    initial=True,
                )
            except Exception as e:
                raise Exception(str(e))
            db.session.commit()
            """
            if self.billing_frequency == "fortnightly":
                self.next_billing_date = self.start_date + timedelta(days=14)
            elif self.billing_frequency == "weekly":
                self.next_billing_date = self.start_date + timedelta(days=7)
            else:
                raise Exception("Invalid duration unit")
            """

    def __repr__(self):
        return "<Membership {}>".format(self.id)

    def renew_recurring(self):
        if self.membership_type == "Child":
            membership_product = Product.query.filter(
                Product.name_unchangeable == "membership_child"
            ).first()
        elif self.membership_type == "Young Adult":
            membership_product = Product.query.filter(
                Product.name_unchangeable == "membership_young_adult"
            ).first()
        elif self.membership_type == "Adult":
            membership_product = Product.query.filter(
                Product.name_unchangeable == "membership_adult"
            ).first()
        else:
            raise Exception("Invalid type for membership")

        price_dict = {
            "membership_1_week": membership_product.stripe_price_id,
            "membership_2_week": membership_product.stripe_price_fortnight_id,
        }

        week_price = membership_product.price
        if self.billing_frequency == "weekly":
            price_choice = price_dict["membership_1_week"]
        elif self.billing_frequency == "fortnightly":
            price_choice = price_dict["membership_2_week"]

        duration = 1

        # Before set end date...Get new start date
        new_start_date_date_only = datetime.datetime(
            self.end_date.year, self.end_date.month, self.end_date.day
        )
        # Set end date extending from previous end date
        # remainder = (self.end_date.month + duration) % 12
        # dividend = (self.end_date.month + duration) //12

        try:
            self.end_date = self.end_date + timedelta(days=28)
            date_string = "{}/{}/{}".format(self.end_date.month,self.end_date.day,self.end_date.year)
            self.end_date = datetime.datetime.strptime(date_string,"%m/%d/%Y")
        except Exception as e:
            print("A problem has occured, please let developer know. line 306, \models\membership : "+str(e))
            return
        """
        try:
            self.end_date = self.start_date.replace(month=remainder,year=self.end_date.year+dividend)
        except ValueError:
            #find last day of month
            last_day_of_month = calendar.monthrange(self.start_date.year+dividend,remainder)[1]
            self.end_date = self.start_date.replace(day=last_day_of_month,month=remainder,year=self.end_date.year+dividend)
        """

        # But Generate 4 invoices
        if self.billing_frequency == "fortnightly":
            number_weeks = 2
        elif self.billing_frequency == "weekly":
            number_weeks = 4
        else:
            number_weeks = 4

        # TODO: Add default payment method to customer
        # stripe.Customer.modify(
        #    self.member.stripe_id, default_source=data["customer"]["card_id"]
        # )
        # self.paid = None #week_price
        # self.expected_payment_amount = None#week_price * number_weeks

        # Generate invoices...
        self.make_invoices_recurring(
            self.member,
            number_weeks,
            week_price,
            new_start_date_date_only,
            price_choice,
            initial=False,
        )

    def make_invoices_recurring(
        self,
        customer_query,
        number_weeks,
        week_price,
        start_date,
        price_choice,
        initial=False,
    ):
        if(self.billing_frequency == "fortnightly"):
            week_price = week_price *2
        for invoice_num in range(0, number_weeks):
            """
            Sort out billing frequency
            """
            if self.billing_frequency == "fortnightly":
                #week_price = week_price *2
                billing_frequency = 14
            elif self.billing_frequency == "weekly":
                billing_frequency = 7
            else:
                print("This shouldn't happen...")
                billing_frequency = 7
            
            date_string = "{}/{}/{}".format(start_date.month,start_date.day,start_date.year)
            start_date_date_only = datetime.datetime.strptime(date_string,"%m/%d/%Y")

            invoice_date = start_date_date_only + timedelta(
                days=invoice_num * billing_frequency
            )
            try:
                for invoice in self.membership_invoices:
                    if(datetime.datetime.timestamp(invoice.invoice_date)==datetime.datetime.timestamp(invoice_date)):
                        print("ERROR: Duplicate payment attempted, but prevented. Please let developer know.")
                        return
            except Exception as e:
                print("An error has occured: "+str(e)+", Please let developer know.")
                    
            """
            Create Stripe Invoice Here.
            """
            stripe_response = stripe.InvoiceItem.create(
                customer=customer_query.stripe_id, price=price_choice
            )
            invoice = stripe.Invoice.create(
                customer=customer_query.stripe_id,
            )
            """
            Condition for renew vs initial situation
            """
            if initial == True and invoice_num == 0:
                invoice_description = "Initial Invoice"
            else:
                self.membership_invoice_num += 1
                invoice_description = "Invoice {}".format(self.membership_invoice_num)
                
            """
            Try payment if first invoice
            """
            email_invoice_receipt = False
            email_invoice_failed = False
            paid_amount = 0
            expected_amount = week_price
            message = ""
            
            """
            Add invoice to 
            """
            stripe_invoice_id = invoice["id"]
            if invoice_num == 0 and initial==True:
                """
                First Invoice of the batch, try pay the first one
                """
                try:
                    stripe_payment_response = stripe.Invoice.pay(invoice["id"])
                    payment_successful = stripe_payment_response["paid"] == True
                except Exception as e:
                    if(initial==True):
                        raise AssertionError(str(e))
                    else:
                        payment_successful = False
                        message = str(e)
                if payment_successful:
                    # self.paid += expected_amount
                    paid_amount = week_price
                    invoice_status = "paid"
                    email_invoice_receipt = True
                    if(initial==True):
                        db.session.add(self)
                        db.session.commit()
                else:
                    invoice_status = "failed"
                    if initial == True:
                        raise AssertionError("Initial Payment Failed")
                    else:
                        self.freeze(None)
                        email_invoice_failed = True
                db.session.commit()
            else:
                """
                Subsequent Invoices
                """
                expected_amount = week_price
                invoice_status = "pending"
            db.session.commit()

            membership_invoice = MembershipInvoice(
                str(self.id),
                customer_query.id,
                stripe_invoice_id,
                invoice_description,
                expected_amount,
                paid_amount,
                invoice_date,
                invoice_status,
                price_choice,
            )
            db.session.add(membership_invoice)
            db.session.commit()
            if email_invoice_receipt == True:
                email_response = emailFromTemplate(
                    "Invoice Payment Successful",
                    recipient=customer_query,
                    invoice=membership_invoice,
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
            if email_invoice_failed == True:
                # Send an alert about payment failure
                invoice_failure_alert = Alerts(
                    alert_type="Invoice Failed",
                    alert_level="3",
                    alert_message="An Email Should Be Sent to the customer.",
                    alert_status="unsolved",
                    member_associated_id=customer_query.id,
                )
                db.session.add(invoice_failure_alert)
                # Send an email about invoice failed
                email_response = emailFromTemplate(
                    "Invoice Payment Failed",
                    recipient=customer_query,
                    invoice=membership_invoice,
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
    def assign_permission_paxton_door_access(self, revoke=False):
        # Sanity for simple override controls...
        # Check according to some criterias whether to give permission

        member_query = Member.query.get(self.member_id)
        if (
            self.is_active()
            and (not self.frozen)
            and member_query.check_age_group() in ["adult", "young_adult"]
        ) and (not revoke):
            if member_query.access_after_hours == True:
                pax_res = paxton_api.paxton_give_after_hours_access(self.member_id)
                message = "Paxton access granted"
            else:
                pax_res = paxton_api.paxton_revoke_access(self.member_id)
                message = (
                    "No Paxton access after hours due to age or specified restrictions."
                )
        else:
            pax_res = paxton_api.paxton_revoke_access(self.member_id)
            message = (
                "No Paxton access after hours due to age or specified restrictions."
            )
        
        try:
            pax_res_response = pax_res["response"]
        except TypeError:
            pax_res_response = "Failed for unknown reasons."
        if pax_res_response == "success":
            pass
        else:
            message = "Warning::Paxton access setting Failed!::" + pax_res_response
            alert = Alerts(
                alert_type="Paxon Access setting Failure",
                alert_level="3",
                alert_message=message,
                alert_status="unsolved",
                member_associated_id=self.member_id,
            )
            db.session.add(alert)
        db.session.commit()

    def freeze(self, freeze_until):
        try:
            # Set membership frozen
            self.frozen = True
            # If not freeze indefinitely
            if freeze_until != None:
                self.frozen_until = datetime.date(
                    freeze_until.year, freeze_until.month, freeze_until.day
                )
            else:
                # Otherwise freeze indefinitely
                self.freeze_until = None
            # Add Adjustment Log
            action_type = "freeze membership"
            adjustment = MembershipAdjustment(
                {"membership_id": self.id, "action_type": action_type, "note": ""}
            )
            # Send Email About Membership Frozen
            email_response = emailFromTemplate(
                "Membership Frozen", recipient=self.member, membership=self
            )
            if email_response["response"] == "success":
                pass
            else:
                # If Email Failure
                # Alert About Email Failure
                alert = Alerts(
                    alert_type="Email Failure::Freeze Membership",
                    alert_level="2",
                    alert_message=email_response["emailResponse"],
                    alert_status="unsolved",
                    member_associated_id=self.member.id,
                )
                db.session.add(alert)
            self.assign_permission_paxton_door_access(revoke=True)
            db.session.add(adjustment)
        except Exception as e:
            log = SystemLog("Error::{} while freezing membership for {} {}".format(str(e),self.member.firstName,self.member.lastName),log_status="error",log_level="3")
            db.session.add(log)
            db.session.commit()
            return 1

    def unfreeze(self):
        try:
            # Set Self Frozen To Be False
            self.frozen = False
            # Set Frozen Until To Be None
            self.frozen_until = None

            #Add Adjustment Log
            action_type = "un-freeze membership"
            adjustment = MembershipAdjustment(
                {"membership_id": self.id, "action_type": action_type, "note": ""}
            )

            log = SystemLog("unfroze membership for member {} {}".format(self.member.firstName,self.member.lastName))
            db.session.add(log)

            # Give Paxton Access Permission
            self.assign_permission_paxton_door_access()

            #Send Email About Unfreezing
            email_response = emailFromTemplate(
                "Membership UnFreezed", recipient=self.member, membership=self
            )
            if email_response["response"] == "success":
                pass
            else:
                # Actually log this...
                alert = Alerts(
                    alert_type="Email Failure::UnFreeze Membership",
                    alert_level="2",
                    alert_message=email_response["emailResponse"],
                    alert_status="unsolved",
                    member_associated_id=self.member.id,
                )
                db.session.add(alert)
            self.assign_permission_paxton_door_access()
            db.session.add(adjustment)
            db.session.commit()        
        except Exception as e:
            log = SystemLog("Error::{} while unfreezing membership for {} {}".format(str(e),self.member.firstName,self.member.lastName),log_status="error",log_level="3")
            db.session.add(log)
            db.session.commit()
            return 1

    def holiday(self, holiday_until):
        try:
            # Send an email about membership holiday
            self.on_holiday = True
            for invoice in self.membership_invoices:
                invoice.set_on_holiday()
            if holiday_until != None:
                self.holiday_until = datetime.date(
                    holiday_until.year, holiday_until.month, holiday_until.day
                )
            else:
                self.holiday_until = None
            action_type = "membership holiday"
            adjustment = MembershipAdjustment(
                {"membership_id": self.id, "action_type": action_type, "note": ""}
            )
            email_response = emailFromTemplate(
                "Membership Holiday", recipient=self.member, membership=self
            )
            log = SystemLog("began holiday for member {} {}".format(self.member.firstName,self.member.lastName))
            db.session.add(log)
            if email_response["response"] == "success":
                pass
            else:
                # Actually log this...
                alert = Alerts(
                    alert_type="Email Failure::UnFreeze Membership",
                    alert_level="2",
                    alert_message=email_response["emailResponse"],
                    alert_status="unsolved",
                    member_associated_id=self.member.id,
                )
                db.session.add(alert)
            self.assign_permission_paxton_door_access(revoke=True)
            db.session.add(adjustment)
        except Exception as e:
            log = SystemLog("Error::{} while beginning holiday for {} {}".format(str(e),self.member.firstName,self.member.lastName),log_status="error",log_level="3")
            db.session.add(log)
            db.session.commit()
            return 1

    def terminate_holiday(self):
        if(not self.membershipActive):
            return
        try:
            # Send an email about membership holiday ended
            self.on_holiday = False
            for invoice in self.membership_invoices:
                invoice.terminate_holiday()
            self.holiday_until = None
            action_type = "terminate holiday"
            adjustment = MembershipAdjustment(
                {"membership_id": self.id, "action_type": action_type, "note": ""}
            )
            email_response = emailFromTemplate(
                "Membership Holiday Terminated", recipient=self.member, membership=self
            )
            log = SystemLog("terminated holiday for member {} {}".format(self.member.firstName,self.member.lastName))
            db.session.add(log)
            if email_response["response"] == "success":
                pass
            else:
                # Actually log this...
                alert = Alerts(
                    alert_type="Email Failure::UnFreeze Membership",
                    alert_level="2",
                    alert_message=email_response["emailResponse"],
                    alert_status="unsolved",
                    member_associated_id=self.member.id,
                )
                db.session.add(alert)
            self.assign_permission_paxton_door_access()
            db.session.add(adjustment)
        except Exception as e:
            log = SystemLog("Error::{} while terminating holiday for {} {}".format(str(e),self.member.firstName,self.member.lastName),log_status="error",log_level="3")
            db.session.add(log)
            db.session.commit()
            return 1

    def cancel(self):
        try:
            self.membership_auto_renew = False
            self.end_date = datetime.datetime.now(timezone("Pacific/Auckland"))
            # Send an email about membership cancellation
            """
            Cancel all the invoices...
            """
            for item in self.membership_invoices:
                if item.status == "pending":
                    item.status = "canceled"
            email_response = emailFromTemplate(
                "Membership Canceled", recipient=self.member, membership=self
            )
            log = SystemLog("cancelled membership for member {} {}".format(self.member.firstName,self.member.lastName))
            db.session.add(log)
            if email_response["response"] == "success":
                pass
            else:
                # Actually log this...
                alert = Alerts(
                    alert_type="Email Failure::Cancellation",
                    alert_level="2",
                    alert_message=email_response["emailResponse"],
                    alert_status="unsolved",
                    member_associated_id=self.id,
                )
                db.session.add(alert)
            self.assign_permission_paxton_door_access(revoke=True)
        except Exception as e:
            log = SystemLog("Error::{} while cancelling membership for {} {}".format(str(e),self.member.firstName,self.member.lastName),log_status="error",log_level="3")
            db.session.add(log)
            db.session.commit()
            return 1

    def handle_holiday(self):
        try:
            if self.on_holiday == True:
                log = SystemLog("handling holiday for member {} {}".format(self.member.firstName,self.member.lastName))
                db.session.add(log)
                db.session.commit()
                self.end_date = self.end_date + timedelta(days=1)
        except Exception as e:
            log = SystemLog("Error::{} while handling holiday for {} {}".format(str(e),self.member.firstName,self.member.lastName),log_status="error",log_level="3")
            db.session.add(log)
            db.session.commit()
            return 1
    def handle_membership_due(self):
        try:
            if self.membership_auto_renew == True and self.membershipActive == True:
                if(not self.on_holiday):
                    print("renewing membership...")
                    if(self.description!="Renewing..."):
                        self.description = "Renewing..."
                        db.session.commit()
                        self.renew_recurring()
                        self.description = "Membership"
                        db.session.commit()
                    else:
                        log = SystemLog("Warning::attempted to duplicate renew membership but was blocked. while handling membership due for {} {}".format(self.member.firstName,self.member.lastName),log_status="warning",log_level="2")
                        db.session.add(log)
                        db.session.commit()
                        return 0
            else:
                # Send an email about membership expiry
                customer_query = Member.query.get(self.member_id)
                email_response = emailFromTemplate(
                    "Membership Expired", recipient=customer_query, membership=self
                )
                if email_response["response"] == "success":
                    pass
                else:
                    # Actually log this...
                    alert = Alerts(
                        alert_type="Email Failure::Membership Expired",
                        alert_level="1",
                        alert_message=email_response["emailResponse"],
                        alert_status="unsolved",
                        member_associated_id=customer_query.id,

                    )
                    db.session.add(alert)
                self.membershipActive = False
        except Exception as e:
            log = SystemLog("Error::{} while handling membership due for {} {}".format(str(e),self.member.firstName,self.member.lastName),log_status="error",log_level="3")
            db.session.add(log)
            db.session.commit()
            return 1

    def is_active(self):
        return (
            datetime.datetime.timestamp(self.end_date)
            >= datetime.datetime.timestamp(
                datetime.datetime.now(timezone("Pacific/Auckland"))
            )
            or self.membership_auto_renew
        )

    def serialize(self, return_Member=False):

        if return_Member:
            member = Member.query.get(self.member_id).serialize()
        else:
            member = self.member_id

        membership_invoices = list(
            map(
                lambda x: x.serialize(),
                MembershipInvoice.query.filter(
                    MembershipInvoice.membership_id == self.id
                )
                .order_by(MembershipInvoice.invoice_date)
                .all(),
            )
        )
        adjustments = list(
            map(
                lambda x: x.serialize(),
                MembershipAdjustment.query.filter(
                    MembershipAdjustment.membership_id == self.id
                ),
            )
        )
        if self.frozen_until:
            frozen_until = self.frozen_until.isoformat()
        else:
            frozen_until = None
        if self.holiday_until:
            holiday_until = self.holiday_until.isoformat()
        else:
            holiday_until = None

        return {
            "id": self.id,
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "active": self.is_active(),
            "next_billing": self.next_billing_date.isoformat(),
            "description": self.description,
            "member": member,
            "invoices": membership_invoices,
            "billingType": self.billingType,
            "billingFrequency": self.billing_frequency,
            "frozen": self.frozen,
            "adjustments": adjustments,
            "frozen_until": frozen_until,
            "on_holiday": self.on_holiday,
            "holiday_until": holiday_until,
            "membership_auto_renew": self.membership_auto_renew,
        }
    def csv_format(self):
        if self.frozen_until:
            frozen_until = self.frozen_until.isoformat()
        else:
            frozen_until = None
        if self.holiday_until:
            holiday_until = self.holiday_until.isoformat()
        else:
            holiday_until = None
        member = Member.query.get(self.member_id)
        return [
            self.id,
            self.start_date.isoformat(),
            self.end_date.isoformat(),
            self.is_active(),
            self.next_billing_date.isoformat(),
            self.description,
            member.firstName,
            member.lastName,
            member.email,
            self.billingType,
            self.billing_frequency,
            self.frozen,
            frozen_until,
            self.on_holiday,
            holiday_until,
            self.membership_auto_renew,
        ]

    @classmethod
    def get_csv_keys(cls):
        return [
            "id",
            "start_date",
            "end_date",
            "active",
            "next_billing",
            "description",
            "member_firstName",
            "member_lastName",
            "member_email",
            "billingType",
            "billingFrequency",
            "frozen",
            "frozen_until",
            "on_holiday",
            "holiday_until",
            "auto_renew"
        ]

    @classmethod
    def return_all(cls):
        def to_json(x):
            adjustments = list(
                map(
                    lambda x: x.serialize(),
                    MembershipAdjustment.query.filter(
                        MembershipAdjustment.membership_id == x.id
                    ),
                )
            )
            membership_invoices = list(
                map(lambda y: y.serialize(), x.membership_invoices)
            )

            return {
                "id": x.id,
                "start_date": x.start_date.isoformat(),
                "end_date": x.end_date.isoformat(),
                "active": datetime.datetime.timestamp(x.end_date)
                > datetime.datetime.timestamp(
                    datetime.datetime.now(timezone("Pacific/Auckland"))
                ),
                "next_billing": x.next_billing_date.isoformat(),
                "description": x.description,
                "member": Member.query.get(x.member_id).serialize(),
                "invoices": membership_invoices,
                "billingType": x.billingType,
                "billingFrequency": x.billing_frequency,
                "frozen": x.frozen,
                "adjustments": adjustments,
                "membership_auto_renew": x.membership_auto_renew,
            }

        return list(map(lambda x: to_json(x), Membership.query.all()))

    @classmethod
    def perform_daily_check(cls, today):
        """
        First find the frozen memberships and their
        frozen until dates
            If frozen until is today:
                Unfreeze.
        """
        today_date_only = datetime.date(today.year, today.month, today.day)
        unfreeze = list(
            map(
                lambda x: x.unfreeze(),
                Membership.query.filter(
                    and_(
                        Membership.frozen == True,
                        Membership.frozen_until <= today_date_only,
                    )
                ),
            )
        )
        db.session.commit()
        """
        #HOLIDAY TERMINATE ON DUE DATE
        term_holiday = list(
            map(
                lambda x: x.terminate_holiday(),
                Membership.query.filter(
                    and_(
                        Membership.on_holiday == True,
                        Membership.holiday_until <= today_date_only,
                    )
                ),
            )
        )
        db.session.commit()
        """
        term_holiday = []
        handle_holiday = list(
            map(
                lambda x: x.handle_holiday(),
                Membership.query.filter(
                    and_(
                        Membership.on_holiday == True,
                        Membership.holiday_until > today_date_only,
                    )
                ),
            )
        )
        db.session.commit()
        # Check for all active memberships which are due
        # If membership is finished: Say "Hey, your membership has finished"
        due = list(
            map(
                lambda x: x.handle_membership_due(),
                Membership.query.filter(
                    and_(
                        Membership.membershipActive == True,
                        Membership.end_date <= today_date_only,
                    )
                ),
            )
        )
        db.session.commit()
        return unfreeze + handle_holiday + term_holiday + due

    @classmethod
    def freeze_all(cls):
        list(
            map(
                lambda x: x.freeze(None),
                Membership.query.filter(Membership.frozen == False).all(),
            )
        )

    @classmethod
    def un_freeze_all(cls):
        list(
            map(
                lambda x: x.unfreeze(),
                Membership.query.filter(Membership.frozen == True).all(),
            )
        )

    @classmethod
    def holiday_all(cls):
        list(
            map(
                lambda x: x.holiday(None),
                Membership.query.filter(Membership.on_holiday == False).all(),
            )
        )

    @classmethod
    def terminate_holiday_all(cls):
        list(
            map(
                lambda x: x.terminate_holiday(),
                Membership.query.filter(Membership.on_holiday == True).all(),
            )
        )
