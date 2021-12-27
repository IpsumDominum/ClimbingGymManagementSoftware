from flask_restful import Resource, reqparse
from pytz import timezone
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    jwt_refresh_token_required,
    get_jwt_identity,
    get_raw_jwt,
)
import pandas as pd
from flask import Flask, request, jsonify
from app import db
from sqlalchemy import or_, and_
from datetime import datetime, timedelta

from models.sale import Sales
from models.subproduct import SubProduct
from models.product import Product
from models.member import Member
from models.rental import Rental
from models.checkin import CheckIn


class SaleResource(Resource):
    # @jwt_required
    def get(self):
        return Sales.return_all()["data"]

    """
    Terrible code. The developer should be ashamed of himself.
    
    Expected Data:

    @product_id - id of the product being sold
    @saleType - type of sale, Enum { 'dayuse' | 'membership' }
    @anonymousSale - Whether a member is associated to the Sale.

    """
    # @jwt_required
    def post(self):
        data = request.get_json()
        if data["saleType"] == "dayuse":
            """
            CHECK if product exist
            """
            if data["productType"] == "Rental" or data["productType"] == "Retail":
                # Sub product
                sub_product = SubProduct.query.get(data["product_id"])
                # Parent Product
                product = Product.query.get(sub_product.product_id)

                if product == None or product == None:
                    # Product with the queried productId is not found
                    return "Error::Failed, product||sub_product not found::Possibly due to corruption in data transferring process."
                else:
                    pass
            elif data["productType"] == "Concession" or data["productType"] == "Casual":
                """
                Otherwise Concession and Casual
                """
                if Product.query.get(data["product_id"]) == None:
                    # Product with the queried productId is not found
                    return "failed, product not found"
                else:
                    pass
                product = Product.query.get(data["product_id"])
                sub_product = None
            else:
                return "Error::Unknown Product Type"
            """
            CHECK if member exist (For not anonymous sales, and Rentals)
            Rentals/default items are both defaultly disallow no anonymous sales,
            but here it is checked just in case...
            """
            # Check if specified member exist
            if data["anonymousSale"] == False or data["productType"] == "Rental":
                # If Anonymous Sale mode is on, then set the Sale to be Anonymous
                member_query = Member.query.get(data["member_id"])
                if member_query == None:
                    # Member with the queried memberId is not found
                    return "failed, member not found"
                else:
                    pass
            """
            If member exists, add concession amount to them
            """
            if data["productType"] == "Concession":
                member_query.add_concession(data["quantity"])
            elif data["productType"] == "Casual":
                # Create a checkin(chicken)
                checkin_type = "Casual"
                checkin_status = "success"
                checkin_message = ""
                checkin = CheckIn(
                    checkin_type=checkin_type,
                    checkin_status=checkin_status,
                    checkin_message=checkin_message,
                    checkin_member_id=member_query.id,
                )
                member_query.last_visit = datetime.now(timezone("Pacific/Auckland"))
                db.session.add(checkin)
            elif data["productType"] == "Retail":
                sub_product.stock -= data["quantity"]
                sub_product.sold += data["quantity"]
            elif data["productType"] == "Rental":
                rental_due_date_mode = data["rental_due_date_mode"]
                rental_due_date = data["rental_due_date"]
                if rental_due_date_mode == "specifyTime":
                    days = rental_due_date["days"]
                    today = datetime.now(timezone("Pacific/Auckland"))
                    due_date = today + timedelta(days=days)
                elif rental_due_date_mode == "selectEndDate":
                    """
                    For some bizzare reason this is done this way:
                    rental_due_date, if the mode is selectEndDate,
                    is a string looking like: yyyy-mm-dd
                    Yeah just go from there.
                    """
                    split = rental_due_date.split("-")
                    year = split[0]
                    month = split[1]
                    date = split[2]
                    date_from_string = datetime.strptime(
                        "{}-{}-{}".format(year, month, date), "%Y-%m-%d"
                    )
                    print(date_from_string.isoformat())
                    due_date = date_from_string
                else:
                    return "Error::An unknown error has occured"
                parent_product = Product.query.get(sub_product.product_id)
                rental_object_data = {
                    "member_id": data["member_id"],
                    "sub_product_id": sub_product.id,
                    "due_date": due_date,
                    "rental_item_size": sub_product.size,
                    "rental_item_name": parent_product.name,
                    "rental_item_color": sub_product.color,
                    "note":str(data["quantity"])
                }
                rental_object = Rental(rental_object_data)
                sub_product.rented = sub_product.rented + data["quantity"]
                db.session.add(rental_object)
            """
            CREATE Sale
            """
            sale = Sales(
                data, product, sub_product, anonymousSale=data["anonymousSale"]
            )
            db.session.add(sale)
            db.session.commit()
            return "success"
        elif data["saleType"] == "membership":
            product_id = data["product_id"]
            product = Product.query.get(product_id)
            if product == None:
                # Product with the queried productId is not found
                return "Error::Failed, product||sub_product not found::Possibly due to corruption in data transferring process."
            else:
                member_query = Member.query.get(data["member_id"])
                if member_query == None:
                    # Member with the queried memberId is not found
                    return "Error::Failed, member not found"
                else:
                    sale = Sales(data, product, None, anonymousSale=False)
                    db.session.add(sale)
                    db.session.commit()
                    return "success"
        else:
            return "Invalid sale type"


class SaleAll(Resource):
    # @jwt_required
    def get(self):
        pass

    # @jwt_required
    def post(self):
        data = request.get_json()
        year = data["year"]
        month = data["month"]
        date = data["day"]
        offset = data["offset"]

        date_from_string = datetime.strptime(
            "{}-{}-{}".format(year, month, date), "%Y-%m-%d"
        )
        yesterday = date_from_string - timedelta(days=0 - offset)
        tomorrow = date_from_string + timedelta(days=1 + offset)
        # Query Result

        queryResult = Sales.query.filter(
            and_(Sales.created > yesterday, Sales.created < tomorrow)
        ).order_by(Sales.created).all()
        sale_history = {
            "data": list(map(lambda x: x.serialize(), queryResult)),
            "queryDate": yesterday.isoformat(),
            "response": "success",
        }
        return sale_history


class SaleSearch(Resource):
    def post(self):
        data = request.get_json()

        current_page = data["currentPage"]
        page_size = data["pageSize"]

        query_mode = data["queryMode"]

        query = Sales.query
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
                query = query.filter((Sales.created > since_date))
            except ValueError:
                return {"response": "Error::Invalid Date"}
        elif query_mode == "sinceMonth":
            sinceMonthAgo = data["sinceMonthAgo"]
            months_ago_date = datetime.now(timezone("Pacific/Auckland")) - timedelta(
                days=sinceMonthAgo * 30
            )
            #print("since months ago ", months_ago_date)
            query = query.filter((Sales.created > months_ago_date))
        elif query_mode == "onDate":
            print(data)
            try:
                since_date = data["sinceDate"]
                split = since_date.split("-")
                year = split[0]
                month = split[1]
                date = split[2]

                date_from_string = datetime.strptime(
                    "{}-{}-{}".format(year, month, date), "%Y-%m-%d"
                )
                yesterday = date_from_string - timedelta(days=0)
                tomorrow = date_from_string + timedelta(days=1)
                # Query Result

                query = Sales.query.filter(
                    and_(Sales.created > yesterday, Sales.created < tomorrow)
                )
            except ValueError:
                return {"response": "Error::Invalid Date"}
        else:
            return {"response": "Error::invalid query mode { " + query_mode + " }"}

        """
        Do searching
        """
        searchPrompt = "%" + data["searchPrompt"] + "%"
        lookUpKey = data["lookUpKey"]

        if lookUpKey == "Common":
            query = query.filter(
                or_(
                    Sales.productType.ilike(searchPrompt),
                    Sales.productName.ilike(searchPrompt),
                )
            )

        """
        Paginate
        """
        query_full = query.order_by(Sales.created.desc())
        
        query_paginated = query_full.paginate(current_page, page_size, False)

        query_result = list(
            map(
                lambda x: x.serialize(),
                query_paginated.items,
            )
        )

        category_dict = {
                        "Food&Drinks":
                            ["M&M's chocolate",
                            "Fabulicious",
                            "Chocolate",
                            " M & Ms",
                            "Chips",
                            "Tropical Sherbert",
                             "Chlokky Fish",
                             "Fruit & Nut Snackaballs",
                             "Kit Kat",
                             "On-The-Go",
                             "Munch",
                             "One Square Meal",
                             "Frooze Balls",
                             "Pump",
                             "Zico",
                             "Juice",
                             "Sprite",
                             "Coke No Sugar",
                             "Coke",
                             "Schweppes",
                             "Kombucha",
                             "Iced coffee",
                             "One Square Meal",
                             "Chlokky Fish"
                             ],
                        "DayPass":
                            ["Causal Pass Young Adult",
                             "Causal Pass Child",
                             "Causal Pass Adult",
                             "Causal Pass Group"],
                        "Concessions":
                            ["Concession Pass Child",
                             "Concession Pass Adult",
                             "Concession Pass Young Adult"],
                        "Joining Fee Memberships":
                            ["Membership Child",
                             "Membership Adult",
                             "Membership Young Adult",
                             "Joining Fee",
                             "Joining Fee "],
                        "Joining Fee Concessions":
                            ["Fee for concession pass key tag"],     
                        "Retail":
                            [
                             "Super chalk",
                             "Tape",
                             "Finger tape roll",
                             "Chalk bag",
                             "Gripsaver Plus",
                             "HMS Bulletproof Triple",
                             "Katana",
                             "Gravity Rope Bag",
                             "Quickdraw",
                             "Carabiner",
                             "Harness",
                             "Chalk Bag",
                             "Sling",
                             "Chalk Bag",
                             "Chips",
                             "Rope",
                             "Katana Women",
                             "Theory Women",
                             "Belay Device",
                             "Tarantula",
                             "Theory",
                             "Bouldering Brush",
                             "Hand Repair Balm",
                             "Cobra",
                             "Python",
                             "Skwama Women",
                             "Skwama",
                             "Solution",
                             "Helmet-Salathe",
                             "Helmet - Salathe",
                             "Crocy",
                             "Session",
                             "Chalk bag",
                             "Chalk Bucket",                            
                             "Book",
                             "Miura",
                             "Tape",
                             "Skwama",
                             ],   
                        "Rental":
                            ["Rental Chalk Bag",
                             "Session Shoes",
                             ],
                        "Other":
                            ["Lost Keytag Fee",
                             "Missed $10 membership fee",
                             "Gift Card",
                             "Gift Voucher",
                             "Entry Fee",
                             "Entry Fee ",
                             "Lost Keytag Fee ",
                             ]
                        }
        from collections import defaultdict
        reverse_dict = defaultdict(lambda:"Other")
        for i in category_dict:
            for j in category_dict[i]:
                reverse_dict[j.lower().replace(" ","")] = i

        #Mike category things
        if export_csv:
            print("exporting...")
            data = list(map(lambda x: x.csv_format(), query_full.all()))
            csv_keys = Sales.get_csv_keys()
            df = pd.DataFrame(data, columns=csv_keys)

            totals = defaultdict(lambda:defaultdict(lambda:defaultdict(lambda:[0,0,0])))
            for item in data:
                if(item[-1]=="Eftpos/Credit"):                                        
                    cat = reverse_dict[item[3].lower().replace(" ","")]
                    if(cat=="DayPass" or cat=="Concessions" or cat=="Rental"):
                        #show name
                        item_name = item[3]
                    else:
                        item_name = cat

                    discounted = False
                    item_price = item[10]
                    if(item[14]!=0):
                        discounted = True
                        item_name = str(item[14]) + "%-"+ item_name
                        item_price = item_price * (1- item[14]*0.01)
                    if(discounted == True):
                        item_name = "Discounted-" + item_name
                    if(cat=="Retail" or cat=="Food&Drinks" or cat=="Other"):
                        item_name = "Retail"
                        item_price = "-"

                    #quantity
                    totals[cat][item_name][item_price][0] += item[9]
                    #total
                    totals[cat][item_name][item_price][1] += item[12]
                    #discounted amount
                    totals[cat][item_name][item_price][2] += item[13]
                
            #print(dict(totals))
            data_totals = []
            for cat in totals:
                data_totals.append([cat,"","","","",""])
                for item_name in totals[cat]:
                    for item_price in totals[cat][item_name]:
                        data_totals.append(["",item_name,
                    totals[cat][item_name][item_price][0],
                    item_price,totals[cat][item_name][item_price][2],
                    totals[cat][item_name][item_price][1]])

            csv_keys_totals = ["Category","Item","Quantity","Price","Minus Amount","Total"]

            df2 = pd.DataFrame(data_totals, columns=csv_keys_totals)
            df.to_csv("C:\\Users\\duned\\Desktop\\sales_data.csv")
            df2.to_csv("C:\\Users\\duned\\Desktop\\sales_totals.csv")
            print("done")

        total_pages = query_paginated.pages

        total_amount = query_paginated.total

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


class SaleGetByMember(Resource):
    # @jwt_required
    def get(self):
        pass

    # @jwt_required
    def post(self):
        data = request.get_json()
        id = data["id"]

        current_page = data["currentPage"]
        page_size = data["pageSize"]

        query_mode = data["queryMode"]

        query = Sales.query.filter(Sales.member_id == id)

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
                query = query.filter((Sales.created > since_date))
            except ValueError:
                return {"response": "Error::Invalid Date"}
        elif query_mode == "sinceMonth":
            sinceMonthAgo = data["sinceMonthAgo"]
            months_ago_date = datetime.now(timezone("Pacific/Auckland")) - timedelta(
                days=sinceMonthAgo * 30
            )
            #print("since months ago ", months_ago_date)
            query = query.filter((Sales.created > months_ago_date))
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


class SaleDelete(Resource):
    def post(self):
        data = request.get_json()
        id = data["id"]
        Sales.query.filter_by(id=id).delete()
        db.session.commit()
        return "deleted"

class SaleEdit(Resource):
    def post(self):
        data = request.get_json()
        id = data["id"]
        Sales.query.get(id).edit(data)
        db.session.commit()
        return {"response":"success"}

