import socket
import binascii
import time
class MySocket:
    def __init__(self, sock=None):
        self.MSGLEN = 20
        if sock is None:
            self.sock = socket.socket(
                            socket.AF_INET, socket.SOCK_STREAM)
        else:
            self.sock = sock
    def connect(self, host, port):
        self.sock.connect((host, port))
    def byte_encode(self,msg):
        def byte_cast(hex_val):
            return bytes.fromhex(hex_val)
        return b"".join(list(map(byte_cast,msg)))
    def send(self, msg):
        bytes_encoded = self.byte_encode(msg)
        sent = self.sock.send(bytes_encoded)        
        return sent!=0
    def receive(self):
        self.sock.settimeout(5)
        try:
            res = self.sock.recv(1024)
            return res
        except socket.timeout as e:
            return b'----Timeout-'
class SocketWrapper:

    def __init__(self,address="192.168.1.29",port=20001):
        self.sock = MySocket()
        self.sock.connect(address,port)
    def print_hex(self,message):
        for item in message:
            print(hex(item),end=" ")
    def lrc(self,byte_array):
        b = 0x00
        for byte in byte_array:
            b = b ^ int(byte,16)
        return "{0:#0{1}x}".format(b,4)[2:]
    def ascii_to_hex(self,char):
        return hex(ord(char))[2:]
    def encode_hex(self,char_array):
        return list(map(self.ascii_to_hex,char_array))
    def wait_for_next(self):
        res = self.sock.receive()
        return "".join(list(map(chr,res[4:-1])))
    def send_payload(self,payload):
        header = self.encode_hex("V2")
        #lrc = [self.lrc(payload)]
        payload = self.encode_hex(payload)
        payload_length_format = "{0:#0{1}x}".format(len(payload),6).split("x")[1]
        payload_length = [payload_length_format[:2],payload_length_format[2:]]
        lrc = [self.lrc(payload)]
        message = header + payload_length + payload + lrc
        return self.sock.send(message)
