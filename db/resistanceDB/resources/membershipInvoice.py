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
from app import db
from sqlalchemy import or_
import stripe
from models.membershipInvoice import MembershipInvoice
from models.member import Member


# Single User
class MembershipInvoiceResource(Resource):
    # @jwt_required
    def get(self):
        args = request.args
        id = args["id"]
        invoice = MembershipInvoice.query.get(id)
        if invoice != None:
            invoice.confirm_self()
            db.session.commit()
            return {"response": "success"}
        else:
            return {"response": "Error::Invoice not found."}
        """
        data = request.get_json()
        id = data["id"]
        return MembershipInvoice.query.get(id).serialize()
        """
    # @jwt_required
    def post(self):
        data = request.get_json()
        id = data["id"]
        invoice = MembershipInvoice.query.get(id)
        if invoice != None:
            try:
                result = invoice.retry_self()
                db.session.commit()
                if(result=="success"):
                    return {"response":"success"}
                else:
                    return {"response":"Invoice retry failed...Reason::{}".format(result)}
            except Exception as e:
                return {"response":"Error::{}".format(str(e))}
            db.session.commit()
            return {"response": "success"}
        else:
            return {"response": "Error::Invoice not found."}
        return "success"
    def delete(self):
        args = request.args
        id = args["id"]
        invoice = MembershipInvoice.query.get(id)
        if invoice != None:
            invoice.void_self()
            db.session.commit()
            return {"response": "success"}
        else:
            return {"response": "Error::Invoice not found."}


class MembershipInvoiceAll(Resource):
    # @jwt_required
    def get(self):
        return MembershipInvoice.return_all()
