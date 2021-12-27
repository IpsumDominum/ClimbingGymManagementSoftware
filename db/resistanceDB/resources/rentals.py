from flask_restful import Resource, reqparse
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
from sqlalchemy import or_
from models.rental import Rental
from models.subproduct import SubProduct
import datetime
from pytz import timezone


class RentalAll(Resource):
    def post(self):
        data = request.get_json()

        searchType = data["searchType"]
        current_page = data["currentPage"]
        page_size = data["pageSize"]

 
        """
        Filter Key
        """
        try:
            filter_key = data["filterByKey"]
        except KeyError:
            filter_key = "all"

        """
        Export to csv or not
        """
        try:
            export_csv = data["export"]
        except KeyError:
            export_csv = False
        """
        By Member
        """
        try:
            byMember = data["byMember"]
        except KeyError:
            byMember = False
        """
        By SubProduct
        """
        try:
            bySubProduct = data["bySubProduct"]
        except KeyError:
            bySubProduct = False
        """
        Search
        """
        if searchType == None:
            return {"response": "Error::unexpected search type."}
        if current_page == None:
            current_page = 1
        if page_size == None:
            page_size = 12
        
        if(byMember==True):
            member_id = data["member_id"]
            query = Rental.query.filter(Rental.member_id == member_id)
        elif(bySubProduct==True):
            sub_product_id = data["sub_product_id"]
            query = Rental.query.filter(
                        Rental.sub_product_id == sub_product_id,
                        or_(Rental.status == "outstanding", Rental.status == "overdue"))
        else:
            query = Rental.query
        
        if searchType == "normal":
            searchPrompt = "%" + data["searchPrompt"] + "%"
            lookUpKey = data["lookUpKey"]
            if lookUpKey == "Common":
                query = query.filter(
                    or_(
                        Rental.rental_item_name.ilike(searchPrompt),
                        Rental.rental_item_size.ilike(searchPrompt),
                        Rental.rental_item_color.ilike(searchPrompt),
                    )
                )
        else:
            return {"response": "Error::unexpected search type."}

        if(filter_key=="all"):
            pass
        else:
            query = query.filter(
                Rental.status==filter_key
            )
        query_full = query.order_by(Rental.rental_date)

        query = query_full.paginate(current_page, page_size, False)

        query_result = list(
            map(lambda x: x.serialize(), query.items)
        )

        if export_csv:
            print("exporting...")
            data = list(map(lambda x: x.csv_format(), query_full.all()))
            csv_keys = Rental.get_csv_keys()
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

class RentalGetByMember(Resource):
    def get(self):
        args = request.args
        member_id = args["id"]
        return {
            "data": list(
                map(
                    lambda x: x.serialize(),
                    Rental.query.filter(Rental.member_id == member_id),
                )
            ),
            "response": "success",
        }


class RentalGetBySubProduct(Resource):
    def get(self):
        args = request.args
        sub_product_id = args["id"]
        return {
            "data": list(
                map(
                    lambda x: x.serialize(),
                    Rental.query.filter(
                        Rental.sub_product_id == sub_product_id,
                        or_(Rental.status == "outstanding", Rental.status == "overdue"),
                    ),
                )
            ),
            "response": "success",
        }


class RentalMarkAsReturned(Resource):
    def get(self):
        args = request.args
        rental_id = args["id"]
        rental = Rental.query.get(rental_id)
        if rental == None:
            return {"response": "Error::Rental not found"}
        parent_sub_product = SubProduct.query.get(rental.sub_product_id)
        if parent_sub_product == None:
            return {"response": "Error::Parent sub product not found"}

        parent_sub_product.rented -= int(rental.note)
        
        rental.returned_date = datetime.datetime.now(timezone("Pacific/Auckland"))
        rental.status = "returned"
        rental.returned = True
        db.session.commit()
        return {"response": "success"}
    def delete(self):
        rentals = Rental.query.filter(Rental.status=="outstanding")
        if rentals == None:
            return {"response": "Error::Rentals not found"}
        for rental in rentals:
            parent_sub_product = SubProduct.query.get(rental.sub_product_id)
            if parent_sub_product == None:
                return {"response": "Error::Parent sub product not found"}
            parent_sub_product.rented -= int(rental.note)
            
            rental.returned_date = datetime.datetime.now(timezone("Pacific/Auckland"))
            rental.status = "returned"
            rental.returned = True
            db.session.commit()
        return {"response": "success"}



class RentalMarkAsLost(Resource):
    def get(self):
        args = request.args
        rental_id = args["id"]
        rental = Rental.query.get(rental_id)
        if rental == None:
            return {"response": "Error::Rental not found"}
        parent_sub_product = SubProduct.query.get(rental.sub_product_id)
        if parent_sub_product == None:
            return {"response": "Error::Parent sub product not found"}
        parent_sub_product.rented -= int(rental.note)
        parent_sub_product.stock -= int(rental.note)
        rental.status = "lost"
        db.session.commit()
        return {"response": "success"}


class RentalMarkAsDamaged(Resource):
    def get(self):
        args = request.args
        rental_id = args["id"]
        rental = Rental.query.get(rental_id)
        if rental == None:
            return {"response": "Error::Rental not found"}
        parent_sub_product = SubProduct.query.get(rental.sub_product_id)
        if parent_sub_product == None:
            return {"response": "Error::Parent sub product not found"}
        parent_sub_product.rented -= int(rental.note)
        parent_sub_product.stock -= int(rental.note)
        rental.status = "damaged"
        db.session.commit()
        return {"response": "success"}
