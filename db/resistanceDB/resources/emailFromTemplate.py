import requests
from models.emailTemplate import EmailTemplate
from jinja2 import Template
from app import config
import jinja2


def get_month(month_num):
    if month_num == 1:
        return "Jan"
    elif month_num == 2:
        return "Feb"
    elif month_num == 3:
        return "Mar"
    elif month_num == 4:
        return "Apr"
    elif month_num == 5:
        return "May"
    elif month_num == 6:
        return "Jun"
    elif month_num == 7:
        return "Jul"
    elif month_num == 8:
        return "Aug"
    elif month_num == 9:
        return "Sep"
    elif month_num == 10:
        return "Oct"
    elif month_num == 11:
        return "Nov"
    elif month_num == 12:
        return "Dec"


def send_via_mail_gun(recipients, header, content):
    if content == "":
        content = "this message is empty"
    return requests.post(
        "https://api.mailgun.net/v3/resistanceclimbing.co.nz/messages",
        auth=("api", config["MAILGUN_API_KEY"]),
        data={
            "from": "Resistance Climbing Gym <noreply@resistanceclimbing.co.nz>",
            "to": recipients,
            "subject": header,
            "html": content,
        },
    )


def emailFromTemplate(
    template_name, recipient, membership=None, invoice=None, rental=None, date=None
):
    template = EmailTemplate.query.filter(
        EmailTemplate.template_name == template_name
    ).first()

    if not template.active:
        return {"response": "success", "emailResponse": ""}

    if (recipient.do_not_send_mail == True) or (
        recipient.mail_on_internal_events == False
    ):
        return {"response": "success", "emailResponse": ""}

    msg_html = template.template_content
    msg_header = template.template_header

    # Otherwise proceed to cend...
    # today = datetime.datetime.now(timezone("Pacific/Auckland"))
    def get_full_name(member):
        return member.firstName +" " +member.lastName

    def get_date_format(date):
        if date == None:
            return ""
        else:
            return "{} {} {}".format(
                get_month(date.month), str(date.day), str(date.year)
            )

    def get_membership_description(membership):
        if membership == None:
            return ""
        else:
            return membership.description

    def get_invoice_amount(invoice):
        if invoice == None:
            return ""
        else:
            return "{:10.2f}".format(invoice.expected_amount)

    def get_invoice_id(invoice):
        if invoice == None:
            return ""
        else:
            return invoice.id[:5]

    def get_invoice_number(invoice):
        if invoice == None:
            return ""
        else:
            return invoice.description

    def get_invoice_date(invoice):
        if invoice == None:
            return ""
        else:
            return get_date_format(invoice.invoice_date)

    def get_rental_item_name(rental):
        if rental == None:
            return ""
        else:
            return rental.rental_item_name

    def get_rental_item_size(rental):
        if rental == None:
            return ""
        else:
            return rental.rental_item_size

    def get_rental_item_color(rental):
        if rental == None:
            return ""
        else:
            return rental.rental_item_color

    def get_rental_due_date(rental):
        if rental == None:
            return ""
        else:
            return get_date_format(rental.due_date)

    msg_html_parsed = Template(msg_html)
    try:
        msg_html_parsed = msg_html_parsed.render(
            MemberFullName=get_full_name(recipient),
            Date=get_date_format(date),
            MembershipDescription=get_membership_description(membership),
            InvoiceAmount=get_invoice_amount(invoice),
            InvoiceId=get_invoice_id(invoice),
            InvoiceDate=get_invoice_date(invoice),
            InvoiceNumber=get_invoice_number(invoice),
            RentalItemName=get_rental_item_name(rental),
            RentalItemSize=get_rental_item_size(rental),
            RentalItemColor=get_rental_item_color(rental),
            RentalItemDueDate=get_rental_due_date(rental),
        )
    except jinja2.exceptions.UndefinedError as e:
        return {"response": "Error::Template Variables Error", "emailResponse": str(e)}

    response = send_via_mail_gun([recipient.email], msg_header, msg_html_parsed)

    try:
        if response.json()["message"] == "Queued. Thank you.":
            return {"response": "success", "emailResponse": response.json()["message"]}
        else:
            return {
                "response": "Error::Email Failed",
                "emailResponse": response.json()["message"],
            }
    except Exception as e:
        return {"response": "Error::Email Failed", "emailResponse": str(e)}
