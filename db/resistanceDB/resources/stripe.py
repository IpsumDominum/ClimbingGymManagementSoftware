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
import models
from flask import Flask, request, jsonify
from app import db
from sqlalchemy import or_
from flask_http_response import success, result, error


class StripeWebHooks(Resource):
    def post(self):
        payload = request.get_json()
        event = None

        try:
            event = stripe.Event.construct_from(payload, stripe.api_key)
        except ValueError as e:
            # Invalid payload
            return error(message="Invalid Payload", status=400)

        # Handle the event
        if event.type == "payment_intent.succeeded":
            payment_intent = event.data.object  # contains a stripe.PaymentIntent
            # Then define and call a method to handle the successful payment intent.
            # handle_payment_intent_succeeded(payment_intent)
            print("payment succeeded")
        elif event.type == "payment_method.attached":
            payment_method = event.data.object  # contains a stripe.PaymentMethod
            # Then define and call a method to handle the successful attachment of a PaymentMethod.
            # handle_payment_method_attached(payment_method)
            print("payment method attached")
        elif event.type == "invoice.payment_failed":
            print(event)
        else:
            pass
            # print('Unhandled event type {}'.format(event.type))

        return success.return_response(message="success", status=200)
