import datetime
from pytz import timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta
from models.product import Product


category_dict = {
                "Food&Drinks":
                    ["M&M's chocolate",
                    "Fabulicious"],
                "DayPass":
                    ["Casual Pass Young Adult",
                    "Casual Pass Child"]
                }
from collections import defaultdict
reverse_dict = defaultdict(lambda:"")
for i in category_dict:
    for j in category_dict[i]:
        reverse_dict[j] = i

class SubProduct(db.Model):
    __tablename__ = "sub_products"
    id = db.Column(db.String, primary_key=True)

    # Checkin type = casual, consession, membership
    product_id = db.Column(db.String, db.ForeignKey("products.id"), nullable=False)
    notes = db.Column(db.String(50))
    size = db.Column(db.String(50))
    color = db.Column(db.String(50))
    price = db.Column(db.Float)

    rented = db.Column(db.Integer, default=0, nullable=True)

    sold = db.Column(db.Integer, default=0, nullable=True)

    stock = db.Column(db.Integer, default=0, nullable=True)

    active = db.Column(db.Boolean, default=True)

    restocks = db.relationship("Restock", backref=db.backref("restock", lazy=True))

    rentals = db.relationship("Rental", backref=db.backref("rental", lazy=True))

    created = db.Column(DateTime,default=datetime.datetime.now(timezone("Pacific/Auckland")))

    def __init__(self, data):
        self.id = uuid.uuid1()
        self.product_id = data["product_id"]
        self.notes = data["notes"]
        self.size = data["size"]
        self.price = data["price"]
        self.stock = data["stock"]
        self.color = data["color"]
        self.created = datetime.datetime.now(timezone("Pacific/Auckland"))

    def update(self, data):
        self.notes = data["notes"]
        self.size = data["size"]
        self.price = data["price"]
        self.stock = data["stock"]
        self.color = data["color"]
        db.session.commit()

    def __repr__(self):
        return "<SubProduct {}>".format(self.id)

    def serialize(self):
        parent_product = Product.query.get(self.product_id).serialize()
        restock_history = list(map(lambda x: x.serialize(), self.restocks))
        return {
            "id": self.id,
            "parent_product": parent_product,
            "size": self.size,
            "color": self.color,
            "price": self.price,
            "stock": self.stock,
            "rented": self.rented,
            "sold": self.sold,
            "notes": self.notes,
            "is_active": self.active,
            "restocks": restock_history,
        }
    def csv_format(self):
        parent_product = Product.query.get(self.product_id).serialize()
        return [
            self.id,
            parent_product["vendor"],
            parent_product["productType"],
            parent_product["name"],
            self.size,
            self.color,
            self.price,
            self.stock,
            self.rented,
            self.sold,
            self.notes,
            self.active,
            reverse_dict[parent_product["name"]]
        ]

    @classmethod
    def get_csv_keys(cls):
        return [
         "id",
        "vendor",
        "type",
        "name",
        "size",
        "color",
        "price",
        "stock",
        "rented",
        "sold",
        "notes",
        "is_active",
        "category"
        ]
        
    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), SubProduct.order_by().query.all()))
