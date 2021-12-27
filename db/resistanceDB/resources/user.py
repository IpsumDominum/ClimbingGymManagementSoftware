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

from models.user import User
from models.user import RevokedTokenModel

"""ENDPOINTS"""


class UserRegistration(Resource):
    def post(self):
        try:
            data = request.get_json()
            username = data["username"]
            password = data["password"]
        except Exception as e:
            return "some field not right" + str(e)

        user = User(username=username, password=password)
        userFound = User.query.filter_by(username=username).first()
        if userFound == None:
            # make a call to the model to authenticate
            db.session.add(user)
            db.session.commit()
            access_token = create_access_token(identity=data["username"])
            refresh_token = create_refresh_token(identity=data["username"])
            return jsonify(
                {
                    "message": "User {} was created".format(data["username"]),
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                }
            )
        else:
            return "user already exists"


class UserLogin(Resource):
    def post(self):
        try:
            data = request.get_json()
            username = data["username"]
            password = data["password"]
        except Exception as e:
            return "Login has failed due to unknown exception, please report to developer..."

        userFound = User.query.filter_by(username=username).first()
        if userFound != None:
            authentication = userFound.check_password(password)
        else:
            return "no user found with username {}".format(username)

        if authentication == False:
            return "Invalid password"
        else:
            access_token = create_access_token(identity=username)
            refresh_token = create_refresh_token(identity=username)
            return jsonify(
                {
                    "message": "successfully logged in {}".format(username),
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                }
            )


class UserLogoutAccess(Resource):
    @jwt_required
    def post(self):
        jti = get_raw_jwt()["jti"]
        try:
            revoked_token = RevokedTokenModel(jti=jti)
            revoked_token.add()
            return {"message": "Access token has been revoked"}
        except Exception as e:
            return {"message": "Something went wrong {}".format(str(e))}, 500


class UserLogoutRefresh(Resource):
    @jwt_refresh_token_required
    def post(self):
        jti = get_raw_jwt()["jti"]
        try:
            revoked_token = RevokedTokenModel(jti=jti)
            revoked_token.add()
            return {"message": "Refresh token has been revoked"}
        except:
            return {"message": "Something went wrong"}, 500


class TokenRefresh(Resource):
    @jwt_refresh_token_required
    def post(self):
        current_user = get_jwt_identity()
        access_token = create_access_token(identity=current_user)
        return {"access_token": access_token}


class SecretResource(Resource):
    @jwt_required
    def get(self):
        return "Got the secret"


class TokenRefresh(Resource):
    @jwt_refresh_token_required
    def post(self):
        current_user = get_jwt_identity()
        access_token = create_access_token(identity=current_user)
        return {"access_token": access_token}
