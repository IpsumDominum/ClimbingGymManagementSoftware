import stripe
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
from app import db
from sqlalchemy import or_
from flask_http_response import success, result, error
from models.member import Member
from models.membershipInvoice import MembershipInvoice
from pytz import timezone
from datetime import datetime, timedelta


class InvoicesByUser(Resource):

    """
    Get invoices by User
    """

    def get(self):
        args = request.args
        id = args["id"]
        result = Member.query.get(id)
        if result:
            member_invoices = (
                MembershipInvoice.query.filter(MembershipInvoice.member_id == result.id)
                .order_by(MembershipInvoice.invoice_date)
                .all()
            )
            return {
                "response": "success",
                "data": list(map(lambda x: x.serialize(), member_invoices)),
            }
        else:
            return {"response": "Error::User Not Found"}

    def post(self):
        pass


class InvoicesAll(Resource):

    """
    Get all invoices
    """

    def get(self):
        return MembershipInvoice.return_all()

    def post(self):
        pass


class InvoicesSearch(Resource):
    def post(self):
        data = request.get_json()

        current_page = data["currentPage"]
        page_size = data["pageSize"]

        query_mode = data["queryMode"]

        query = MembershipInvoice.query
        try:
            export_csv = data["export"]
        except KeyError:
            export_csv = False            

        if query_mode == "sinceDate":
            try:
                since_date = data["sinceDate"]
                split = since_date.split("-")
                year = split[0]
                month = split[1]
                date = split[2]

                date_from_string = datetime.strptime(
                    "{}-{}-{}".format(year, month, date), "%Y-%m-%d"
                )
                query = query.filter((MembershipInvoice.invoice_date > since_date))
            except ValueError:
                return {"response": "Error::Invalid Date"}
        elif query_mode == "sinceMonth":
            sinceMonthAgo = data["sinceMonthAgo"]
            months_ago_date = datetime.now(timezone("Pacific/Auckland")) - timedelta(
                days=sinceMonthAgo * 30
            )
            #print("since months ago ", months_ago_date)
            query = query.filter((MembershipInvoice.invoice_date > months_ago_date))
        else:
            return {"response": "Error::invalid query mode { " + query_mode + " }"}

        """
        Do searching
        """
        searchPrompt = "%" + data["searchPrompt"] + "%"
        lookUpKey = data["lookUpKey"]

        if lookUpKey == "Common":
            query = query.filter(or_(MembershipInvoice.status.ilike(searchPrompt)))

        """
        Paginate
        """
        query_full = query.order_by(MembershipInvoice.invoice_date)

        query = query_full.paginate(
            current_page, page_size, False
        )

        query_result = list(
            map(
                lambda x: x.serialize(),
                query.items,
            )
        )
        if export_csv:
            print("exporting...")
            data = list(map(lambda x: x.csv_format(), query_full.all()))
            csv_keys = MembershipInvoice.get_csv_keys()
            df = pd.DataFrame(data, columns=csv_keys)
            df.to_csv("C:\\Users\\duned\\Desktop\\invoices_data.csv")
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
