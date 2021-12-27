import datetime
from pytz import timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta


class EmailTemplate(db.Model):
    __tablename__ = "email_templates"
    id = db.Column(db.String, primary_key=True)

    created = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )
    last_edited = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )
    template_name = db.Column(String)
    template_header = db.Column(String)
    template_header_default = db.Column(String)
    template_content = db.Column(String)
    template_content_default = db.Column(String)
    template_description = db.Column(String)
    active = db.Column(Boolean)

    def __init__(
        self, template_name, template_header, template_content, template_description
    ):
        self.id = uuid.uuid1()
        self.created = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.last_edited = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.template_name = template_name
        self.template_header = template_header
        self.template_header_default = template_header
        self.template_content = template_content
        self.template_content_default = template_content
        self.template_description = template_description
        self.active = True

    def update(self, template_header, template_content, template_active):
        self.last_edited = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.template_header = template_header
        self.template_content = template_content
        self.active = template_active

    def toggleActivation(self):
        if self.active == True:
            self.active = False
        elif self.active == False:
            self.active = True

    def __repr__(self):
        return "<Email Template {}>".format(self.id)

    def serialize(self):
        return {
            "id": self.id,
            "created": self.created.isoformat(),
            "last_edited": self.last_edited.isoformat(),
            "template_name": self.template_name,
            "template_header": self.template_header,
            "template_header_default": self.template_header_default,
            "template_content": self.template_content,
            "template_content_default": self.template_content_default,
            "template_description": self.template_description,
            "active": self.active,
        }

    @classmethod
    def return_all(cls):
        return list(
            map(
                lambda x: x.serialize(),
                EmailTemplate.query.order_by(EmailTemplate.template_name).all(),
            )
        )
