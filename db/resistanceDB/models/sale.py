import datetime
from pytz import timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import uuid
from datetime import timedelta
import stripe
from models.member import Member
from models.product import Product
from models.subproduct import SubProduct


class Sales(db.Model):
    __tablename__ = "sales_entries"
    id = db.Column(db.String, primary_key=True)

    product_id = db.Column(db.String)
    sub_product_id = db.Column(db.String)

    membership_id = db.Column(db.String, db.ForeignKey("membership.id"), nullable=True)
    member_id = db.Column(db.String, db.ForeignKey("member.id"), nullable=True)

    """
    Fields for searching
    """
    productType = db.Column(db.String(50))

    vendor = db.Column(db.String(50))

    productName = db.Column(db.String(50))

    size = db.Column(db.String(50))

    color = db.Column(db.String(50))

    default_item = db.Column(db.Boolean)

    """
    Fields for searching end...
    """

    sale_type = db.Column(db.String(50))

    quantity = db.Column(db.Integer, default=0)

    price = db.Column(db.Float, default=0)

    expected_amount = db.Column(db.Float, default=0)

    paid_amount = db.Column(db.Float, default=0)

    discount_amount = db.Column(db.Integer, default=0)

    discount_percentage = db.Column(db.Integer, default=0)

    notes = db.Column(db.String(100))
    created = Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )
    payment_method = db.Column(db.String)

    """
    Create Sale.
    Expected Data:

    @product_id - product being sold
    @anonymousSale - whether the sale is anonymous
    @member_id - the member being sold to
    @notes - any note regarding the sale.
    @sale_type - type of the sale
    @payment_method - the method of which the sale is paid (EFTPOS, etc)
    """

    def __init__(self, data, product, sub_product=None, anonymousSale=True):
        self.id = uuid.uuid1()
        if anonymousSale == False:
            self.member_id = data["member_id"]

        if product:
            self.product_id = product.id
            self.vendor = product.vendor
            self.productName = product.name
            self.productType = product.productType
            self.default_item = product.default_item
        if sub_product:
            self.sub_product_id = sub_product.id
            self.size = sub_product.size
            self.color = sub_product.color

        self.notes = data["notes"]
        self.sale_type = data["saleType"]
        self.quantity = data["quantity"]
        self.price = data["price"]
        self.created = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.payment_method = data["payment_method"]
        self.expected_amount = data["expected_amount"]
        self.paid_amount = data["paid_amount"]
        self.discount_amount = data["discount_amount"]
        self.discount_percentage = data["discount_percentage"]
    def edit(self,data):
        self.expected_amount = data["expected_amount"]
        self.paid_amount = data["paid_amount"]
        self.payment_method = data["paid"]
        self.notes = data["notes"]

    def __repr__(self):
        return "<Product {}>".format(self.id)

    def serialize(self):
        if self.member_id:
            member = Member.query.get(self.member_id)
            if member is not None:
                memberName = member.firstName + " " + member.lastName
            else:
                memberName = None
        else:
            memberName = None

        if(self.product_id!=None):
            product = Product.query.get(self.product_id).serialize()
        else:
            product = None

        if self.sub_product_id != None:
            sub_product = SubProduct.query.get(self.sub_product_id).serialize()
        else:
            sub_product = None

        return {
            "id": self.id,
            "product": product,
            "sub_product": sub_product,
            "notes": self.notes,
            "memberName": memberName,
            "created": self.created.isoformat(),
            "price": self.price,
            "expected_amount": self.expected_amount,
            "paid_amount": self.paid_amount,
            "quantity": self.quantity,
            "discount_amount":self.discount_amount,
            "discount_percentage":self.discount_percentage,
            "notes":self.notes,
            "paid": self.payment_method,
        }
    def csv_format(self):
        if self.member_id:
            member = Member.query.get(self.member_id)
            if member is not None:
                customer_firstName = member.firstName 
                customer_lastName = member.lastName
            else:
                customer_firstName = ""
                customer_lastName = ""
        else:
            customer_firstName = ""
            customer_lastName = ""
        return [
            self.id,
            self.vendor,            
            self.productType,
            self.productName,
            self.size,
            self.color,
            customer_firstName,
            customer_lastName,
            self.created.isoformat(),
            self.quantity,
            self.price,
            self.expected_amount,
            self.paid_amount,
            self.discount_amount,
            self.discount_percentage,
            self.notes,
            self.payment_method,
        ]
    @classmethod
    def get_csv_keys(cls):
        return [
            "id",
            "vendor",
            "productType",
            "productName",
            "size",
            "color",
            "customer_firstName",
            "customer_lastName",
            "transaction_time",
            "qty",
            "unit_price",
            "total_expected",
            "total_paid",
            "discount_amount",
            "discount_percentage",
            "notes",
            "payment_method"
        ]
    @classmethod
    def return_all(cls):
        return {"data": list(map(lambda x: x.serialize(), Sales.query.all()))}
