import datetime
from pytz import timezone
from app import db, paxton_api
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime, and_
import uuid
from datetime import timedelta
from models.alerts import Alerts
from resources.emailFromTemplate import emailFromTemplate


class Member(db.Model):
    __tablename__ = "member"

    id = db.Column(db.String, primary_key=True)
    userType = Column(String(50), default="guest", nullable=False)
    title = Column(String(50), default="")
    firstName = Column(String(50), nullable=False)
    lastName = Column(String(50), nullable=False)
    middleName = Column(String(50), nullable=False)
    address1 = Column(String(50), nullable=True)
    address2 = Column(String(50), nullable=True)
    postalCode = Column(String(50), nullable=True)
    city = Column(String(50), nullable=True)
    state = Column(String(50), nullable=True)
    country = Column(String(50), nullable=True)
    cellphone = Column(String(50), nullable=True)
    homephone = Column(String(50), nullable=True)
    workphone = Column(String(50), nullable=True)
    birthday = Column(
        DateTime,
        default=datetime.datetime.now(timezone("Pacific/Auckland")),
        nullable=True,
    )
    birthday_month = Column(Integer, nullable=True)
    birthday_day = Column(Integer, nullable=True)
    email = Column(String(50), nullable=True)
    emergencyContact = Column(String(50), nullable=True)
    emergencyContactPhone = Column(String(50), nullable=True)
    emergencyContactRelation = Column(String(50), nullable=True)

    paxton_card_id = db.Column(String())

    default_payment_method = db.Column(String())

    # Other info
    last_visit = Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )
    last_edit = Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    warning = Column(db.String, default="")

    access_after_hours = Column(db.Boolean, default=False)

    waiver_signed = Column(db.Boolean, default=False)

    waiver_signed_date = Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    signatureImage = db.Column(db.String)

    family = db.Column(db.String, db.ForeignKey("family.id"), nullable=True)

    # Sale Backref
    status = Column(String(50), default="normal", nullable=False)

    proficiency_level = Column(String(50), default="beginner")

    got_to_know_channel = Column(String(50), default="newspaper")

    mail_on_internal_events = Column(Boolean, default=False)

    mail_promotions = Column(Boolean, default=False)

    do_not_send_mail = Column(Boolean, default=False)

    # Concession Passes
    concession_passes = Column(db.Integer, default=0)
    # member_sale = db.relationship('Sales',
    #    backref=db.backref('sales_entries', lazy=True))
    # Membership
    memberships = db.relationship(
        "Membership", backref=db.backref("membership", lazy=True)
    )
    # current_membership = db.Column(db.String, db.ForeignKey('membership.id'),nullable=True)
    # PaymentMethods
    payment_methods = db.relationship(
        "PaymentMethod", backref=db.backref("payment_method", lazy=True)
    )

    rentals = db.relationship("Rental", backref=db.backref("rentals", lazy=True))

    # Stripe Id and Invoice
    stripe_id = Column(String(50))
    stripe_invoice_prefix = Column(String(50))

    created = Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )
    profile_photo = db.Column(String, nullable=True)

    notes = db.Column(String)
    def __init__(self, data, stripe_customer):
        # User types:
        # Guest/Member/staff/admin
        self.id = str(uuid.uuid1())

        self.created = datetime.datetime.now(timezone("Pacific/Auckland"))

        self.title = data["title"]
        self.firstName = data["firstName"]
        self.lastName = data["lastName"]
        self.middleName = data["middleName"]

        self.birthday = datetime.datetime.fromisoformat(
            data["birthday"].replace("Z", "000")
        )
        self.birthday_month = self.birthday.month
        self.birthday_day = self.birthday.day
        self.address1 = data["address1"]
        self.address2 = data["address2"]
        self.postalCode = data["postalCode"]
        self.city = data["city"]
        self.state = data["state"]
        self.country = data["country"]
        self.cellphone = data["cellphone"]
        self.homephone = data["homephone"]
        self.workphone = data["workphone"]
        self.email = data["email"]
        self.notes = data["notes"]

        split = data["birthday"].split("-")
        year = split[0]
        month = split[1]
        date = split[2]

        date_from_string = datetime.datetime.strptime(
            "{}-{}-{}".format(year, month, date), "%Y-%m-%d"
        )
        self.birthday = date_from_string

        self.access_after_hours = data["access_after_hours"]

        self.emergencyContact = data["emergencyContact"]
        self.emergencyContactRelation = data["emergencyContactRelation"]
        self.emergencyContactPhone = data["emergencyContactPhone"]

        self.stripe_invoice_prefix = stripe_customer["invoice_prefix"]
        self.stripe_id = stripe_customer["id"]

        self.created = datetime.datetime.now(timezone("Pacific/Auckland"))

        self.got_to_know_channel = data["got_to_know_channel"]
        self.proficiency_level = data["proficiency_level"]

        self.mail_on_internal_events = data["mail_on_internal_events"]
        self.mail_promotions = data["mail_promotions"]
        self.do_not_send_mail = data["do_not_send_mail"]
        """
        Try creating paxton member
        """
        self.create_paxton_customer()
        try:
            self.signatureImage = data["signatureImage"]
        except KeyError:
            self.signatureImage = None
        try:
            self.profile_photo = data["profile_photo"]
        except KeyError:
            self.profile_photo = None

    def set_password(self, password):
        """Create hashed password."""
        self.password = generate_password_hash(password, method="sha256")

    def check_password(self, password):
        """Check hashed password."""
        return check_password_hash(self.password, password)

    def create_paxton_customer(self):
        if paxton_api.paxton_is_user(self.id):
            return {"response": "success"}
        else:
            res = paxton_api.paxton_add_user(
                self.id,
                self.firstName + " " + self.middleName,
                self.lastName,
                self.homephone,
            )
            if res["response"] != "success":
                return {"response": "Paxton Member Creation Failed"}
            else:
                return {"response": "success"}

    def set_paxton_card_id(self, paxton_card_id):
        """
        If user already registered,
        try adding card
        Otherwise,
        try adding user,
        then add card
        """
        if paxton_api.paxton_is_user(self.id):
            set_res = paxton_api.paxton_set_user_card(self.id, paxton_card_id)
            if set_res["response"] == "success":
                self.paxton_card_id = paxton_card_id
                db.session.commit()
                return set_res
            else:
                return {
                    "response": "Unable to set Paxton Card for Customer::"
                    + set_res["response"]
                }
        else:
            res = paxton_api.paxton_add_user(
                self.id,
                self.firstName + " " + self.middleName,
                self.lastName,
                self.homephone,
            )
            if res["response"] != "success":
                return {"response": "Paxton Member Creation Failed"}
            else:
                set_res = paxton_api.paxton_user_card(self.id, paxton_card_id)
                if set_res["response"] == "success":
                    return set_res
                else:
                    return {
                        "response": "Unable to set Paxton Card for Customer::"
                        + set_res["response"]
                    }

    def set_stripe_customer(self, stripe_customer):
        self.stripe_invoice_prefix = stripe_customer["invoice_prefix"]
        self.stripe_id = stripe_customer["id"]

    def update(self, data):
        self.title = data["title"]
        self.firstName = data["firstName"]
        self.lastName = data["lastName"]
        self.middleName = data["middleName"]

        self.address1 = data["address1"]
        self.address2 = data["address2"]
        self.postalCode = data["postalCode"]
        self.city = data["city"]
        self.state = data["state"]
        self.country = data["country"]

        self.cellphone = data["cellphone"]
        self.homephone = data["homephone"]
        self.workphone = data["workphone"]

        split = data["birthday"].split("-")
        year = split[0]
        month = split[1]
        date = split[2]
        date_from_string = datetime.datetime.strptime(
            "{}-{}-{}".format(year, month, date), "%Y-%m-%d"
        )
        self.birthday = date_from_string
        self.birthday_month = self.birthday.month
        self.birthday_day = self.birthday.day

        self.email = data["email"]
        self.emergencyContact = data["emergencyContact"]
        self.emergencyContactRelation = data["emergencyContactRelation"]
        self.emergencyContactPhone = data["emergencyContactPhone"]
        self.last_edit = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.access_after_hours = data["access_after_hours"]

        self.signatureImage = data["signatureImage"]
        self.got_to_know_channel = data["got_to_know_channel"]
        self.proficiency_level = data["proficiency_level"]
        self.mail_on_internal_events = data["mail_on_internal_events"]
        self.mail_promotions = data["mail_promotions"]
        self.do_not_send_mail = data["do_not_send_mail"]

        self.last_edit = datetime.datetime.now(timezone("Pacific/Auckland"))
        """
        Try creating paxton member
        """
        self.create_paxton_customer()

        self.assign_access_permissions()

        self.notes = data["notes"]

        try:
            self.profile_photo = data["profile_photo"]
        except KeyError:
            pass

    def add_concession(self, concession_amount):
        self.concession_passes += concession_amount
        db.session.commit()

    def set_signature(self, signatureImage):
        self.signatureImage = signatureImage

    def assign_access_permissions(self):
        # TODO
        currentMembership = list(filter(lambda x: x.is_active(), self.memberships))
        if len(currentMembership) > 0:
            currentMembership[0].assign_permission_paxton_door_access()
        else:
            pax_res = paxton_api.paxton_revoke_access(self.id)
            if pax_res["response"] == "success":
                pass
            else:
                message = (
                    "Warning::Paxton access setting Failed!::" + pax_res["response"]
                )
                alert = Alerts(
                    alert_type="Paxon Access setting Failure",
                    alert_level="3",
                    alert_message=message,
                    alert_status="unsolved",
                    member_associated_id=self.id,
                )
                db.session.add(alert)
        db.session.commit()

    def check_age_group(self):
        today = datetime.datetime.now(timezone("Pacific/Auckland"))
        try:
            diff_year = today.year - self.birthday.year
        except AttributeError:
            self.birthday = datetime.datetime.fromisoformat(
                self.birthday.replace("Z", "000")
            )
            diff_year = today.year - self.birthday.year

        diff_month = today.month - self.birthday.month
        diff_day = today.day - self.birthday.day
        if diff_month > 0:
            pass
        elif diff_month == 0:
            if diff_day >= 0:
                pass
            else:
                diff_year -= 1
        else:
            diff_year -= 1
        if diff_year > 0:
            age = diff_year
        else:
            age = 0
        if age >= 18:
            return "adult"
        elif age < 18 and age >= 13:
            return "young_adult"
        else:
            return "child"

    def serialize(self, returnMembership=False, returnPaymentMethods=True):
        # time_now_stamp = datetime.datetime.timestamp(datetime.datetime.now(timezone('Pacific/Auckland')))
        # membership_due_stamp = datetime.datetime.timestamp(self.membershipDue)
        # membershipActive = time_now_stamp < membership_due_stamp
        
        if returnPaymentMethods:
            paymentMethods = list(map(lambda x: x.serialize(), self.payment_methods))
        else:
            paymentMethods = None

        if returnMembership:
            currentMembership = list(filter(lambda x: x.is_active(), self.memberships))
            memberships = list(
                map(lambda x: x.serialize(return_Member=False), self.memberships)
            )
            if len(currentMembership) > 0:
                currentMembership = currentMembership[0].serialize()
            else:
                currentMembership = None
        else:
            memberships = []
            currentMembership = None

        outstanding_rentals = len(
            list(filter(lambda x: x.status == "outstanding", self.rentals))
        )
        overdue_rentals = len(
            list(filter(lambda x: x.status == "overdue", self.rentals))
        )
        return {
            "id": self.id,
            "title": self.title,
            "firstName": self.firstName,
            "lastName": self.lastName,
            "middleName": self.middleName,
            "email": self.email,
            "birthday": self.birthday.isoformat(),
            "concession_passes": self.concession_passes,
            "userType": self.userType,
            "stripe_id": self.stripe_id,
            "currentMembership": currentMembership,
            "paymentMethods": paymentMethods,
            "memberships": memberships,
            "membershipActive": self.is_active(),
            "status": self.status,
            "last_visit": self.last_visit.isoformat(),
            "last_edit": self.last_edit.isoformat(),
            "warning": self.warning,
            "access_after_hours": self.access_after_hours,
            "waiver_signed": self.signatureImage != None,
            "family": self.family,
            "created": self.created.isoformat(),
            "emergencyContact": self.emergencyContact,
            "emergencyContactRelation": self.emergencyContactRelation,
            "emergencyContactPhone": self.emergencyContactPhone,
            "address1": self.address1,
            "address2": self.address2,
            "postalCode": self.postalCode,
            "city": self.city,
            "country": self.country,
            "state": self.state,
            "cellphone": self.cellphone,
            "homephone": self.homephone,
            "workphone": self.workphone,
            "signatureImage": self.signatureImage,
            "outstanding_rentals": outstanding_rentals,
            "overdue_rentals": overdue_rentals,
            "do_not_send_mail": self.do_not_send_mail,
            "proficiency_level": self.proficiency_level,
            "mail_on_internal_events": self.mail_on_internal_events,
            "mail_promotions": self.mail_promotions,
            "got_to_know_channel": self.got_to_know_channel,
            "paxton_card_id": self.paxton_card_id,
            "profile_photo": self.profile_photo,
            "notes":self.notes
            #'membershipActive': membershipActive
        }

    def csv_format(self):
        return [
            self.id,
            self.title,
            self.firstName,
            self.lastName,
            self.middleName,
            self.email,
            self.birthday.isoformat(),
            self.concession_passes,
            self.userType,
            self.stripe_id,
            self.birthday,
            self.status,
            self.last_visit.isoformat(),
            self.last_edit.isoformat(),
            self.warning,
            self.access_after_hours,
            self.signatureImage != None,
            self.family,
            self.created.isoformat(),
            self.emergencyContact,
            self.emergencyContactRelation,
            self.emergencyContactPhone,
            self.address1,
            self.address2,
            self.postalCode,
            self.city,
            self.country,
            self.state,
            self.cellphone,
            self.homephone,
            self.workphone,
            self.signatureImage,
            self.do_not_send_mail,
            self.proficiency_level,
            self.mail_on_internal_events,
            self.mail_promotions,
            self.got_to_know_channel,
            self.paxton_card_id,
            self.notes
        ]

    @classmethod
    def get_csv_keys(cls):
        return [
            "id",
            "title",
            "firstName",
            "lastName",
            "middleName",
            "email",
            "birthday",
            "concession_passes",
            "userType",
            "stripe_id",
            "birthday",
            "status",
            "last_visit",
            "last_edit",
            "warning",
            "access_after_hours",
            "waiver_signed",
            "family",
            "created",
            "emergencyContact",
            "emergencyContactRelation",
            "emergencyContactPhone",
            "address1",
            "address2",
            "postalCode",
            "city",
            "country",
            "state",
            "cellphone",
            "homephone",
            "workphone",
            "signatureImage",
            "do_not_send_mail",
            "proficiency_level",
            "mail_on_internal_events",
            "mail_promotions",
            "got_to_know_channel",
            "paxton_card_id",
            "notes"
        ]

    def add_payment_method(self, payment_method_id):
        self.payment_methods.append(payment_method_id)

    def __repr__(self):
        return "<Member {}>".format(self.firstName)

    def is_active(self):
        # If any membership is active
        currentMembership = list(
            filter(lambda x: x.is_active() == True, self.memberships)
        )
        if len(currentMembership) > 0:
            is_active = True
        else:
            is_active = False
        return is_active

    # Different to is_active, this one checks for frozen and holiday
    def has_valid_membership(self):
        currentMembership = list(
            filter(lambda x: x.is_active() == True, self.memberships)
        )
        if len(currentMembership) > 0:
            any_good = False
            for item in currentMembership:
                if (not item.frozen) and (not item.on_holiday):
                    any_good = True
            has_valid = any_good
        else:
            has_valid = False
        return has_valid

    def mail_happy_birthday(self):
        try:
            email_response = emailFromTemplate("Membership Birthday", recipient=self)
            if email_response["response"] == "success":
                pass
            else:
                # Actually log this...
                alert = Alerts(
                    alert_type="Email Failure::Birthday Mail",
                    alert_level="1",
                    alert_message=email_response["emailResponse"],
                    alert_status="unsolved",
                    member_associated_id=self.id,
                )
                db.session.add(alert)
            db.session.commit()
        except Exception as e:            
            log = SystemLog("Error::{} while mailing birthday for {} {}".format(str(e),self.firstName,self.lastName),log_status="error",log_level="3")
            db.session.add(log)
            db.session.commit()
            return 1       

    @classmethod
    def perform_daily_check(cls, today):
        MAIL = True
        if MAIL:
            return list(
                map(
                    lambda x: x.mail_happy_birthday(),
                    Member.query.filter(
                        and_(
                            Member.birthday_month == today.month,
                            Member.birthday_day == today.day,
                        )
                    ),
                )
            )

    @classmethod
    def return_all(cls):
        return {
            "data": list(
                map(
                    lambda x: x.serialize(
                        returnMembership=True, returnPaymentMethods=True
                    ),
                    Member.query.all(),
                )
            )
        }
