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
from app import db, paxton_api
from sqlalchemy import or_
from models.alerts import Alerts
from models.member import Member

# Assign Paxton Card Id To Member
class PaxtonCardResource(Resource):
    """
    Not very useful, but included here anyway.
    """

    def get(self):
        args = request.args
        member_id = args["id"]
        member_query = Member.query.get(member_id)
        if member_query == None:
            return {"response": "Error::Cannot find member"}
        else:
            return {"response": "success", "data": member_query.paxton_card_id}

    def post(self):
        data = request.get_json()
        try:
            paxton_card_id = data["paxton_card_id"]
            member_id = data["member_id"]
        except ValueError as e:
            return {
                "response": "Error::One or more data fields not present, first:{ "
                + str(e)
                + " }"
            }
        """
        Check Member Exists
        """
        member_query = Member.query.get(member_id)
        if member_query == None:
            return {"response": "Error::Member not found."}
        else:
            pass
        """
        Assign Card To Member
        """
        paxton_res = member_query.set_paxton_card_id(data["paxton_card_id"])
        if paxton_res["response"] == "success":
            db.session.commit()
            return {"response": "success"}
        else:
            return {"response": "Error::" + paxton_res["response"]}

    """
    Remove Associated Card Id
    """

    def delete(self):
        args = request.args
        member_id = args["id"]
        member_query = Member.query.get(member_id)
        if member_query == None:
            return {"response": "Error::Cannot find member"}
        else:
            if paxton_api.paxton_is_user(member_query.id):
                clear_res = paxton_api.paxton_clear_all_cards(member_query.id)
                member_query.paxton_card_id = ""
                db.session.commit()
                return clear_res
            else:
                res = paxton_api.paxton_add_user(
                    member_query.id,
                    member_query.firstName + " " + member_query.middleName,
                    member_query.lastName,
                    member_query.homephone,
                )
                if res["response"] != "success":
                    return {"response": "Error::Paxton Member Creation Failed"}
                else:
                    clear_res = paxton_api.paxton_clear_all_cards(member_query.id)
                    member_query.paxton_card_id = ""
                    db.session.commit()
                    return clear_res
            return {"response": "Error::Unexpected Error"}
