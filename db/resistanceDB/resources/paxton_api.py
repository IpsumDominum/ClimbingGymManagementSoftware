"""
Sample script to add a new user
"""

from Net2Scripting import init_logging
from Net2Scripting.net2xs import Net2XS

# Uncomment to use dotnet DateTime objects
from System import DateTime

from datetime import datetime


class PaxtonDoorControl:
    def __init__(self):
        # Init log4net
        init_logging()
        # Operator id 0 is System Engineer
        self.OPERATOR_ID = 0
        # Default Net2 password
        self.OPERATOR_PWD = "771023"
        # When running on the machine where Net2 is installed
        self.NET2_SERVER = "localhost"
        self.net2 = Net2XS(self.NET2_SERVER)

    def paxton_is_user(self, member_id):
        member_id = str(member_id)
        try:
            self.net2.authenticate(self.OPERATOR_ID, self.OPERATOR_PWD)
        except Exception:
            return False#{"response": "Error::Unable To Authenticate"}
        res_id = self.net2.get_user_id_by_name((member_id, member_id))
        if res_id != -1:
            print(self.net2.get_access_level_id_by_user(res_id))
            return True
        else:
            return False

    def paxton_add_user(
        self,
        member_id=None,
        middle_name=None,
        sur_name=None,
        telephone_no=None,
    ):
        if member_id == None or member_id == "":
            return {"response": "Error::Member id cannot be None"}
        try:
            self.net2.authenticate(self.OPERATOR_ID, self.OPERATOR_PWD)
        except Exception:
            return {"response": "Error::Unable To Authenticate"}
        # Add new user
        res = self.net2.add_user(
            access_level_id=0,  # No Access
            department_id=2,  # No department
            anti_passback_ind=False,
            alarm_user_ind=False,
            first_name=str(member_id),
            middle_name=middle_name + " " + sur_name,
            sur_name=str(member_id),
            telephone_no=telephone_no,
            telephone_extension=None,
            pin_code=None,
            activation_date=None,  # Now
            active=True,
            fax_no=None,
            expiry_date=None,
        )  # Never expire (also see activation_date)
        if res:
            return {"response": "success"}
        else:
            return {"response": "failure"}

    def paxton_revoke_access(self, member_id):
        member_id = str(member_id)
        try:
            self.net2.authenticate(self.OPERATOR_ID, self.OPERATOR_PWD)
        except Exception:
            return {"response": "Error::Unable To Authenticate"}
        res_id = self.net2.get_user_id_by_name((member_id, member_id))
        if res_id != -1:
            # all_cards = Net2XS.dataset_to_str(net2.get_cards(res_id))
            res = self.net2.modify_user_access_level(res_id, 0)
            if res:
                return {"response": "success"}
            else:
                return {
                    "response": "Error::Access Revoking Failed. Is paxton connected? Possibly error due to card already used.Try a different card."
                }
        else:
            return {"response": "Error::Paxton User Id Not Found"}

    def paxton_give_after_hours_access(self, member_id):
        member_id = str(member_id)
        try:
            self.net2.authenticate(self.OPERATOR_ID, self.OPERATOR_PWD)
        except Exception:
            return {"response": "Error::Unable To Authenticate"}
        res_id = self.net2.get_user_id_by_name((member_id, member_id))
        if res_id != -1:
            # all_cards = Net2XS.dataset_to_str(net2.get_cards(res_id))
            res = self.net2.modify_user_access_level(res_id, 3)
            if res:
                return {"response": "success"}
            else:
                return {
                    "response": "Error::Access Granting failed. Is paxton connected? Possibly error due to card already used.Try a different card."
                }
        else:
            return {"response": "Error::Paxton User Id Not Found"}

    def paxton_add_user_card(self, member_id, card_id):
        member_id = str(member_id)
        try:
            self.net2.authenticate(self.OPERATOR_ID, self.OPERATOR_PWD)
        except Exception:
            return {"response": "Error::Unable To Authenticate"}
        res_id = self.net2.get_user_id_by_name((member_id, member_id))
        if res_id != -1:
            # all_cards = Net2XS.dataset_to_str(net2.get_cards(res_id))
            res = self.net2.add_card(card_id, 0, res_id)
            if res:
                return {"response": "success"}
            else:
                return {
                    "response": "Error::Card adding failed. Is paxton connected? Possibly error due to card already used.Try a different card."
                }
        else:
            return {"response": "Error::Paxton User Id Not Found"}

    def paxton_delete_card(self, card_id):
        member_id = str(member_id)
        try:
            self.net2.authenticate(self.OPERATOR_ID, self.OPERATOR_PWD)
        except Exception:
            return {"response": "Error::Unable To Authenticate"}
        res = self.net2.delete_card(card_id)
        return res

    def paxton_get_cards(self, member_id):
        member_id = str(member_id)
        try:
            self.net2.authenticate(self.OPERATOR_ID, self.OPERATOR_PWD)
        except Exception:
            return {"response": "Error::Unable To Authenticate"}
        res_id = self.net2.get_user_id_by_name((member_id, member_id))
        if res_id != -1:
            res = self.net2.get_cards(user_id=res_id)
            if res:
                return {"response": "success", "data": Net2XS.dataset_to_str(res)}
            else:
                return {
                    "response": "Error::Card adding failed. Is paxton connected? Possibly error due to card already used.Try a different card."
                }
        else:
            return {"response": "Error::Paxton User Id Not Found"}

    def paxton_clear_all_cards(self, member_id):
        member_id = str(member_id)
        try:
            self.net2.authenticate(self.OPERATOR_ID, self.OPERATOR_PWD)
        except Exception:
            return {"response": "Error::Unable To Authenticate"}
        res_id = self.net2.get_user_id_by_name((member_id, member_id))
        if res_id != -1:
            res = self.net2.get_cards(user_id=res_id)
            if res:
                cards = Net2XS.dataset_to_str(res)
                cards_split = cards.split("\n")[1:]
                for card in cards_split:
                    start_idx = card.find("CardNumber=")
                    tail = card[start_idx + 11 :]
                    finish_idx = tail.find(",")
                    tail = tail[:finish_idx]
                    del_res = self.net2.delete_card(tail)
                    if del_res:
                        pass
                    else:
                        return {
                            "response": "Error::Card deletion failed. Is Card already deleted? Is paxton connected?"
                        }
                return {"response": "success"}
            else:
                return {
                    "response": "Error::Card deletion failed. Is paxton connected? Possibly error due to card already used.Try a different card."
                }
        else:
            return {"response": "Error::Paxton User Id Not Found"}

    def paxton_set_user_card(self, member_id, paxton_card_id):
        if paxton_card_id == "":
            return {"response": "success"}
        member_id = str(member_id)

        try:
            self.net2.authenticate(self.OPERATOR_ID, self.OPERATOR_PWD)
        except Exception:
            return {"response": "Error::Unable To Authenticate"}
        res_id = self.net2.get_user_id_by_name((member_id, member_id))
        if res_id != -1:
            res = self.net2.get_cards(user_id=res_id)
            if res:
                cards = Net2XS.dataset_to_str(res)
                cards_split = cards.split("\n")[1:]
                for card in cards_split:
                    start_idx = card.find("CardNumber=")
                    tail = card[start_idx + 11 :]
                    finish_idx = tail.find(",")
                    tail = tail[:finish_idx]
                    del_res = self.net2.delete_card(tail)
                    if del_res:
                        pass
                    else:
                        return {
                            "response": "Error::Card deletion failed. Is Card already deleted? Is paxton connected?"
                        }
                add_res = self.net2.add_card(int(paxton_card_id), 0, res_id)
                if add_res:
                    return {"response": "success"}
                else:
                    return {
                        "response": "Error::Card adding failed. Is paxton connected? Possibly error due to card already used.Try a different card."
                    }
            else:
                return {
                    "response": "Error::Unable to fetch existing cards. Is paxton connected?"
                }
        else:
            return {"response": "Error::Paxton User Id Not Found"}


# api = PaxtonDoorControl()
# api.net2.authenticate(api.OPERATOR_ID, api.OPERATOR_PWD)
# cards = Net2XS.dataset_to_str(api.net2.get_cards())
# users = Net2XS.dataset_to_str(api.net2.get_users())
# print(cards)
# member_id = "3e38c428-6e34-11eb-aa04-3c7c3fc38b58"
# print(api.paxton_clear_all_cards(member_id))
# print(users)
