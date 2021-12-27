from models.product import Product
from models.user import User
from models.emailTemplate import EmailTemplate
import os
from app import db


def product_creation_on_db_init():
    casual_pass_adult = {
        "vendor": "Resistance Gym",
        "notes": "",
        "size": "",
        "color": "",
        "name": "Causal Pass Adult",
        "name_unchangeable": "casual_pass_adult",
        "productType": "Casual",
        "allow_anonymous_sale": False,
        "waiver_required": True,
        "age_restriction": 0,
        "stock": -1,
        "price": 1,
    }
    casual_pass_young_adult = {
        "vendor": "Resistance Gym",
        "notes": "",
        "size": "",
        "color": "",
        "name": "Causal Pass Young Adult",
        "name_unchangeable": "casual_pass_young_adult",
        "productType": "Casual",
        "allow_anonymous_sale": False,
        "waiver_required": True,
        "age_restriction": 0,
        "stock": -1,
        "price": 1,
    }

    casual_pass_child = {
        "vendor": "Resistance Gym",
        "notes": "",
        "size": "",
        "color": "",
        "name": "Causal Pass Child",
        "name_unchangeable": "casual_pass_child",
        "productType": "Casual",
        "allow_anonymous_sale": False,
        "waiver_required": True,
        "age_restriction": 0,
        "stock": -1,
        "price": 1,
    }
    casual_pass_group = {
        "vendor": "Resistance Gym",
        "notes": "",
        "size": "",
        "color": "",
        "name": "Causal Pass Group",
        "name_unchangeable": "casual_pass_group",
        "productType": "Casual",
        "allow_anonymous_sale": False,
        "waiver_required": True,
        "age_restriction": 0,
        "stock": -1,
        "price": 10,
    }

    consession_pass_adult = {
        "vendor": "Resistance Gym",
        "notes": "",
        "size": "",
        "color": "",
        "name": "Concession Pass Adult",
        "name_unchangeable": "concession_pass_adult",
        "productType": "Concession",
        "allow_anonymous_sale": False,
        "waiver_required": True,
        "age_restriction": 0,
        "stock": -1,
        "price": 1,
    }
    consession_pass_young_adult = {
        "vendor": "Resistance Gym",
        "notes": "",
        "size": "",
        "color": "",
        "name": "Concession Pass Young Adult",
        "name_unchangeable": "concession_pass_young_adult",
        "productType": "Concession",
        "allow_anonymous_sale": False,
        "waiver_required": True,
        "age_restriction": 0,
        "stock": -1,
        "price": 1,
    }

    consession_pass_child = {
        "vendor": "Resistance Gym",
        "notes": "",
        "size": "",
        "color": "",
        "name": "Concession Pass Child",
        "name_unchangeable": "concession_pass_child",
        "productType": "Concession",
        "allow_anonymous_sale": False,
        "waiver_required": True,
        "age_restriction": 0,
        "stock": -1,
        "price": 25,
    }

    membership_child = {
        "vendor": "Resistance Gym",
        "notes": "",
        "size": "",
        "color": "",
        "name": "Membership Child",
        "name_unchangeable": "membership_child",
        "stripe_product_id": "prod_Iea4X7XfIXBtM0",
        "stripe_price_id": "price_1I3GtvKmFH2KDX0VTUHB2pGH",
        "productType": "Membership",
        "allow_anonymous_sale": False,
        "waiver_required": True,
        "age_restriction": 0,
        "stock": -1,
        "price": 1,
    }
    membership_young_adult = {
        "vendor": "Resistance Gym",
        "notes": "",
        "size": "",
        "color": "",
        "name": "Membership Young Adult",
        "name_unchangeable": "membership_young_adult",
        "stripe_product_id": "prod_IYruIwWr1TcnLE",
        "stripe_price_id": "price_1HxkB0KmFH2KDX0Vnx913bm0",
        "productType": "Membership",
        "allow_anonymous_sale": False,
        "waiver_required": True,
        "age_restriction": 0,
        "stock": -1,
        "price": 1,
    }
    membership_adult = {
        "vendor": "Resistance Gym",
        "notes": "",
        "size": "",
        "color": "",
        "name": "Membership Adult",
        "name_unchangeable": "membership_adult",
        "productType": "Membership",
        "stripe_product_id": "prod_IY3BhTlFklwZre",
        "stripe_price_id": "price_1Hwx4lKmFH2KDX0V6PaPAm1D",
        "allow_anonymous_sale": False,
        "waiver_required": True,
        "age_restriction": 0,
        "stock": -1,
        "price": 1,
    }

    print("Adding Default Products...")
    product_1 = Product(casual_pass_adult, True)
    product_2 = Product(casual_pass_young_adult, True)
    product_3 = Product(casual_pass_child, True)
    product_4 = Product(consession_pass_adult, True)
    product_5 = Product(consession_pass_young_adult, True)
    product_6 = Product(consession_pass_child, True)
    product_7 = Product(membership_child, True)
    product_8 = Product(membership_young_adult, True)
    product_9 = Product(membership_adult, True)
    product_10 = Product(casual_pass_group, True)
    db.session.add(product_1)
    db.session.add(product_2)
    db.session.add(product_3)
    db.session.add(product_10)
    db.session.add(product_4)
    db.session.add(product_5)
    db.session.add(product_6)
    db.session.add(product_7)
    db.session.add(product_8)
    db.session.add(product_9)

    print("commiting to database...")
    db.session.commit()
    print("done.")


def email_templates_on_db_init():
    email_root_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", "email_templates"
    )

    templates = [
        {
            "template_name": "Membership Frozen",
            "template_header": "Membership Frozen",
            "template_content": os.path.join(email_root_dir, "membership_frozen.html"),
            "template_description": "Sent on membership frozen, can be toggled on or off.",
        },
        {
            "template_name": "Membership UnFreezed",
            "template_header": "Membership UnFreezed",
            "template_content": os.path.join(
                email_root_dir, "membership_unfrozen.html"
            ),
            "template_description": "Sent on membership unfrozen, can be toggled on or off.",
        },
        {
            "template_name": "Membership Holiday",
            "template_header": "Membership Holiday",
            "template_content": os.path.join(email_root_dir, "membership_holiday.html"),
            "template_description": "Sent on membership holiday started, can be toggled on or off.",
        },
        {
            "template_name": "Membership Holiday Terminated",
            "template_header": "Membership Holiday Terminated",
            "template_content": os.path.join(
                email_root_dir, "membership_holiday_terminated.html"
            ),
            "template_description": "Sent on membership holiday terminated, can be toggled on or off.",
        },
        {
            "template_name": "Rental Due",
            "template_header": "Your Rental Item Is Due",
            "template_content": os.path.join(email_root_dir, "rental_due.html"),
            "template_description": "Sent on member rental due.",
        },
        {
            "template_name": "Membership Birthday",
            "template_header": "Happy Birthday From Resistance Climbing Gym!",
            "template_content": os.path.join(email_root_dir, "member_birthday.html"),
            "template_description": "Sent on member birthday, can be toggled on or off.",
        },
        {
            "template_name": "Membership Created",
            "template_header": "Your Membership has just began!",
            "template_content": os.path.join(email_root_dir, "membership_created.html"),
            "template_description": "Sent on membership creation, can be toggled on or off.",
        },
        {
            "template_name": "Membership Canceled",
            "template_header": "Your Membership has been canceled!",
            "template_content": os.path.join(
                email_root_dir, "membership_canceled.html"
            ),
            "template_description": "Sent on membership cancellation, can be toggled on or off.",
        },
        {
            "template_name": "Membership Expired",
            "template_header": "Your Membership has expired!",
            "template_content": os.path.join(email_root_dir, "membership_created.html"),
            "template_description": "Sent on membership expiry, can be toggled on or off.",
        },
        {
            "template_name": "Invoice Payment Successful",
            "template_header": "Invoice Receipt From Resistance Climbing Gym",
            "template_content": os.path.join(email_root_dir, "invoice_successful.html"),
            "template_description": "Sent on membership invoice payment successful, can be toggled on or off.",
        },
        {
            "template_name": "Invoice Payment Failed",
            "template_header": "Invoice Failed for Resistance Climbing Gym Membership",
            "template_content": os.path.join(email_root_dir, "invoice_failed.html"),
            "template_description": "Sent on membership invoice payment failure, can be toggled on or off.",
        },
    ]
    print("Adding templats...")
    for data in templates:
        print("adding " + data["template_name"])
        template = EmailTemplate(
            data["template_name"],
            data["template_header"],
            open(data["template_content"]).read(),
            data["template_description"],
        )
        db.session.add(template)
        print("done.")
    print("commiting to database")
    db.session.commit()
    print("done.")


def user_on_db_init():
    username = "admin"
    password = "admin"
    user = User(username=username, password=password)
    userFound = User.query.filter_by(username=username).first()
    if userFound == None:
        # make a call to the model to authenticate
        db.session.add(user)
        db.session.commit()
    else:
        pass
