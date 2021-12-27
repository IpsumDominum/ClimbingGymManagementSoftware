from flask_restful import Resource, reqparse
import pandas as pd
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    jwt_refresh_token_required,
    get_jwt_identity,
    get_raw_jwt,
)
from flask import Flask, request, jsonify
from app import db
from sqlalchemy import or_, and_
import stripe
from models.alerts import Alerts
from models.member import Member
from models.checkin import CheckIn
import datetime
from pytz import timezone


def check_in_paxton_id(paxton_card_id):
    if paxton_card_id == "":
        return
    member_query = Member.query.filter(Member.paxton_card_id == paxton_card_id).first()
    #member_query = Member.query.filter(Member.firstName=="Chen").first()

    if member_query != None:
        # If has membership
        if member_query.has_valid_membership():
            # Create checkin for member
            checkin_type = "Membership"
            checkin_status = "success"
            checkin_message = ""
        elif member_query.concession_passes > 0:
            # Create checkin for concession
            checkin_type = "Concession"
            checkin_status = "success"
            checkin_message = ""
        else:
            # Checkin failed
            checkin_type = "Checkin Failed"
            checkin_status = "failed"
            checkin_message = "::No active membership or consession pass left..."

        # Check waiver signed or not
        if member_query.signatureImage == None:
            checkin_status = "failed"
            checkin_message += "::Waiver not signed!"
        # Check after hours access
        """ 
        if datetime.datetime.now(timezone("Pacific/Auckland")).hour >= 18:
            if not member_query.access_after_hours:
                checkin_status = "failed"
                checkin_message += "::No access permission after hours..."
        """
        checkin = CheckIn(
            checkin_type=checkin_type,
            checkin_status=checkin_status,
            checkin_message=checkin_message,
            checkin_member_id=member_query.id,
        )
        if(checkin_status=="success" and checkin_type=="Concession"):
            member_query.concession_passes -= 1

        member_query.last_visit = datetime.datetime.now(timezone("Pacific/Auckland"))
        db.session.add(checkin)
        db.session.commit()
        return {"response": "success"}
    else:
        return {"response": "no member found associated with card"}


class CheckinResource(Resource):
    # @jwt_required
    def get(self):
        args = request.args
        paxton_card_id = args["id"]
        return check_in_paxton_id(paxton_card_id)

    def delete(self):
        args = request.args
        checkin_id = args["id"]
        checkin = CheckIn.query.get(checkin_id)
        if checkin.checkin_status != "success":
            return {"response": "Error:Can only revoke successful concession checkins!"}
        if checkin == None:
            return {"response": "Error::Failed, Checkin not found."}
        else:
            if checkin.checkin_type == "Concession":
                checkin.checkin_status = "revoked"
                member_query = Member.query.get(checkin.checkin_member_id)
                if member_query == None:
                    return {"response": "Error::Failed, Member not found."}
                else:
                    member_query.concession_passes += 1
                db.session.commit()
                return {"response": "success"}
            else:
                return {
                    "response": "Error::cannot revoke checkin type other than concession..."
                }


class getCheckinHistoryByMember(Resource):
    def post(self):
        data = request.get_json()
        id = data["id"]

        current_page = data["currentPage"]
        page_size = data["pageSize"]

        query_mode = data["queryMode"]

        query = CheckIn.query.filter(CheckIn.checkin_member_id == id)

        if query_mode == "sinceDate":
            try:
                since_date = data["sinceDate"]
                split = since_date.split("-")
                year = split[0]
                month = split[1]
                date = split[2]

                date_from_string = datetime.datetime.strptime(
                    "{}-{}-{}".format(year, month, date), "%Y-%m-%d"
                )
                query = query.filter((CheckIn.checkin_date > since_date))
            except ValueError:
                return {"response": "Error::Invalid Date"}
        elif query_mode == "sinceMonth":
            sinceMonthAgo = data["sinceMonthAgo"]
            months_ago_date = datetime.datetime.now(
                timezone("Pacific/Auckland")
            ) - datetime.timedelta(days=sinceMonthAgo * 30)
            #print("since months ago ", months_ago_date)
            query = query.filter((CheckIn.checkin_date > months_ago_date))
        else:
            return {"response": "Error::invalid query mode { " + query_mode + " }"}

        query = query.paginate(current_page, page_size, False)
        query_result = list(
            map(
                lambda x: x.serialize(),
                query.items,
            )
        )

        total_pages = query.pages

        total_amount = query.total

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


class CheckinGetAll(Resource):
    def post(self):
        data = request.get_json()

        current_page = data["currentPage"]
        page_size = data["pageSize"]
        offset = data["offset"]
        query_date = data["queryDate"]
        try:
            query_mode = data["queryMode"]
        except KeyError:
            query_mode = "onDate"
        try:
            export_csv = data["export"]
        except KeyError:
            export_csv = False

        try:
            split = query_date.split("-")
            year = split[0]
            month = split[1]
            date = split[2]
            date_from_string = datetime.datetime.strptime(
                "{}-{}-{}".format(year, month, date), "%Y-%m-%d"
            )
            final_query_date = date_from_string + datetime.timedelta(days=offset)
        except Exception:
            today = datetime.datetime.now(timezone("Pacific/Auckland"))
            final_query_date = datetime.date(
                today.year, today.month, today.day
            ) + datetime.timedelta(days=offset)

        if(query_mode =="sinceDate"):
            query = CheckIn.query.filter(
                CheckIn.checkin_date > final_query_date
            )
        elif(query_mode =="onDate"):
            tomorrow = final_query_date + datetime.timedelta(1)

            query = CheckIn.query.filter(
                and_(
                    CheckIn.checkin_date > final_query_date, CheckIn.checkin_date < tomorrow
                )
            )
            # except ValueError:
            #    return {"response":"Error::Invalid Date"}
        else:
            return {"reponse":"error, invalid query mode"}

        query_full = query.order_by(CheckIn.checkin_date.desc())

        query = query_full.paginate(
            current_page, page_size, False
        )
        query_result = list(
            map(
                lambda x: x.serialize(),
                query.items,
            )
        )
        export_failed = False

        if export_csv:        
            print("exporting...")
            data = list(map(lambda x: x.csv_format(), query_full.all()))
            csv_keys = CheckIn.get_csv_keys()
            df = pd.DataFrame(data, columns=csv_keys)
            try:
                df.to_csv("C:\\Users\\duned\\Desktop\\checkin_data.csv")
                print("done")
            except Exception as e:
                export_failed = True

        total_pages = query.pages

        total_amount = query.total

        if current_page > total_pages:
            current_page = total_pages
        elif current_page < 1:
            current_page = 1

        checked_year = str(final_query_date.year)
        if len(str(final_query_date.month)) == 1:
            checked_month = "0" + str(final_query_date.month)
        else:
            checked_month = str(final_query_date.month)
        if len(str(final_query_date.day)) == 1:
            checked_day = "0" + str(final_query_date.day)
        else:
            checked_day = str(final_query_date.day)

        if export_failed: 
            response = "Export to csv failed, please check that the file is not open."
        else: 
            response = "success"

        
        return {
            "response": response,
            "csv_exported":export_csv,
            "data": query_result,
            "total_pages": total_pages,
            "current_page": current_page,
            "total_amount": total_amount,
            "query_date": "{}-{}-{}".format(checked_year, checked_month, checked_day),
        }
