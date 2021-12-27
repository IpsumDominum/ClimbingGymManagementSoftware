from utils import SocketWrapper
import os
class Verifone_API:
    def __init__(self):        
        self.response_status = []
        self.connected = False
    def set_txid(self,num):
        self.txid = num % self.TXID_LIMIT
        with open("txid","w") as file:
            file.write(str(num))
    def get_txid(self):
        with open("txid",'r') as file:
            try:
                TXID = int(file.read())
            except ValueError:
                TXID = 10000
            self.txid = TXID
    def initiate_connection(self,mode="RR"):
        print("INFO::Initializing Terminal Connection.")
        try:
            self.sock = SocketWrapper()
            self.connected = True
        except Exception as e:
            print(str(e))
            self.connected = False
        valid_modes = ["RO","RR","RRP"]
        self.TXID_LIMIT = 99999999
        if(os.path.isfile("txid")):
            self.get_txid()
        else:
            self.set_txid(10000)
        if(mode not in valid_modes):
            raise AttributeError("Invalid Operational Mode, Please choose from : "+str(valid_modes))
        else:
            self.mode = mode
        print("INFO::Terminal Connection Initiated.")
    def api_communication(func):
        def wrapped(self,*params):            
            if(self.connected==False):
                print("WARNING:: Terminal connection mode not specified, using RO as Default")
                try:
                    self.initiate_connection(mode="RR")
                except Exception as e:
                    self.connected = False
                    return {"response":"Error","message":str(e)}  
            try:
                self.set_txid(self.txid+1)
                result = func(self,*params)
                self.connected = False
                return result
            except Exception as e:
                self.connected = False
                print(str(e))
                return {"response":"Error","message":str(e)}             
        return wrapped
    #@api_communication
    def check_terminal_status(self):        
        #self.sock.send_payload("TS?")
        #res = self.listen()
        #print(res)
        #return res=="TS,OK"
        return self.connected
    @api_communication
    def display_administration_menu(self):                
        self.sock.send_payload("DA,{},0".format(self.txid))
    @api_communication
    def purchase(self,amount):                
        if(self.mode=="RO"):            
            self.sock.send_payload("PR,{},0,{}".format(self.txid,amount))
        elif(self.mode=="RRP" or self.mode=="RR"):            
            if(self.mode=="RRP"):
                res = self.enable_printing()
                printed = False
                if(res!="CP,ON"): raise Exception("Printing Service Unavailable")
            elif(self.mode=="RR"):
                res = self.disable_printing()
                printed = True
                if(res!="CP,OFF"): raise Exception("Printing Service Not Turned Off Properly")
            self.send_purchase(amount)
            #print("sent purchase")
            res = self.listen()
            if(res=="RP?"):self.sock.send_payload("RP,OK")            
            response = ""
            print("Starting to listen")
            while True:
                res = self.poll_transaction_status(self.txid)
                if("PT" in res["RS"]):
                    #print("Sending back PT,OK")
                    self.sock.send_payload("PT,OK")
                    printed = True
                if(res["resp_text"] !="PROCESSING" and res["resp_text"] !="Empty"):
                    response = res["resp_text"]
                if(printed == True and response !=""):
                    break
            if(self.mode=="RRP"):
                res = self.disable_printing()
                if(res!="CP,OFF"): raise Exception("Printing Service not disabled properly")
            print("Reuqested")
            print(response)
            return response
       

    @api_communication
    def refund(self,amount):        
        if(self.mode=="RO"):            
            print(self.txid)
            self.sock.send_payload("RF,{},0,{}".format(self.txid,amount))
        elif(self.mode=="RRP"):
            pass
        elif(self.mode=="RR"):
            pass
    def print_receipt(self,message):
        self.sock.send_payload("PT,{}".format(self.txid,message))
    def send_purchase(self,amount):
        self.sock.send_payload("PR,{},0,{}".format(self.txid,amount))
    def disable_printing(self):
        self.sock.send_payload("CP?,OFF")
        res = self.listen()
        return res
    def enable_printing(self):
        self.sock.send_payload("CP?,ON")
        res = self.listen()
        return res
    def poll_transaction_status(self,txid):
        #Poll for response
        self.sock.send_payload("RS?,{},0".format(txid))
        res = self.listen()
        split = res.split(",")
        if(len(split)==7):
            res = {
            "RS":split[0],
            "txid":split[1],
            "mid":split[2],
            "resp_code":split[3],
            "resp_text":split[4],
            "card_type":split[5],
            "online_flag":split[6]
            }
            return res
        elif(len(split)==2):
            res = {
                "RS":split[0],
                "resp_text":split[1]
            }
            return res
        elif(len(split)==1):
            res =  {
                "RS":split[0],
                "resp_text":"Empty"
            }
            return res
        else:
            print("EFTPOS TERMINAL ERROR:: Requet Message not expected" +str(res))
            res =  {
                "RS":"Empty",
                "resp_text":"Empty"  
            }
            return res
    def check_printing_ok(self):
        return self.listen()=="CP,ON"
    def listen(self):
        return self.sock.wait_for_next()
    
        