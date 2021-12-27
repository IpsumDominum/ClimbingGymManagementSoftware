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
from sqlalchemy import or_, and_
import datetime
from models.member import Member
from models.family import Family


class FamilyResource(Resource):
    # @jwt_required
    def get(self):
        args = request.args
        member_id = args["id"]
        family_id = Member.query.get(member_id).family
        if family_id == None:
            return {"data": [], "response": "success"}
        else:
            family = Family.query.get(family_id)
            if family != None:
                family = family.serialize()
            return {"data": family, "response": "success"}
        return

    # @jwt_required
    def post(self):
        data = request.get_json()

        primary_member_id = data["primary_member"]
        secondary_member_id = data["secondary_member"]

        primary_member = Member.query.get(primary_member_id)
        secondary_member = Member.query.get(secondary_member_id)

        if primary_member == None or secondary_member == None:
            return "Failure: Member not found for unknown reason"
        else:
            if primary_member.family == None:
                new_family = Family()
                db.session.add(new_family)

                primary_member.family = new_family.id
                primary_member_family = new_family
            else:
                primary_member_family = Family.query.get(primary_member.family)

            secondary_member.family = primary_member_family.id

            db.session.commit()
            return "success"

    def delete(self):
        args = request.args
        member_id = args["id"]
        Member.query.get(member_id).family = None
        db.session.commit()
        return "success"
