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
from flask import Flask, request, jsonify
from app import db
from models.product import Product
from models.subproduct import SubProduct
from models.rental import Rental
from models.restock import Restock
from models.sale import Sales
from models.membership import Membership


class ProductAll(Resource):
    # @jwt_required
    def get(self):
        return Product.return_all()

    def delete(self):
        return Product.delete_all()


class ProductEdit(Resource):
    # @jwt_required
    def post(self):
        data = request.get_json()


class ProductResource(Resource):
    # @jwt_required
    def get(self):
        args = request.args
        id = args["id"]
        result = Product.query.get(id)
        if result:
            return result.serialize()
        else:
            return "Not Found"

    # @jwt_required
    def post(self):
        data = request.get_json()
        product = Product(data)
        db.session.add(product)
        db.session.commit()
        return "success"

    def delete(self):
        args = request.args
        id = args["id"]
        product = Product.query.get(id)
        if product.default_item:
            return "Cannot de-activate default product!"
        if product.active == True:
            product.active = False
            for sub_product in product.subProducts:
                sub_product.active = False
        else:
            product.active = True
            for sub_product in product.subProducts:
                sub_product.active = True
        db.session.commit()
        return "success"


class ProductEdit(Resource):

    # @jwt_required
    def post(self):
        data = request.get_json()
        product = Product.query.get(data["id"])
        product.update(data)
        return "success"

class ProductReportAllStock(Resource):

    # @jwt_required
    def get(self):
        """
        Get All SubProducts and write to csv
        """
        print("exporting")
        data = list(map(lambda x: x.csv_format(), SubProduct.query.all()))
        csv_keys = SubProduct.get_csv_keys()
        df = pd.DataFrame(data, columns=csv_keys)
        df.to_csv("C:\\Users\\duned\\Desktop\\stock_report.csv")
        print("done")
        return {"response":"success"}


class SubProductResource(Resource):
    # @jwt_required
    def get(self):
        args = request.args
        id = args["id"]
        result = SubProduct.query.get(id)
        if result:
            return result.serialize()
        else:
            return "Not Found"

    """
    Create Subproduct
    Data Expected:

    @product_id - the id for its parent product
    @notes - notes for the subproduct
    @size - size for the subproduct
    @color - color for the subproduct
    @price - override price (leave empty to inherit parent price)
    @stock - stock for the Sub Product
    
    """
    # @jwt_required
    def post(self):
        data = request.get_json()
        sub_product = SubProduct(data)
        db.session.add(sub_product)
        db.session.commit()
        return "success"

    def delete(self):
        args = request.args
        id = args["id"]
        if SubProduct.query.get(id).active == True:
            SubProduct.query.get(id).active = False
        else:
            SubProduct.query.get(id).active = True
        db.session.commit()
        return "success"


class SubProductEdit(Resource):
    """
    Create Subproduct
    Data Expected:

    @product_id - the id for its parent product
    @notes - notes for the subproduct
    @size - size for the subproduct
    @color - color for the subproduct
    @price - override price (leave empty to inherit parent price)
    @stock - stock for the Sub Product

    """

    # @jwt_required
    def post(self):
        data = request.get_json()
        sub_product = SubProduct.query.get(data["id"])
        sub_product.update(data)
        db.session.commit()
        return "success"


class RestockResource(Resource):
    """
    Create Restock
    Data Expected:

    @sub_product_id - the id for its parent sub_product
    @notes - notes for the restock.
    @restock_amount - how much to restock.
    """

    # @jwt_required
    def post(self):
        data = request.get_json()
        sub_product = SubProduct.query.get(data["sub_product_id"])
        sub_product.stock += data["restock_amount"]
        restock = Restock(data)
        db.session.add(restock)
        db.session.commit()
        return "success"


class RentalResource(Resource):
    """
    Rent a product
    Data Expected:

    @sub_product_id - the id for its parent sub_product
    @member_id - the id of the member who is renting the product
    @notes - notes for the rental.
    @duration - duration for the rental.
    """

    # @jwt_required
    def post(self):
        data = request.get_json()
        rental = Rental(data)
        db.session.add(rental)
        db.session.commit()
        return "success"


class ReportItemsInStock(Resource):
    """
    Find all items with subproducts.
    report them...
    """

    # @jwt_required
    def post(self):
        data = request.get_json()
        rental = Rental(data)
        db.session.add(rental)
        db.session.commit()
        return "success"
