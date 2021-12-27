from flask_restful import Resource, reqparse
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    jwt_refresh_token_required,
    get_jwt_identity,
    get_raw_jwt,
)
import pandas as pd
import models
from flask import Flask, request, jsonify
from app import db, paxton_api
from sqlalchemy import or_
import datetime
from datetime import timedelta
from pytz import timezone
from models.member import Member
from models.membershipAdjustment import MembershipAdjustment
from models.membership import Membership
from sqlalchemy import func
from resources.emailFromTemplate import emailFromTemplate
from models.alerts import Alerts
from models.emailTemplate import EmailTemplate
from models.membershipInvoice import MembershipInvoice
import calendar

# Membership
class MembershipResource(Resource):
    # @jwt_required
    def get(self):
        data = request.get_json()
        query_id = data["id"]
        return Membership.query.get(query_id).serialize()

    """
    Data Expected:
    @members [] - a list of members
        #member: 
            @id - member's id
            @
    """
    # @jwt_required
    def post(self):
        data = request.get_json()

        """
        Check if anyone's membership is already active. If so, don't allow any to be created.
        """
        customer_query = Member.query.get(data["customer"]["id"])

        """
        Check if membership is already active
        """
        if customer_query.is_active():
            # If active then extend...
            currentMembership = list(
                filter(lambda x: x.is_active() == True, customer_query.memberships)
            )[0]
            if currentMembership.membership_auto_renew == True:
                return {
                    "response": "Warning::Membership Auto Renew cannot be extended."
                }

            if data["paymentOption"] == "prepaidCash":
                duration = data["membership_duration"]
                duration_unit = data["membership_duration_unit"]
                if duration_unit == "week":
                    currentMembership.end_date = currentMembership.end_date + timedelta(
                        days=7 * duration
                    )
                elif duration_unit == "month":
                    remainder = ((currentMembership.end_date.month + duration) % 12) +1
                    dividend = (currentMembership.end_date.month + duration) // 12
                    try:
                        currentMembership.end_date = currentMembership.end_date.replace(
                            month=remainder,
                            year=currentMembership.end_date.year + dividend,
                        )
                    except ValueError:
                        last_day_of_month = calendar.monthrange(
                            currentMembership.end_date.year + dividend, remainder +1
                        )[1]
                        currentMembership.end_date = currentMembership.end_date.replace(
                            day=last_day_of_month,
                            month=remainder,
                            year=currentMembership.end_date.year + dividend,
                        )
                else:
                    return "Invalid duration unit"
                action_type = "extend membership"
                adjustment = MembershipAdjustment(
                    {
                        "membership_id": currentMembership.id,
                        "action_type": action_type,
                        "note": "Extend by "
                        + str(data["membership_duration"])
                        + " week(s)",
                    }
                )
                db.session.add(adjustment)
                db.session.commit()
                return {"response": "success"}
            else:
                # Generate Invoices for the next month...
                return {
                    "response": "Error::Membership Creation Failed: invalid payment option."
                }
        """
        Proceed...
        """
        # TODO: Catch errors
        # try:
        
        if data["paymentOption"] == "recurring":
            if customer_query.stripe_id == "":
                # If customer's stipre customer isn't set up previously,
                # Attempt again
                try:
                    stripe_customer = stripe.Customer.create(
                        name=data["firstName"] + data["lastName"]
                    )
                    customer_query.set_stripe_customer(stripe_customer)
                    db.session.commit()
                except Exception as e:
                    # If fails once more...
                    return {
                        "response": "Error::Unable to set up stripe customer::" + str(e)
                    }
        try:
            membership = Membership(data, customer_query)
            db.session.add(membership)
        except Exception as e:
            return {"response": "Error::" + str(e)}

        #Try to give permission
        membership.assign_permission_paxton_door_access()

        #Try to email about Membership Created, only email to adult and young adult.
        member_query = Member.query.get(membership.member_id)
        if(member_query.check_age_group() in ["adult","young_adult"] or 
        member_query.access_after_hours==True):
            email_response = emailFromTemplate(
                "Membership Created", recipient=customer_query, membership=membership
            )
            if email_response["response"] == "success":
                pass
            else:
                # Actually log this...
                alert = Alerts(
                    alert_type="",
                    alert_level="1",
                    alert_message=email_response["emailResponse"],
                    alert_status="unsolved",
                    member_associated_id=customer_query.id,
                )
                db.session.add(alert)
        db.session.commit()
        return {"response": "success"}

    def delete(self):
        args = request.args

        membership_id = args["id"]

        membership = Membership.query.get(membership_id)

        if not membership.is_active():
            return {"response": "Membership not currently active, cannot be canceled."}
        else:
            membership.cancel()

            adjustment = MembershipAdjustment(
                {
                    "membership_id": membership.id,
                    "action_type": "Membership Canceld",
                    "note": "",
                }
            )
            db.session.add(adjustment)
            db.session.commit()
            return {"response": "success"}


# class MembershipCancelAll(Resource):
#    def delete(self):
#        Membership.cancel_all()
#        db.session.commit()
#        return {"response":"success"}

# Membership
class MembershipAll(Resource):
    # @jwt_required
    def get(self):
        return Membership.return_all()

    # @jwt_required
    def post(self):
        return "success"


# Membership


class MembershipFreeze(Resource):
    # @jwt_required
    def post(self):
        data = request.get_json()

        membership_id = data["membership_id"]
        action_mode = data["actionMode"]
        membership = Membership.query.get(membership_id)
        if not membership:
            return {
                "response": "Error::Membership query not found in database. If this occurs in normal operation, please contact developer."
            }

        """
        If Un-Freeze, unfreeze the membership
        """
        if action_mode == "unFreeze":
            membership.unfreeze()
            db.session.commit()
            return {"response": "success"}
        else:
            pass

        data_mode = data["mode"]
        today = datetime.datetime.now(timezone("Pacific/Auckland"))
        """
        Check end date based on data mode
        """
        if data_mode == "specifyTime":
            frozen_days = data["days"]
            if not frozen_days:
                return {"response": "Error::Invalid days"}
            if frozen_days <= 0:
                return {
                    "response": "Error::Freeze end date must be at least one day after today"
                }
            if type(frozen_days) != int:
                return {"response": "Error::Invalid days"}
            frozen_end_date = today + timedelta(days=frozen_days)
        elif data_mode == "selectEndDate":
            frozen_end_date = data["endDate"]
            split = frozen_end_date.split("-")
            year = split[0]
            month = split[1]
            date = split[2]
            date_from_string = datetime.datetime.strptime(
                "{}-{}-{}".format(year, month, date), "%Y-%m-%d"
            )
            frozen_end_date = date_from_string
        elif data_mode == "indefinately":
            frozen_end_date = None
        else:
            return {"response": "Error::Invalid Data mode"}

        frozen_until = frozen_end_date
        if frozen_until != None:
            if datetime.datetime.timestamp(frozen_until) <= datetime.datetime.timestamp(
                today
            ):
                return {
                    "response": "Error::Freeze end date must be at least one day after today"
                }

        """
        Freeze Membership accordingly
        """

        if not membership.is_active():
            return {"response": "Info::Membership already expired."}
        if membership.frozen == True:
            return {"response": "Info::Membership already Frozen..."}
        else:
            membership.freeze(frozen_until)

        db.session.commit()

        return {"response": "success"}


# Membership
class MembershipFreezeAll(Resource):
    # @jwt_required
    def get(self):
        Membership.freeze_all()
        db.session.commit()
        return {"response": "success"}

    def delete(self):
        Membership.un_freeze_all()
        db.session.commit()
        return {"response": "success"}


class MembershipHoliday(Resource):
    # @jwt_required
    def post(self):
        data = request.get_json()

        membership_id = data["membership_id"]
        action_mode = data["actionMode"]
        membership = Membership.query.get(membership_id)
        if not membership:
            return {
                "response": "Error::Membership query not found in database. If this occurs in normal operation, please contact developer."
            }
        """
        If terminate holiday, terminate holiday for membership.
        """
        if action_mode == "terminateHoliday":
            membership.terminate_holiday()
            db.session.commit()
            return {"response": "success"}
        else:
            pass

        data_mode = data["mode"]
        today = datetime.datetime.now(timezone("Pacific/Auckland"))
        """
        Check end date based on data mode
        """
        if data_mode == "specifyTime":
            holiday_days = data["days"]
            if not holiday_days:
                return {"response": "Error::Invalid days"}
            if holiday_days <= 0:
                return {
                    "response": "Error::Holiday end date must be at least one day after today"
                }
            if type(holiday_days) != int:
                return {"response": "Error::Invalid days"}
            holiday_end_date = today + timedelta(days=holiday_days)
        elif data_mode == "selectEndDate":
            end_date = data["endDate"]
            split = end_date.split("-")
            year = split[0]
            month = split[1]
            date = split[2]
            date_from_string = datetime.datetime.strptime(
                "{}-{}-{}".format(year, month, date), "%Y-%m-%d"
            )
            holiday_end_date = date_from_string
        elif data_mode == "indefinately":
            holiday_end_date = None
        else:
            return {"response": "Error::Invalid Data mode"}

        holiday_until = holiday_end_date

        if holiday_until != None:
            if datetime.datetime.timestamp(
                holiday_until
            ) <= datetime.datetime.timestamp(today):
                return {
                    "response": "Error::Holiday end date must be at least one day after today"
                }

        """
        Holiday Membership accordingly
        """

        if not membership.is_active():
            return {"response": "Info::Membership already expired."}
        if membership.on_holiday == True:
            return {"response": "Info::Membership already on Holiday..."}
        else:
            membership.holiday(holiday_until)

        db.session.commit()

        return {"response": "success"}


# Membership
class MembershipHolidayAll(Resource):
    # @jwt_required
    def get(self):
        Membership.holiday_all()
        db.session.commit()
        return {"response": "success"}

    def delete(self):
        Membership.terminate_holiday_all()
        db.session.commit()
        return {"response": "success"}


class MembershipAdjustmentResource(Resource):
    def get(self):
        args = request.args
        membership_id = args["id"]

        membership_adjustments = MembershipAdjustment.query.filter(
            MembershipAdjustment.membership_id == membership_id
        )

        return list(map(lambda x: x.serialize(), membership_adjustments))


class MembershipSearch(Resource):
    # @jwt_required
    def post(self):
        data = request.get_json()
        searchType = data["searchType"]
        current_page = data["currentPage"]
        page_size = data["pageSize"]
        try:
            export_csv = data["export"]
        except KeyError:
            export_csv = False

        if searchType == None:
            return {"response": "Error::unexpected search type."}
        if current_page == None:
            current_page = 1
        if page_size == None:
            page_size = 12
        if searchType == "normal":
            searchPrompt = "%" + data["searchPrompt"] + "%"
            lookUpKey = data["lookUpKey"]
            if lookUpKey == "Common":
                result = Membership.query.filter(
                    or_(
                        func.lower(Membership.description).ilike(searchPrompt.lower()),
                        Membership.member.has(
                            func.concat(
                                Member.firstName,
                                " ",
                                Member.middleName,
                                " ",
                                Member.lastName,
                            ).ilike(searchPrompt)
                        ),
                        Membership.member.has(
                            func.concat(Member.firstName, " ", Member.lastName).ilike(
                                searchPrompt
                            )
                        ),
                        Membership.member.has(
                            Member.firstName.ilike(searchPrompt.lower())
                        ),
                        Membership.member.has(
                            Member.middleName.ilike(searchPrompt.lower())
                        ),
                        Membership.member.has(
                            Member.lastName.ilike(searchPrompt.lower())
                        ),
                    )
                )
            elif lookUpKey == "MembershipType":
                result = Membership.query.filter(
                    or_(func.lower(Membership.billing_frequency).ilike(searchPrompt.lower()))
                )
            elif lookUpKey == "BillingType":
                result = Membership.query.filter(
                    or_(func.lower(Membership.billingType).ilike(searchPrompt.lower()))
                )
            elif lookUpKey == "MemberFirstName":
                result = Membership.query.filter(
                    or_(
                        Membership.member.has(
                            Member.firstName.ilike(searchPrompt.lower())
                        ),
                    )
                )
            elif lookUpKey == "MemberMiddleName":
                result = Membership.query.filter(
                    or_(
                        Membership.member.has(
                            Member.middleName.ilike(searchPrompt.lower())
                        ),
                    )
                )
            elif lookUpKey == "MemberLastName":
                result = Membership.query.filter(
                    or_(
                        Membership.member.has(
                            Member.lastName.ilike(searchPrompt.lower())
                        ),
                    )
                )
            elif lookUpKey == "MembershipFrozen":
                if data["searchPrompt"].lower() in ["yes", "true", "frozen"]:
                    searchPrompt = True
                else:
                    searchPrompt = False
                result = Membership.query.filter(or_(Membership.frozen == searchPrompt))
            elif lookUpKey == "MembershipHoliday":
                if data["searchPrompt"].lower() in ["yes", "true", "holiday"]:
                    searchPrompt = True
                else:
                    searchPrompt = False
                result = Membership.query.filter(or_(Membership.on_holiday == searchPrompt))
            elif lookUpKey == "HasFailedInvoices":
                result = Membership.query.filter(
                    Membership.membership_invoices.any(MembershipInvoice.status=="failed")
                )
            else:
                result = Membership.query.filter(
                    or_(func.lower(Membership.description).ilike(searchPrompt.lower()))
                )
        else:
            return {"response": "Error::unexpected search type."}

        isActive = data["isActive"]
        today = datetime.datetime.now(timezone("Pacific/Auckland"))

        if isActive == "active":
            result = result.filter(Membership.end_date > today)
        elif isActive == "in-active":
            result = result.filter(Membership.end_date <= today)
        else:
            pass

        query_full = result.order_by(Membership.created)

        result = query_full.paginate(
            current_page, page_size, False
        )

        query_result = list(
            map(lambda x: x.serialize(return_Member=True), result.items)
        )
        if export_csv:
            print("exporting...")
            data = list(map(lambda x: x.csv_format(), query_full.all()))
            csv_keys = Membership.get_csv_keys()
            df = pd.DataFrame(data, columns=csv_keys)
            df.to_csv("C:\\Users\\duned\\Desktop\\membership_data.csv")
            print("done")


        total_pages = result.pages

        total_amount = result.total

        if current_page > total_pages:
            current_page = total_pages
        elif current_page < 1:
            current_page = 1

        return {
            "response": "success",
            "data": query_result,
            "total_pages": total_pages,
            "current_page": current_page,
            "total_amount": total_amount,
        }
