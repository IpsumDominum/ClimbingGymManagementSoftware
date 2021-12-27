import stripe
import time

"""

start = time.time()
price = stripe.Price.retrieve(
    ""
)
print(price)
end = time.time()

print(end-start)
"""

list_id = ""

member_info = {
    "email_address": "",
    "status": "subscribed",
    "merge_fields": {"FNAME": "", "LNAME": ""},
}

try:
    response = mailchimp.lists.add_list_member(list_id, member_info)
    print("response: {}".format(response))
except ApiClientError as error:
    print("An exception occurred: {}".format(error.text))
# response = mailchimp.ping.get()
# print(response)
