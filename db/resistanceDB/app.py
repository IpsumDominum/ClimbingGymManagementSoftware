import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_jwt_extended import JWTManager
from flask_restful import Api
from flask_cors import CORS
import json
from flask_mail import Mail
from models import *
from resources.paxton_api import PaxtonDoorControl
import stripe
import datetime
from pytz import timezone


last_checked = [None]
with open("./config.json") as config_file:
    config = json.load(config_file)

stripe.api_key = config["STRIPE_API_KEY"]

"""CONFIG"""
mail_queue = [
    {"status": "waiting", "cancel": True},
    {"status": "waiting", "cancel": True},
]

import logging
log = logging.getLogger("werkzeug")                    
log.setLevel(logging.ERROR)

app = Flask(__name__)

app.config.from_object(config.get("APP_SETTINGS"))
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "jwt-secret-string"

app.config["JWT_BLACKLIST_ENABLED"] = True
app.config["JWT_BLACKLIST_TOKEN_CHECKS"] = ["access", "refresh"]

jwt = JWTManager(app)

db = SQLAlchemy(app)
api = Api(app)
mail = Mail(app)
paxton_api = PaxtonDoorControl()

api_key = config["MAILCHIMP_API_KEY"]

from mailchimp_marketing import Client

mailchimp_api = Client()
mailchimp_api.set_config({"api_key": api_key, "server": "us1"})
# app.extensions['mail'].debug = 0
@app.before_first_request
def create_tables():
    db.create_all()
    if os.path.isfile("db_created.txt"):
        pass
    else:
        from resources.on_db_init import (
            product_creation_on_db_init,
            user_on_db_init,
            email_templates_on_db_init,
        )

        product_creation_on_db_init()
        email_templates_on_db_init()
        user_on_db_init()
        with open("db_created.txt", "w") as file:
            file.write("Created...")


"""
@jwt.token_in_blacklist_loader
def check_if_token_in_blacklist(decrypted_token):
    jti = decrypted_token['jti']
    return models.RevokedTokenModel.is_jti_blacklisted(jti)
"""
from models.alerts import Alerts
from models.checkin import CheckIn
from models.emailTemplate import EmailTemplate
from models.family import Family
from models.membership import Membership
from models.membershipAdjustment import MembershipAdjustment
from models.membershipInvoice import MembershipInvoice
from models.paymentMethods import PaymentMethod
from models.product import Product
from models.rental import Rental
from models.restock import Restock
from models.sale import Sales
from models.subproduct import SubProduct
from models.user import User
from models.waiver import Waiver
from models.waiverTemp import WaiverTemp
from models.waiverTempFetchLog import WaiverTempFetchLog
from models.member import Member
import views, resources.product, resources.user, resources.sale, resources.member, resources.membership, resources.paymentMethod, resources.stripe, resources.membershipInvoice, resources.invoices, resources.waiver, resources.family, resources.email, resources.checkin, resources.recurring, resources.rentals, resources.alerts, resources.Image, resources.paxtonCard,resources.system,resources.eftpos
"""
for item in SubProduct.query.all():
    if(item.rented!=0):
        item.rented = 0
db.session.commit()
"""
"""
from datetime import timedelta
today = datetime.datetime.now(timezone("Pacific/Auckland"))
Member.query.filter(Member.middleName=='Yuuki').first().memberships[0].end_date = today + timedelta(days=-1)
db.session.commit()
"""

api.add_resource(resources.user.UserRegistration, "/signup")
api.add_resource(resources.user.UserLogin, "/signin")
api.add_resource(resources.user.UserLogoutAccess, "/logout/access")
api.add_resource(resources.user.UserLogoutRefresh, "/logout/refresh")
api.add_resource(resources.user.TokenRefresh, "/token/refresh")
# ========================================================
api.add_resource(resources.product.ProductResource, "/Product")
api.add_resource(resources.product.ProductEdit, "/Product/Edit")
api.add_resource(resources.product.ProductAll, "/Product/All")
api.add_resource(resources.product.ProductReportAllStock, "/Product/ReportAllStock")
# ========================================================
api.add_resource(resources.paxtonCard.PaxtonCardResource, "/Paxton/Card")
# ========================================================
api.add_resource(resources.product.SubProductResource, "/SubProduct")
api.add_resource(resources.product.SubProductEdit, "/SubProduct/Edit")
# ========================================================
api.add_resource(resources.product.RestockResource, "/Restock")
# ========================================================
api.add_resource(resources.checkin.CheckinResource, "/Checkin")
api.add_resource(resources.checkin.CheckinGetAll, "/Checkin/GetAll")
api.add_resource(
    resources.checkin.getCheckinHistoryByMember, "/GetCheckinHistoryByMember"
)
# ========================================================
api.add_resource(resources.alerts.AlertsResource, "/Alerts")
# ========================================================
api.add_resource(resources.recurring.CheckDaily, "/CheckDaily")
# api.add_resource(resources.recurring.CheckRentalsDue, "/CheckRentalsDue")
# ========================================================s
api.add_resource(resources.sale.SaleResource, "/Sale")
api.add_resource(resources.sale.SaleGetByMember, "/Sale/GetByMember")
api.add_resource(resources.sale.SaleAll, "/Sale/All")
api.add_resource(resources.sale.SaleSearch, "/Sale/Search")
api.add_resource(resources.sale.SaleEdit, "/Sale/Edit")
api.add_resource(resources.sale.SaleDelete, "/Sale/Delete")
# ========================================================
api.add_resource(resources.invoices.InvoicesAll, "/Invoices/All")
api.add_resource(resources.invoices.InvoicesByUser, "/Invoices/ByUser")
api.add_resource(resources.invoices.InvoicesSearch, "/Invoices/Search")
# ========================================================
api.add_resource(resources.paymentMethod.PaymentMethodResource, "/PaymentMethod")
api.add_resource(resources.paymentMethod.PaymentMethodAll, "/PaymentMethod/All")
# ========================================================
api.add_resource(resources.member.MemberResource, "/Member")
api.add_resource(resources.member.MemberUpdateWaiver, "/Member/UpdateWaiver")
api.add_resource(resources.member.MemberAll, "/Member/All")
api.add_resource(resources.member.MemberEdit, "/Member/Edit")
api.add_resource(resources.member.MemberSearch, "/Member/Search")
# ========================================================
api.add_resource(resources.system.SystemChecksResource, "/System/SystemChecks")
api.add_resource(resources.system.SystemLogsResource, "/System/SystemLogs")
# ========================================================
api.add_resource(resources.membership.MembershipResource, "/Membership")
api.add_resource(resources.membership.MembershipAll, "/Membership/All")
api.add_resource(resources.membership.MembershipSearch, "/Membership/Search")
api.add_resource(
    resources.membership.MembershipAdjustmentResource, "/Membership/Adjustment"
)
api.add_resource(resources.membership.MembershipFreeze, "/Membership/Freeze")
api.add_resource(resources.membership.MembershipFreezeAll, "/Membership/FreezeAll")
api.add_resource(resources.membership.MembershipHoliday, "/Membership/Holiday")
api.add_resource(resources.membership.MembershipHolidayAll, "/Membership/HolidayAll")
# ========================================================
api.add_resource(
    resources.membershipInvoice.MembershipInvoiceResource, "/MembershipInvoice"
)
api.add_resource(
    resources.membershipInvoice.MembershipInvoiceAll, "/MembershipInvoice/All"
)
# ========================================================
api.add_resource(resources.waiver.WaiverTempResource, "/WaiverTemp")
api.add_resource(
    resources.waiver.WaiverTempFetchFromStation, "/WaiverTempFetchFromStation"
)
api.add_resource(resources.waiver.WaiverTempFetchLogResource, "/WaiverTempFetchLog")
# ========================================================
api.add_resource(resources.family.FamilyResource, "/Family")
# ========================================================
api.add_resource(resources.rentals.RentalAll, "/Rental/All")
api.add_resource(resources.rentals.RentalGetByMember, "/Rental/GetByMember")
api.add_resource(resources.rentals.RentalGetBySubProduct, "/Rental/GetBySubProduct")
api.add_resource(resources.rentals.RentalMarkAsReturned, "/Rental/MarkAsReturned")
api.add_resource(resources.rentals.RentalMarkAsLost, "/Rental/MarkAsLost")
api.add_resource(resources.rentals.RentalMarkAsDamaged, "/Rental/MarkAsDamaged")
# ========================================================
api.add_resource(resources.email.EmailResource, "/Email")
api.add_resource(resources.email.EmailGetQueue, "/Email/MailQueue")
api.add_resource(resources.email.EmailSendFromTemplate, "/Email/SendFromTemplate")
api.add_resource(resources.email.EmailEditTemplate, "/Email/EditTemplate")
# ========================================================
api.add_resource(resources.Image.ImageResource, "/Image")
# ========================================================
api.add_resource(resources.eftpos.EftposResource,"/EFTPOS")
# ========================================================
api.add_resource(resources.user.SecretResource, "/secret")
# ========================================================
api.add_resource(resources.stripe.StripeWebHooks, "/Stripe/Webhooks")

CORS(app)


import time
import atexit
from apscheduler.schedulers.background import BackgroundScheduler
from resources.recurring import call_recurring
from resources.waiver import fetch_waivers_from_station
#call_recurring()
# today = datetime.datetime.now(timezone("Pacific/Auckland"))
# print(today)
print("scheduler")
# Call Every day, or every hour? (Maybe every hour instead???)
scheduler = BackgroundScheduler()
scheduler.add_job(fetch_waivers_from_station,'interval', minutes=5)
"""
scheduler.add_job(
    func=fetch_waivers_from_station,
    timezone=timezone("Pacific/Auckland"),
    trigger="cron",
    hour="*",
    minute="5",
    second="0",
    jitter=5,
)
"""
scheduler.start()

#for invoice in MembershipInvoice.query.all():
    
print("scheduler started")
# Shut down the scheduler when exiting the app
atexit.register(lambda: scheduler.shutdown())

import time
from tqdm import tqdm

#import pandas as pd
#df = pd.DataFrame.from_dict(dup_people,orient="index",columns=["firstName","lastName","invoiceDate"])
#df.to_csv("duplicate.csv")
#ms = Membership.query.filter(Membership.member_id==m.id).all()
#mi = MembershipInvoice.query.filter(MembershipInvoice.member_id==m.id).all()
"""
from models.system import SystemLog
customer_query = Member.query.all()[0]
e = "1"
log = SystemLog("Error::{} testing error | test associated member is {} {}".format(str(e),customer_query.firstName,customer_query.lastName),log_status="error",log_level="3")
db.session.add(log)
db.session.commit()
from models.subproduct import SubProduct
for r in SubProduct.query.all():
    r.rented = 0
db.session.commit()
from models.emailTemplate import EmailTemplate
email_root_dir = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "email_templates"
)
data =  {
"template_name": "Invoice Retry Successful",
"template_header": "Your membership is no longer frozen.",
"template_content": os.path.join(email_root_dir, "invoice_retry_successful.html"),
"template_description": "Sent on membership invoice retry success, can be toggled on or off.",
}
template = EmailTemplate(
            data["template_name"],
            data["template_header"],
            open(data["template_content"]).read(),
            data["template_description"],
)
db.session.add(template)
print("done.")
print("commiting to database")
db.session.commit(
add = ""
for membership in Membership.query.all():
    pending_num = 0
    for invoice in membership.membership_invoices:
        if(invoice.status=="pending"):
            pending_num +=1
    if((membership.billing_frequency =="fortnightly" and pending_num >=2)
        or (membership.billing_frequency=="weekly" and pending_num >=4)):
        add +=membership.member.firstName + " " + membership.member.lastName + "\n"
with open ('add.text',"w") as file:
    file.write(add)
for invoice in MembershipInvoice.query.all():
    date_string = "09/07/2021"
    stamp_date_date_only = datetime.datetime.strptime(date_string,"%m/%d/%Y")
    start_date = invoice.invoice_date
    date_string = "{}/{}/{}".format(start_date.month,start_date.day,start_date.year)
    date_date_only = datetime.datetime.strptime(date_string,"%m/%d/%Y")
    if(datetime.datetime.timestamp(date_date_only)
    ==datetime.datetime.timestamp(stamp_date_date_only)
    ):
        invoice.status = "paid"
db.session.commit()
"""

from pynput import keyboard
import requests


buffer_string = ""
expecting = False

def get_expecting():
    global expecting
    return expecting
    try:
        with open("expecting", "r") as file:
            return bool(file.read())
    except FileNotFoundError:
        return False


def set_expecting(val):
    global expecting
    expecting = val
    return
    with open("expecting", "w") as file:
        file.write(str(expecting))


def get_buffer():
    global buffer_string
    return buffer_string
    try:
        with open("buffer", "r") as file:
            return file.read()
    except FileNotFoundError:
        return ""


def append_buffer(buffer):
    global buffer_string
    buffer_string += buffer
    return
    with open("buffer", "a") as file:
        print(buffer)
        file.write(buffer)


def set_buffer(buffer):
    global buffer_string
    buffer_string = buffer
    return
    with open("buffer", "w") as file:
        file.write(buffer)


def on_press(key):
    try:
        if get_expecting() == True and key.char == None: 
            try:
                append_buffer(chr(int(str(key)[1:-1]) - 48))
            except UnicodeEncodeError:
                pass
            except ValueError:
                pass
        elif key.char == None:
            try:                
                append_buffer(chr(int(str(key)[1:-1]) - 48))
                set_expecting(True)
            except UnicodeEncodeError:
                pass
            except ValueError:
                pass
        # print('alphanumeric key {0} pressed'.format(
        #    key.char))
    except AttributeError:
        try:
            if(str(key)!="Key.enter"):
                return
            if get_expecting() == True:                
                code = get_buffer()
                resources.checkin.check_in_paxton_id(code)
                set_expecting(False)
                set_buffer("")
        except Exception as e:
            set_expecting(False)
            set_buffer("")
        # print('special key {0} pressed'.format(
        #    key))


listener = keyboard.Listener(on_press=on_press)
listener.start()
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
