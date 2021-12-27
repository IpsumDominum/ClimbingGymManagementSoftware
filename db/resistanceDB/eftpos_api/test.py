from API import Verifone_API

print("Started")
api = Verifone_API()
print("Connection initiated")
api.initiate_connection("RR")
api.purchase(20)
print("sent purchaseg")
#print(api.check_terminal_status())
#api.display_administration_menu()

"""
The following features should be done for the POS:

Purchase, print purchased items
Refund
Purchase with Cash out, print purchased items

Do all of this only if terminal is available
"""
