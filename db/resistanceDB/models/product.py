import datetime
from pytz import timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta
import stripe


class Product(db.Model):
    __tablename__ = "products"
    id = db.Column(db.String, primary_key=True)
    """
    ProductType : 
    dayuse     0 
    membership 1
    climbshop  2
    """
    productType = db.Column(db.String(50), nullable=False)

    vendor = db.Column(db.String(50))

    name = db.Column(db.String(50))

    notes = db.Column(db.String)

    stripe_product_id = db.Column(db.String, nullable=True)

    stripe_price_id = db.Column(db.String, nullable=True)

    stripe_price_fortnight_id = db.Column(db.String, nullable=True)

    """    
    age_restriction is
    Actually an Enum.
    0: No restriction
    1: Adult and young adult only
    2: Adult only
    """
    age_restriction = db.Column(db.Integer, default=0)

    waiver_required = db.Column(db.Boolean, default=False)

    name_unchangeable = db.Column(db.String(50))

    default_item = db.Column(db.Boolean, default=False)

    price = db.Column(db.Float)

    allow_anonymous_sale = db.Column(db.Boolean, default=False)

    subProducts = db.relationship(
        "SubProduct", backref=db.backref("sub_products", lazy=True)
    )
    # sale = db.relationship("Sales", backref=db.backref("sales_entries", lazy=True))

    active = db.Column(db.Boolean, default=True)
    created = Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )
    # user_id = db.Column(db.Integer, db.ForeignKey('user.id'),
    #    nullable=False)
    # user = db.relationship('User',
    #    backref=db.backref('products', lazy=True))
    # Parent
    def __init__(self, data, default_item=False):
        self.id = str(uuid.uuid1())

        self.vendor = data["vendor"]

        self.notes = data["notes"]

        self.productType = data["productType"]

        self.price = data["price"]

        self.name = data["name"]

        # self.waiver_required = data["waiver_required"]

        self.age_restriction = data["age_restriction"]
        self.created = datetime.datetime.now(timezone("Pacific/Auckland"))
        try:
            self.stripe_product_id = data["stripe_product_id"]
            new_price = stripe.Price.create(
                unit_amount=self.price * 100,
                currency="nzd",
                product=self.stripe_product_id,
            )
            new_price_fortnight = stripe.Price.create(
                unit_amount=self.price * 100 * 2,
                currency="nzd",
                product=self.stripe_product_id,
            )
            self.stripe_price_id = new_price["id"]
            self.stripe_price_fortnight_id = new_price_fortnight["id"]
        except KeyError:
            pass

        # self.allow_anonymous_sale = data["allow_anonymous_sale"]
        try:
            self.name_unchangeable = data["name_unchangeable"]
        except Exception:
            pass
        try:
            self.allow_anonymous_sale = data["allow_anonymous_sale"]
        except Exception:
            self.allow_anonymous_sale = False

        self.default_item = default_item

    def update(self, data):
        self.id = str(uuid.uuid1())

        self.vendor = data["vendor"]

        self.notes = data["notes"]

        self.productType = data["productType"]

        self.price = data["price"]

        """
        Change price if stripe price isn't in-sync
        """
        if self.stripe_price_id != None and self.stripe_price_id != "":
            # Retrieve stripe price
            price = stripe.Price.retrieve(self.stripe_price_id)
            #stripe.Price.modify(self.stripe_price_id, active=False)
            #stripe.Price.modify(self.stripe_price_fortnight_id, active=False)
            # Create a new one
            new_price = stripe.Price.create(
                unit_amount=self.price * 100,
                currency="nzd",
                product=self.stripe_product_id,
            )
            new_price_fortnight = stripe.Price.create(
                unit_amount=self.price * 100 * 2,
                currency="nzd",
                product=self.stripe_product_id,
            )
            self.stripe_price_id = new_price["id"]
            self.stripe_price_fortnight_id = new_price_fortnight["id"]

        self.name = data["name"]

        self.waiver_required = data["waiver_required"]

        self.age_restriction = data["age_restriction"]

        self.allow_anonymous_sale = data["allow_anonymous_sale"]

        db.session.commit()

    def __repr__(self):
        return "<Product {}>".format(self.id)

    def serialize(self, returnSaleHistory=False, returnsubItems=False):
        if returnSaleHistory:
            saleHistory = list(map(lambda y: y.serialize(), self.sale))
        else:
            saleHistory = None
        if returnsubItems:
            subProducts = list(map(lambda y: y.serialize(), self.subProducts))
        else:
            subProducts = None
        return {
            "id": self.id,
            "name": self.name,
            "productType": self.productType,
            "vendor": self.vendor,
            "notes": self.notes,
            "price": self.price,
            "sale_history": saleHistory,
            "sub_products": subProducts,
            "is_default": self.default_item,
            "name_unchangeable": self.name_unchangeable,
            "allow_anonymous_sale": self.allow_anonymous_sale,
            "waiver_required": self.waiver_required,
            "age_restriction": self.age_restriction,
            "is_active": self.active,
        }

    def __repr__(self):
        return "<User {}>".format(self.firstName)

    @classmethod
    def return_all(cls):
        return list(
            map(
                lambda x: x.serialize(returnsubItems=True),
                Product.query.order_by(Product.created).all(),
            )
        )

    @classmethod
    def delete_all(cls):
        try:
            num_rows_deleted = db.session.query(cls).delete()
            db.session.commit()
            return {"message": "{} row(s) deleted".format(num_rows_deleted)}
        except:
            return {"message": "Something went wrong"}
