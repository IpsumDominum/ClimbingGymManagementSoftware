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
from models.alerts import Alerts
import sys
sys.path.append("eftpos_api")
from API import Verifone_API

#TODO test api initialization success
api = Verifone_API()

# Get alerts
class EftposResource(Resource):
    def get(self):
        eftposReady = api.check_terminal_status()
        return {"response":"success","eftposReady":eftposReady}        
    def post(self):
        #TODO test api initialization success
        #return {"response":"success","message":"test"}
        data = request.get_json()
        try:
            api.initiate_connection(mode="RR")
        except Exception as e:
            return {"response":"error","message":"api initialization error"}
        try:
            mode = data["mode"]            
        except KeyError:
            return {"response":"failure","message":"mode not specified"}
        try:
            amount = data["amount"]            
        except KeyError:
            amount = None
        eftposReady =api.check_terminal_status()
        if(eftposReady==False):
            return {"response":"failure","message":"ERROR::Eftpos connection error."}

        #TODO Check for response errors
        try:
            if(mode=="refund"):            
                if(amount!=None):
                    result = api.refund(amount)
                else:
                    return {"response":"failure","message":"requested operation {} requires parameter 'amount', which is not given.".format(mode)}
            if(mode=="purchase"):
                if(amount!=None):
                    result = api.purchase(amount)
                    print(result)
                    return {"response":"success","message":result}
                else:
                    return {"response":"failure","message":"requested operation {} requires parameter 'amount', which is not given.".format(mode)}
            if(mode=="admin_menu"):
                api.display_administration_menu()
                return {"response":"success"}
        except Exception as e:
            return {"response":"error","message":str(e)}
        return {"response":"failure","message":"no actions performed."}
    def delete(self):
        args = request.args
        id = args["id"]
        return {"response":"success"}
