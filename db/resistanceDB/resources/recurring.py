from flask_restful import Resource, reqparse
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    jwt_refresh_token_required,
    get_jwt_identity,
    get_raw_jwt,
)
import models
import os
from flask import Flask, request, jsonify
from app import db, last_checked
from sqlalchemy import or_
from models.rental import Rental
from models.membership import Membership
from models.membershipInvoice import MembershipInvoice
from models.member import Member
import datetime
from pytz import timezone
import time
from models.system import SystemLog,SystemChecks
from tqdm import tqdm

"""
# Calls every minute
class CheckRentalsDue(Resource):
    def get(self):
        # For all the rentals, if there is a rental which is due, alert out
        Rental.alert_overdue()
        return "success"

#Calls Every day
class CheckMembershipsDue(Resource):
    def get(self):
        #If membership due, email membership expired...
        print("memberships due")
        today = datetime.datetime.now(timezone("Pacific/Auckland"))
        print(today)

#Calls Every day
class CheckMembershipsFreeze(Resource):
    def get(self):
        print("membership freeze due")
        today = datetime.datetime.now(timezone("Pacific/Auckland"))
        print(today)

#Calls Every day
class CheckMembershipsHoliday(Resource):
    def get(self):
        print("checkmembership holiday")
        today = datetime.datetime.now(timezone("Pacific/Auckland"))
        print(today)
        #If membership holiday > today: membership.terminate_holiday()
"""

checking = False
class CheckDaily(Resource):
    def get(self):
        global checking #temporary solution...
        print(checking)
        if(checking==False):
            checking = True 
            call_recurring()
            checking = False
            return {"response":"success"}
        else:
            return {"response":"Already performing daily check..."}
    def post(self):
        global recurring_progress
        global recurring_progress_samophore
        while(recurring_progress_samophore<=0):
            pass
        recurring_progress_samophore -=1
        to_return = recurring_progress
        recurring_progress_samophore +=1        
        return {"response":"success","recurring_progress":to_return}

# timezone("Pacific/Auckland")
# Calls Every day
def getsimple(datetime_object):
    return f"{datetime_object.year}-{datetime_object.month}-{datetime_object.day}"

def set_recurring_progress(amount):
    global recurring_progress
    global recurring_progress_samophore
    
    while(recurring_progress_samophore<=0):
        print("alll")
        pass
    recurring_progress_samophore -=1
    recurring_progress = amount
    recurring_progress_samophore +=1

recurring_progress = 0
recurring_progress_samophore = 1


def call_recurring(): 
    start = time.time()
    today = datetime.datetime.now(timezone("Pacific/Auckland"))
    print("performing daily check for {}-{}-{}...".format(today.year,today.month,today.day))

    save_dir = os.path.join("C:\\Users\\duned\\Desktop\\Logs", str(today.year), str(today.month))

    set_recurring_progress(2)

    if not os.path.isdir(save_dir):
        os.makedirs(save_dir)
    set_recurring_progress(3)
    """
    check_file = os.path.join(
            save_dir,
            "Daily-Check-{}-{}-{}.log".format(today.year, today.month, today.day),
        )

    if(os.path.isfile(check_file)):
        print("daily check for {}-{}-{} is already done.".format(today.year,today.month,today.day))
        return
    """
    """
    if last_checked[0] == None:
        last_checked[0] = today
    elif getsimple(last_checked[0]) != getsimple(today):
        last_checked[0] = today
    else:
        return
    """
    print(today)
    print("checking...")
    set_recurring_progress(5)
    print("check memberships stuff...")
    membership_checks = Membership.perform_daily_check(today)
    db.session.commit()
    set_recurring_progress(25)
    print("check rentals due...")
    rental_checks = Rental.perform_daily_check(today)
    db.session.commit()
    set_recurring_progress(45)
    print("check member birthdays")
    member_checks = Member.perform_daily_check(today)
    db.session.commit()
    set_recurring_progress(55)
    print("check invoices Due")
    membership_invoice_checks = MembershipInvoice.perform_daily_check(today)
    db.session.commit()
    set_recurring_progress(85)
    # Get all the invoices which are due before today
    # If Invoice on holiday, postpone to next day
    # If Invoice is pending - Try completing it
    # If fails, alert, and carries failed payment to next
    # invoice, then email: failed invoice
    # Otherwise email: Successful invoice
    
    error_amount = 0
    for response in membership_checks + rental_checks + member_checks + membership_invoice_checks:
        if(response!=None):
            error_amount +=response
    
    print("done...")
    print("took " +str(time.time()-start) + " seconds\n")
    """
    Deprecated
    """        

    
    a = time.time()
    dup_amount = 0
    dup_people = {}
    print("Checking for duplicate invoices...")
    for idx,membership in tqdm(enumerate(Membership.query.all())):
        dup_ids = []
        for inv in membership.membership_invoices:
            if(inv.id in dup_ids):
                continue
            for inv_other in membership.membership_invoices:
                if(inv_other.id!=inv.id and datetime.datetime.timestamp(inv_other.invoice_date) ==datetime.datetime.timestamp(inv.invoice_date)):
                    #print("dup")
                    if(inv_other.status!="void" and inv.status!="void"):
                        if("duplicate_" not in inv_other.status):
                            dup_amount +=1
                            #error_amount +=1
                            customer_query = membership.member
                            log = SystemLog("Warning::duplicate invoice found but handled. Associated member is {} {}".format(customer_query.firstName,customer_query.lastName),log_status="warning",log_level="2")
                            db.session.add(log)
                            db.session.commit()
                        inv_other.status="duplicate_"+inv_other.status.replace("duplicate_","")
                    if(inv.status=="paid" or inv_other.status=="paid"):
                        dup_people[idx] = [membership.member.firstName,membership.member.lastName,inv.invoice_date]
                    dup_ids.append(inv_other.id)
    
    if(dup_amount==0):
        log = SystemLog("Duplicate invoice check passed. No duplicate invoices found.",log_status="normal",log_level="1")
        db.session.add(log)
        db.session.commit()
    else:
        log = SystemLog("Warning::Duplicate invoice check found {} duplicate invoices. But they are handled...".format(dup_amount),log_status="warning",log_level="2")
        db.session.add(log)
        db.session.commit()

    print("took {}".format(time.time()-a))
    print("found {} duplicate invoices".format(dup_amount))
    save_dir = os.path.join("C:\\Users\\duned\\Desktop\\Logs", str(today.year), str(today.month))
    if not os.path.isdir(save_dir):
        os.makedirs(save_dir)
    with open(
        os.path.join(
            save_dir,
            "Daily-Check-{}-{}-{}.log".format(today.year, today.month, today.day),
        ),
        "w",
    ) as file:
        file.write("took " +str(time.time()-start) + " seconds\n")
    set_recurring_progress(100)
    
    s = SystemChecks(error_amount=error_amount,time_taken=int(time.time()-start))
    db.session.add(s)
    db.session.commit()
    set_recurring_progress(0)
    

