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

    name = db.Column(db.String())

    notes = db.Column(db.String)

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

    sale = db.relationship("Sales", backref=db.backref("sales_entries", lazy=True))
    subProducts = db.relationship(
        "SubProduct", backref=db.backref("sub_products", lazy=True)
    )

    active = db.Column(db.Boolean, default=True)
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

        self.waiver_required = data["waiver_required"]

        self.age_restriction = data["age_restriction"]

        self.allow_anonymous_sale = data["allow_anonymous_sale"]
        try:
            self.name_unchangeable = data["name_unchangeable"]
        except Exception:
            pass
        self.default_item = default_item

    def update(self, data):
        self.id = str(uuid.uuid1())

        self.vendor = data["vendor"]

        self.notes = data["notes"]

        self.productType = data["productType"]

        self.price = data["price"]

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
            map(lambda x: x.serialize(returnsubItems=True), Product.query.all())
        )

    @classmethod
    def delete_all(cls):
        try:
            num_rows_deleted = db.session.query(cls).delete()
            db.session.commit()
            return {"message": "{} row(s) deleted".format(num_rows_deleted)}
        except:
            return {"message": "Something went wrong"}


class Sales(db.Model):
    __tablename__ = "sales_entries"
    id = db.Column(db.String, primary_key=True)

    product_id = db.Column(db.String, db.ForeignKey("products.id"), nullable=False)
    sub_product_id = db.Column(db.String)
    membership_id = db.Column(db.String, db.ForeignKey("membership.id"), nullable=True)
    member_id = db.Column(db.String, db.ForeignKey("member.id"), nullable=True)

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
        if sub_product:
            self.sub_product_id = sub_product.id
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

        product = Product.query.get(self.product_id).serialize()

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
            "paid": self.payment_method,
        }

    @classmethod
    def return_all(cls):
        return {"data": list(map(lambda x: x.serialize(), Sales.query.all()))}


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
    birthday = Column(String(50), nullable=True)
    email = Column(String(50), nullable=True)
    emergencyContact = Column(String(50), nullable=True)
    emergencyContactPhone = Column(String(50), nullable=True)
    emergencyContactRelation = Column(String(50), nullable=True)

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
    #
    def __init__(self, data, stripe_customer):
        # User types:
        # Guest/Member/staff/admin
        self.id = uuid.uuid1()
        self.title = data["title"]
        self.firstName = data["firstName"]
        self.lastName = data["lastName"]
        self.middleName = data["middleName"]
        self.birthday = data["birthday"]

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

        self.access_after_hours = data["access_after_hours"]
        self.emergencyContact = data["emergencyContact"]
        self.emergencyContactRelation = data["emergencyContactRelation"]
        self.emergencyContactPhone = data["emergencyContactPhone"]

        self.stripe_invoice_prefix = stripe_customer["invoice_prefix"]
        self.stripe_id = stripe_customer["id"]

        try:
            self.signatureImage = data["signatureImage"]
        except KeyError:
            self.signatureImage = None

    def set_password(self, password):
        """Create hashed password."""
        self.password = generate_password_hash(password, method="sha256")

    def check_password(self, password):
        """Check hashed password."""
        return check_password_hash(self.password, password)

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

        self.birthday = data["birthday"]
        self.email = data["email"]
        self.emergencyContact = data["emergencyContact"]
        self.emergencyContactRelation = data["emergencyContactRelation"]
        self.emergencyContactPhone = data["emergencyContactPhone"]
        self.last_edit = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.access_after_hours = data["access_after_hours"]
        db.session.commit()

    def add_concession(self, concession_amount):
        self.concession_passes += concession_amount
        db.session.commit()

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
            "birthday": self.birthday,
            "concession_passes": self.concession_passes,
            "userType": self.userType,
            "stripe_id": self.stripe_id,
            "currentMembership": currentMembership,
            "paymentMethods": paymentMethods,
            "memberships": memberships,
            "birthday": self.birthday,
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
            "overdue_rentals": overdue_rentals
            #'membershipActive': membershipActive
        }

    def add_payment_method(self, payment_method_id):
        self.payment_methods.append(payment_method_id)

    def __repr__(self):
        return "<Member {}>".format(self.firstName)

    def is_active(self):
        currentMembership = list(
            filter(lambda x: x.is_active() == True, self.memberships)
        )
        if len(currentMembership) > 0:
            is_active = True
        else:
            is_active = False
        return is_active

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


class Membership(db.Model):
    __tablename__ = "membership"
    id = db.Column(db.String, primary_key=True)

    member_id = db.Column(db.String, db.ForeignKey("member.id"), nullable=False)

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
    expected_payment_amount = Column(db.Integer, default=0, nullable=False)

    description = Column(db.String(50), default="Membership")

    # Next Billing Cycle
    next_billing_date = Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )
    billing_frequency = Column(db.String(50), default="weekly")

    # Frozen Membership
    frozen = Column(db.Boolean, default=False)

    # State of membership
    state = Column(db.String, default="not-active")
    billingType = Column(db.String(50))

    # Invoices
    membership_invoices = db.relationship(
        "MembershipInvoice", backref=db.backref("membership_invoice", lazy=True)
    )
    # subscription_stripe_id
    # Child
    def __init__(self, data, customer_query):
        """
        =========================================
        Set the Weekly Price here!
        Make sure it is the same as the price for a week's membership on Stripe!
        vvvvvvvvvvvvvvvvvvvv
        =========================================
        """
        week_price = 1
        """
        =========================================
        Set week price above ^^^
        =========================================
        """
        self.id = uuid.uuid1()
        self.member_id = data["customer"]["id"]
        self.created = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.start_date = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.description = data["membership_description"]  #: "ie. 3 Month Membership",

        # ====================================================
        # Figure out members
        # ====================================================
        duration = data["membership_duration"]  #: 1,
        duration_unit = data["membership_duration_unit"]  #: "week",
        # ===================================================
        self.start_date = datetime.datetime.now(timezone("Pacific/Auckland"))

        if duration_unit == "day":
            self.end_date = self.start_date + timedelta(days=duration)
        if duration_unit == "week":
            self.end_date = self.start_date + timedelta(days=7 * duration)
        elif duration_unit == "month":
            self.end_date = self.start_date + timedelta(days=28 * duration)
        else:
            return "Invalid duration unit"
        price_dict = {
            "membership_1_week": "price_1I3GtvKmFH2KDX0VTUHB2pGH",
            "membership_2_week": "price_1I4OJqKmFH2KDX0VLM6wPlfD",
        }
        if data["billing_frequency"] == "fortnightly":
            number_weeks = duration // 2
            self.paid = week_price * 2
            billing_frequency = 14
            price_choice = price_dict["membership_2_week"]
        elif data["billing_frequency"] == "weekly":
            number_weeks = duration
            self.paid = week_price
            billing_frequency = 7
            price_choice = price_dict["membership_2_week"]
        else:
            raise Exception("Invalid billing frequency")

        self.billing_frequency = data["billing_frequency"]
        self.expected_payment_amount = number_weeks * week_price
        self.billingType = data["paymentOption"]

        if data["paymentOption"] == "prepaidCash":
            self.paid = week_price * number_weeks
            self.expected_payment_amount = week_price * number_weeks
            self.next_billing_date = None
            invoice_description = "Invoice(Prepaid Full)"
            paid_amount = week_price * number_weeks
            expected_amount = week_price * number_weeks
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
            )
            self.membership_invoices.append(membership_invoice)
        elif data["paymentOption"] == "recurring":
            """
            Set current card as default
            """
            stripe.Customer.modify(
                customer_query.stripe_id, default_source=data["customer"]["card_id"]
            )
            self.paid = week_price
            self.expected_payment_amount = week_price * number_weeks
            # Generate all invoices...
            for invoice_num in range(0, number_weeks):
                """
                Create Stripe Invoice Here.
                """
                stripe_response = stripe.InvoiceItem.create(
                    customer=customer_query.stripe_id, price=price_choice
                )
                invoice = stripe.Invoice.create(
                    customer=customer_query.stripe_id,
                )
                if invoice_num == 0:
                    """
                    First Invoice
                    """
                    invoice_description = "Initial Invoice"
                    paid_amount = week_price
                    expected_amount = week_price
                    """
                    TODO: Check Errors thoroughly and test.
                    """
                    paid = stripe.Invoice.pay(invoice["id"])
                    invoice_status = "paid"
                else:
                    """
                    Subsequent Invoices
                    """
                    invoice_description = "Invoice {}".format(invoice_num + 1)
                    paid_amount = 0
                    expected_amount = week_price
                    invoice_status = "pending"

                stripe_invoice_id = invoice["id"]
                invoice_date = self.start_date + timedelta(
                    days=invoice_num * billing_frequency
                )

                membership_invoice = MembershipInvoice(
                    self.id,
                    customer_query.id,
                    stripe_invoice_id,
                    invoice_description,
                    expected_amount,
                    paid_amount,
                    invoice_date,
                    invoice_status,
                )
                db.session.add(membership_invoice)
            # If not paid full, then start figuring out billing...

            if self.billing_frequency == "fortnightly":
                self.next_billing_date = self.start_date + timedelta(days=14)
            elif self.billing_frequency == "weekly":
                self.next_billing_date = self.start_date + timedelta(days=7)
            else:
                raise Exception("Invalid duration unit")

    def __repr__(self):
        return "<Membership {}>".format(self.id)

    def freeze(self):
        self.frozen = True

    def unfreeze(self):
        self.frozen = False

    def next_bill(self):
        pass

    def is_active(self):
        return datetime.datetime.timestamp(self.end_date) > datetime.datetime.timestamp(
            datetime.datetime.now(timezone("Pacific/Auckland"))
        )

    def serialize(self, return_Member=False):
        if return_Member:
            member = Member.query.get(self.member_id).serialize()
        else:
            member = self.member_id
        membership_invoices = list(
            map(lambda x: x.serialize(), self.membership_invoices)
        )
        adjustments = list(
            map(
                lambda x: x.serialize(),
                MembershipAdjustment.query.filter(
                    MembershipAdjustment.membership_id == self.id
                ),
            )
        )
        return {
            "id": self.id,
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "active": datetime.datetime.timestamp(self.end_date)
            > datetime.datetime.timestamp(
                datetime.datetime.now(timezone("Pacific/Auckland"))
            ),
            "next_billing": self.next_billing_date.isoformat(),
            "description": self.description,
            "member": member,
            "invoices": membership_invoices,
            "billingType": self.billingType,
            "billingFrequency": self.billing_frequency,
            "frozen": self.frozen,
            "adjustments": adjustments,
        }

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
            }

        return list(map(lambda x: to_json(x), Membership.query.all()))


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


class User(db.Model):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    username = Column(String(50), nullable=False, unique=True)
    password = Column(String(200), nullable=False)
    userType = Column(String(50), default="staff", nullable=False)

    def __init__(self, username, password):
        self.id = uuid.uuid1()
        self.username = username
        self.set_password(password)
        self.userType = "staff"
        # User types:
        # Guest/Member/staff/admin

    def set_password(self, password):
        """Create hashed password."""
        self.password = generate_password_hash(password, method="sha256")

    def check_password(self, password):
        """Check hashed password."""
        return check_password_hash(self.password, password)

    def __repr__(self):
        return "<User {}>".format(self.username)

    @classmethod
    def return_all(cls):
        def to_json(x):
            return {
                "username": x.username,
                "userType": x.userType,
            }

        return {"users": list(map(lambda x: to_json(x), User.query.all()))}

    @classmethod
    def delete_all(cls):
        try:
            num_rows_deleted = db.session.query(cls).delete()
            db.session.commit()
            return {"message": "{} row(s) deleted".format(num_rows_deleted)}
        except:
            return {"message": "Something went wrong"}


class RevokedTokenModel(db.Model):
    __tablename__ = "revoked_tokens"
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(120))

    def add(self):
        db.session.add(self)
        db.session.commit()

    @classmethod
    def is_jti_blacklisted(cls, jti):
        query = cls.query.filter_by(jti=jti).first()
        return bool(query)


class MembershipInvoice(db.Model):
    __tablename__ = "membership_invoice"
    id = db.Column(db.String, primary_key=True)
    membership_id = db.Column(db.String, db.ForeignKey("membership.id"), nullable=False)
    member_id = db.Column(db.String, db.ForeignKey("member.id"), nullable=False)
    stripe_invoice_id = db.Column(db.String(50), nullable=True)
    description = db.Column(db.String(50), default="Invoice", nullable=False)

    expected_amount = db.Column(db.Float, nullable=False)
    paid_amount = db.Column(db.Float, nullable=False)

    invoice_date = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    status = db.Column(db.String(50), default="pending")

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
    ):
        self.id = uuid.uuid1()
        self.membership_id = membership_id
        self.member_id = member_id
        self.expected_amount = expected_amount
        self.paid_amount = paid_amount
        if stripe_invoice_id != None:
            self.stripe_invoice_id = stripe_invoice_id
        self.description = invoice_description
        self.invoice_date = invoice_date
        self.status = status

    def __repr__(self):
        return "<MembershipInvoice {}>".format(self.id)

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

    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), MembershipInvoice.query.all()))


class CheckIn(db.Model):
    __tablename__ = "checkin"
    id = db.Column(db.String, primary_key=True)

    # Checkin type = casual, consession, membership
    checkin_type = db.Column(db.String(50), default="casual", nullable=False)
    member_id = db.Column(db.String, db.ForeignKey("member.id"), nullable=True)
    checkin_date = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    def __init__(self, data, resource):
        self.id = uuid.uuid1()

    def __repr__(self):
        return "<CehckIn {}>".format(self.id)

    def serialize(self):
        return {
            "id": self.id,
        }

    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), CheckIn.query.all()))


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

    def __init__(self, data):
        self.id = uuid.uuid1()
        self.product_id = data["product_id"]
        self.notes = data["notes"]
        self.size = data["size"]
        self.price = data["price"]
        self.stock = data["stock"]
        self.color = data["color"]

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

    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), Restock.query.all()))


class Restock(db.Model):
    __tablename__ = "restock"
    id = db.Column(db.String, primary_key=True)

    # Checkin type = casual, consession, membership
    sub_product_id = db.Column(
        db.String, db.ForeignKey("sub_products.id"), nullable=False
    )

    restock_date = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    restock_amount = db.Column(db.Integer, default=0)

    note = db.Column(db.String, default=0)

    def __init__(self, data):
        self.id = uuid.uuid1()
        self.sub_product_id = data["sub_product_id"]
        self.restock_date = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.restock_amount = data["restock_amount"]
        self.note = data["note"]

    def __repr__(self):
        return "<Restock {}>".format(self.id)

    def serialize(self):
        return {
            "id": self.id,
            "restock_date": self.restock_date.isoformat(),
            "restock_amount": self.restock_amount,
            "note": self.note,
        }

    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), Restock.query.all()))


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
        # self.note = data["note"]

    def check_overdue(self, alert=False):
        if self.status == "outstanding":
            due_date_timestamp = datetime.datetime.timestamp(self.due_date)
            today_timestamp = datetime.datetime.timestamp(
                datetime.datetime.now(timezone("Pacific/Auckland"))
            )
            if today_timestamp > due_date_timestamp:
                self.status = "overdue"
                if alert == True:
                    alert = Alerts(
                        alert_type="Rental Overdue",
                        alert_level="2",
                        alert_message=f"Overdue Rental",
                        alert_status="unsolved",
                        member_associated_id=self.member_id,
                    )
                    db.session.add(alert)
                db.session.commit()

    def __repr__(self):
        return "<Rental {}>".format(self.id)

    def serialize(self):
        sub_product = SubProduct.query.get(self.sub_product_id)
        member = Member.query.get(self.member_id)
        if self.status == "outstanding":
            self.check_overdue(alert=True)
        return {
            "id": self.id,
            "member": member.serialize(),
            "sub_product": sub_product.serialize(),
            "rental_date": self.rental_date.isoformat(),
            "due_date": self.due_date.isoformat(),
            "status": self.status,
        }

    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), Rental.query.all()))

    @classmethod
    def alert_overdue(cls):
        return list(map(lambda x: x.check_overdue(alert=True), Rental.query.all()))


class MembershipAdjustment(db.Model):
    __tablename__ = "membership_adjustment"
    id = db.Column(db.String, primary_key=True)

    # Checkin type = casual, consession, membership
    membership_id = db.Column(db.String, db.ForeignKey("membership.id"), nullable=False)

    action_date = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    action_type = db.Column(db.String(50))

    new_start_date = db.Column(DateTime, nullable=True)

    new_end_date = db.Column(DateTime, nullable=True)

    note = db.Column(db.String, default="")

    # action_doer = db.Column(db.String,db.ForeignKey('user.id'))

    def __init__(self, data):
        self.id = uuid.uuid1()
        self.membership_id = data["membership_id"]

        self.action_type = data["action_type"]
        # self.action_doer = data["action_doer"]
        self.note = data["note"]

    def __repr__(self):
        return "<MembershipAdjustment {}>".format(self.id)

    def serialize(self):
        return {
            "id": self.id,
            "membership_id": self.membership_id,
            "action_type": self.action_type,
            "action_date": self.action_date.isoformat(),
            "note": self.note,
        }

    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), Restock.query.all()))


class Family(db.Model):
    __tablename__ = "family"
    id = db.Column(db.String, primary_key=True)

    # Checkin type = casual, consession, membership

    created = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    members = db.relationship("Member", backref=db.backref("member", lazy=True))

    def __init__(self):
        self.id = uuid.uuid1()

    def __repr__(self):
        return "<Family {}>".format(self.id)

    def serialize(self):
        members = list(map(lambda x: x.serialize(), self.members))
        return {"id": self.id, "members": members}

    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), Family.query.all()))


class Waiver(db.Model):
    __tablename__ = "waiver"
    id = db.Column(db.String, primary_key=True)

    # Checkin type = casual, consession, membership

    created = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    # The member it is signed for
    effective_member = db.Column(db.String, db.ForeignKey("member.id"), nullable=False)

    # The member which has signed the waiver
    signed_member = db.Column(db.String, db.ForeignKey("member.id"), nullable=False)

    signature = db.Column(db.String)
    # The member which has signed the waiver
    # waiver_link = db.Column(db.String)

    def __init__(self, data):
        self.id = uuid.uuid1()

    def __repr__(self):
        return "<Waiver {}>".format(self.id)

    def serialize(self):
        return {
            "id": self.id,
        }

    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), Waiver.query.all()))


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


class WaiverTempFetchLog(db.Model):
    __tablename__ = "waiver_temp_fetch_log"
    id = db.Column(db.String, primary_key=True)

    created = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )

    fetched_amount = db.Column(db.Integer, default=0)
    fetched_time = db.Column(db.Float, default=0.0)
    server_response = db.Column(String, default="failed")

    def __init__(self, fetched_amount, fetch_time, server_response):
        self.id = uuid.uuid1()
        self.fetched_amount = fetched_amount
        self.fetched_time = fetch_time
        self.server_response = server_response

    def __repr__(self):
        return "<WaiverTempFetchLog {}>".format(self.id)

    def serialize(self):
        return {
            "id": self.id,
            "log_date": self.created.isoformat(),
            "fetched_amount": self.fetched_amount,
            "fetched_time": round(self.fetched_time, 3),
            "server_response": self.server_response,
        }

    @classmethod
    def return_all(cls):
        return list(map(lambda x: x.serialize(), WaiverTempFetchLog.query.all()))


class Alerts(db.Model):
    __tablename__ = "alerts"
    id = db.Column(db.String, primary_key=True)

    created = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )
    alert_type = db.Column(String(50))
    alert_level = db.Column(Integer)
    alert_message = db.Column(String)
    alert_status = db.Column(String(50))
    member_associated_id = db.Column(String())

    def __init__(
        self, alert_type, alert_level, alert_message, alert_status, member_associated_id
    ):
        self.id = uuid.uuid1()
        self.created = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.alert_type = alert_type
        self.alert_level = alert_level
        self.alert_message = alert_message
        self.alert_status = alert_status
        self.member_associated_id = member_associated_id

    def __repr__(self):
        return "<Alert {}>".format(self.id)

    def serialize(self):
        return {
            "id": self.id,
            "created": self.created.isoformat(),
            "alert_type": self.alert_type,
            "alert_level": self.alert_level,
            "alert_message": self.alert_message,
            "alert_status": self.alert_status,
            "member_associated": self.member_associated_id,
        }

    @classmethod
    def return_all(cls):
        return list(
            map(
                lambda x: x.serialize(),
                Alerts.query.filter(Alerts.alert_status == "unsolved"),
            )
        )


class EmailTemplate(db.Model):
    __tablename__ = "alerts"
    id = db.Column(db.String, primary_key=True)

    created = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )
    last_edited = db.Column(
        DateTime, default=datetime.datetime.now(timezone("Pacific/Auckland"))
    )
    template_name = db.Column(String)
    template_content = db.Column(String)

    def __init__(self, template_name, template_content):
        self.id = uuid.uuid1()
        self.created = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.last_edited = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.template_name = template_name
        self.template_content = template_content

    def update_content(self, template_content):
        self.last_edited = datetime.datetime.now(timezone("Pacific/Auckland"))
        self.template_content = template_content

    def __repr__(self):
        return "<Alert {}>".format(self.id)

    def serialize(self):
        return {
            "id": self.id,
            "created": self.created.isoformat(),
            "last_edited": self.last_edited.isoformat(),
            "template_name": self.template_name,
            "template_content": self.template_content,
        }

    @classmethod
    def return_all(cls):
        return list(
            map(
                lambda x: x.serialize(),
                Alerts.query.filter(Alerts.alert_status == "unsolved"),
            )
        )
