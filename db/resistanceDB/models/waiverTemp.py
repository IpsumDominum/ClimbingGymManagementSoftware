import datetime
from pytz import timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta


class WaiverTemp(db.Model):
    __tablename__ = "waiver_temp"
    id = db.Column(db.String, primary_key=True)

    created = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )
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

    phone = Column(String(50), nullable=True)
    workphone = Column(String(50), nullable=True)

    birthday = Column(String(50), nullable=True)
    email = Column(String(50), nullable=True)
    emergencyContact = Column(String(50), nullable=True)
    emergencyContactPhone = Column(String(50), nullable=True)
    emergencyContactPhoneWork = Column(String(50), nullable=True)
    emergencyContactRelation = Column(String(50), nullable=True)

    checked = db.Column(db.Boolean, default=False)
    signature_image = db.Column(db.String)

    def __init__(self, data):
        self.id = uuid.uuid1()
        self.created = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.title = data["title"]
        self.firstName = data["firstName"]
        self.middleName = data["middleName"]
        self.lastName = data["lastName"]
        self.email = data["email"]
        self.phone = data["phone"]
        self.workphone = data["workphone"]
        self.birthday = data["birthday"]

        self.address1 = data["street"]
        self.address2 = data["street2"]
        self.city = data["city"]
        self.state = data["state"]
        self.country = data["country"]
        self.postalCode = data["postalCode"]
        self.emergencyContact = data["emergencyContactName"]
        self.emergencyContactRelation = data["emergencyContactRelation"]
        self.emergencyContactPhone = data["emergencyContactPhone"]
        self.emergencyContactPhoneWork = data["emergencyContactPhoneWork"]
        self.signature_image = data["signatureImage"]

    def mark_as_solved(self):
        self.checked = True

    def __repr__(self):
        return "<WaiverTemp {}>".format(self.id)

    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "firstName": self.firstName,
            "middleName": self.middleName,
            "lastName": self.lastName,
            "birthday": self.birthday,
            "email": self.email,
            "phone": self.phone,
            "workphone": self.workphone,
            "street": self.address1,
            "street2": self.address2,
            "city": self.city,
            "state": self.state,
            "country": self.country,
            "postalCode": self.postalCode,
            "emergencyContactName": self.emergencyContact,
            "emergencyContactRelation": self.emergencyContactRelation,
            "emergencyContactPhone": self.emergencyContactPhone,
            "emergencyContactPhoneWork": self.emergencyContactPhoneWork,
            "created": self.created.isoformat(),
            "signatureImage": self.signature_image,
        }

    @classmethod
    def return_all(cls):
        return list(
            map(
                lambda x: x.serialize(),
                WaiverTemp.query.filter(WaiverTemp.checked == False),
            )
        )

    @classmethod
    def mark_all_as_solved(cls):
        return list(
            map(
                lambda x: x.mark_as_solved(),
                WaiverTemp.query.filter(WaiverTemp.checked == False),
            )
        )
