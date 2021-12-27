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
from models.paymentMethods import PaymentMethod
from models.member import Member


# Single User
class PaymentMethodResource(Resource):
    # @jwt_required
    def get(self):
        data = request.get_json()
        id = data["id"]
        return PaymentMethod.query.get(id).serialize()

    # @jwt_required
    def post(self):
        data = request.get_json()

        stripe_customer_id = data["customer"]["stripe_id"]
        if stripe_customer_id == "":
            # If customer's stipre customer isn't set up previously,
            # Attempt again
            customer_query = Member.query.get(data["customer"]["id"])
            if customer_query == None:
                return "Error::Customer not found."
            else:
                try:
                    stripe_customer = stripe.Customer.create(
                        name=data["customer"]["firstName"]
                        + data["customer"]["lastName"]
                    )
                    customer_query.set_stripe_customer(stripe_customer)
                    stripe_customer_id = stripe_customer["id"]
                    db.session.commit()
                    # If fails once more...
                except Exception as e:
                    return "Error::Unable to set up stripe customer. " + str(e)

        # ---TODO: try and catch stripe errors
        try:
            token = stripe.Token.create(
                card={
                    "number": data["number"],
                    "exp_month": data["exp_month"],
                    "exp_year": data["exp_year"],
                    "cvc": data["cvc"],
                },
            )
        except stripe.error.InvalidRequestError:
            return "Error: Could not find payment information"
        except stripe.error.CardError as e:
            return str(e)
        try:
            resource = stripe.Customer.create_source(
                stripe_customer_id,
                source=token["id"],
            )
        except stripe.error.CardError as e:
            return str(e)
        member = PaymentMethod(data, resource)
        db.session.add(member)
        db.session.commit()
        return "success"

    def delete(self):
        id = request.args["id"]
        payment_method = PaymentMethod.query.get(id)
        if(payment_method!=None):
            pass
        else:
            return {"response":"Error::Payment method not found."}
        member_query = Member.query.get(payment_method.member_id)
        currentMembership = list(filter(lambda x: x.is_active(), member_query.memberships))
        can_delete = False
        if len(currentMembership) > 0:
            """
            If the current membership is not recurring.
            """
            if(currentMembership[0].billingType!="recurring"):
                can_delete = True
            else:
                can_delete = False
        else:
            can_delete = True
        if(can_delete==True):
            """
            If chosen customer has no invoices...
            """
            stripe_response = stripe.Customer.delete_source(
                member_query.stripe_id,
                payment_method.payment_method_stripe_id
            )
            if(stripe_response["deleted"]==True):
                db.session.delete(payment_method)
                db.session.commit()
                return {"response":"success"}
            else:
                return {"response":"Stripe card deletion failed."}
        else:
            return {"response":"Cannot delete card. Member has recurring membership going on."}


class PaymentMethodAll(Resource):
    # @jwt_required
    def get(self):
        return PaymentMethod.return_all()
