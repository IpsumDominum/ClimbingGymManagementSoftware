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
from flask import Flask, request, jsonify
from sqlalchemy import func
from app import db, paxton_api, mailchimp_api
from sqlalchemy import or_, and_
import datetime
import stripe
import math
from pytz import timezone
import pandas as pd

from models.member import Member
from models.rental import Rental
from models.membership import Membership
from email_validator import validate_email, EmailNotValidError
from mailchimp_marketing.api_client import ApiClientError

# Single User
class MemberResource(Resource):
    # @jwt_required
    def get(self):
        args = request.args
        id = args["id"]
        result = Member.query.get(id)
        if result:
            return {"response":"success","member":result.serialize(returnMembership=True)}
        else:
            return {"response":"Member Not Found"}

    # @jwt_required
    def post(self):
        data = request.get_json()
        message = ""
        try:
            assert "email" in data.keys()
        except AssertionError as e:
            return {"response": "Error::Data missing! " + str(e)}

        try:
            # Check for Email sanity:
            valid = validate_email(data["email"])
            email = valid.email
        except EmailNotValidError as e:
            return {"response": str(e), "message": ""}
        """
        Try creating stripe customer
        """
        try:
            stripe_customer = stripe.Customer.create(
                name=data["firstName"] + data["lastName"]
            )
        except Exception:
            stripe_customer = {
                "invoice_prefix": "",
                "id": "",
            }
            message = "Warning::Unable to create stripe customer at present moment. Can Ignore this for now, check internet connection. If the situation persists, please contact developer."

        member = Member(data, stripe_customer)
        db.session.add(member)
        db.session.commit()

        if member.mail_promotions == True:
            member_info = {
                "email_address": member.email,
                "status": "subscribed",
                "merge_fields": {"FNAME": member.firstName, "LNAME": member.lastName},
            }
            list_id = "5eda3de988"
            try:
                response = mailchimp_api.lists.add_list_member(list_id, member_info)
            except ApiClientError as error:
                if message == "":
                    message = "Warning::Mailchimp subscribed Failed!::" + str(
                        error.text
                    )
                else:
                    message += "::ALSO::Warning::Mailchimp subscribed Failed!::" + str(
                        error.text
                    )

        paxton_res = member.set_paxton_card_id(data["paxton_card_id"])
        if paxton_res["response"] == "success":
            return {"response": "success", "message": message, "member_id": member.id}
        else:
            if message == "":
                message = (
                    "Warning::Paxton Member Creation Failed!::" + paxton_res["response"]
                )
            else:
                message += (
                    "::ALSO::Paxton Member Creation Failed!::" + paxton_res["response"]
                )
            return {"response": "success", "message": message, "member_id": member.id}

    def delete(self):
        args = request.args
        id = args["id"]
        if Member.query.get(id).status == "inactive":
            Member.query.get(id).status = "normal"
        else:
            Member.query.get(id).status = "inactive"
        db.session.commit()
        return "success"


class MemberAll(Resource):
    # @jwt_required
    def get(self):
        return Member.return_all()

    def delete(self):
        return Member.delete_all()


class MemberEdit(Resource):
    # @jwt_required
    def post(self):
        data = request.get_json()
        message = ""

        try:
            assert "email" in data.keys()
        except AssertionError as e:
            return {"response": "Error::Data missing! " + str(e), "message": message}
        try:
            # Check for Email sanity:
            valid = validate_email(data["email"])
            email = valid.email
        except EmailNotValidError as e:
            return {"response": str(e), "message": message}

        member = Member.query.get(data["id"])

        member.update(data)

        db.session.commit()

        return {"response": "success", "message": message}


class MemberUpdateWaiver(Resource):
    def post(self):
        data = request.get_json()
        member_id = data["member_id"]
        signatureImage = data["signatureImage"]
        member_query = Member.query.get(member_id)
        member_query.set_signature(signatureImage)
        db.session.commit()
        return {"response": "success"}


class MemberSearch(Resource):
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

        try:
            show_in_active = data["showInActive"]
        except KeyError:
            show_in_active = False

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
                query = Member.query.filter(
                    or_(
                        func.concat(
                            Member.firstName,
                            " ",
                            Member.middleName,
                            " ",
                            Member.lastName,
                        ).ilike(searchPrompt),
                        func.concat(Member.firstName, " ", Member.lastName).ilike(
                            searchPrompt
                        ),
                        Member.firstName.ilike(searchPrompt),
                        Member.middleName.ilike(searchPrompt),
                        Member.lastName.ilike(searchPrompt),
                        Member.email.ilike(searchPrompt),
                    )
                )
            elif lookUpKey == "Title":
                query = Member.query.filter(Member.title == data["searchPrompt"])
            elif lookUpKey == "FirstName":
                query = Member.query.filter(Member.firstName.ilike(searchPrompt))
            elif lookUpKey == "MiddleName":
                query = Member.query.filter(Member.middleName.ilike(searchPrompt))
            elif lookUpKey == "LastName":
                query = Member.query.filter(Member.lastName.ilike(searchPrompt))
            elif lookUpKey == "Email":
                query = Member.query.filter(Member.email.ilike(searchPrompt))
            elif lookUpKey == "Birthday":
                query = Member.query.filter(Member.birthday.ilike(searchPrompt))
            elif lookUpKey == "Family":
                query = Member.query.filter(Member.family.ilike(searchPrompt))
            elif lookUpKey == "OverdueRentals":
                query = Member.query.filter(
                    Member.rentals.any(Rental.status == "overdue")
                )
            elif lookUpKey == "KeyFobId":
                query = Member.query.filter(Member.paxton_card_id.ilike(searchPrompt))
            elif lookUpKey == "MembershipActive":
                today = datetime.datetime.now(timezone("Pacific/Auckland"))
                if data["searchPrompt"].lower() in ["yes", "true", "active"]:
                    query = Member.query.filter(
                        Member.memberships.any(Membership.end_date > today)
                    )
                else:
                    query = Member.query.filter(
                        Member.memberships.any(Membership.end_date <= today)
                    )
            elif lookUpKey == "CanAccessAfterHours":
                if data["searchPrompt"].lower() in ["yes", "true"]:
                    searchPrompt = True
                else:
                    searchPrompt = False
                query = Member.query.filter(Member.access_after_hours == searchPrompt)
            else:
                return {"response": "Error::Invalid lookUpKey : " + lookUpKey}
        elif searchType == "name":
            firstName_query = "%" + data["firstName"] + "%"
            middleName_query = "%" + data["middleName"] + "%"
            lastName_query = "%" + data["lastName"] + "%"
            query = Member.query.filter(
                and_(
                    func.lower(Member.firstName) == data["firstName"].lower(),
                    func.lower(Member.middleName) == data["middleName"].lower(),
                    func.lower(Member.lastName) == data["lastName"].lower(),
                )
            )
        else:
            return {"response": "Error::unexpected search type."}
        if show_in_active == True:
            pass
        else:
            query = query.filter(Member.status == "normal")

        query_full = query.order_by(Member.created.desc())

        query = query_full.paginate(current_page, page_size, False)

        query_result = list(
            map(lambda x: x.serialize(returnMembership=True), query.items)
        )

        if export_csv:
            print("exporting...")
            data = list(map(lambda x: x.csv_format(), query_full.all()))
            csv_keys = Member.get_csv_keys()
            df = pd.DataFrame(data, columns=csv_keys)
            df.to_csv("C:\\Users\\duned\\Desktop\\member_data.csv")
            print("done")

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

    def delete(self):
        return Member.delete_all()
