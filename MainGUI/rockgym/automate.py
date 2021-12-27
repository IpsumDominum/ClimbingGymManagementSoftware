with open("notwritingitbyhand.txt","r") as file:
    lines = file.readlines()

toprint = ""
for item in lines:    
    item = item.replace("\n","").replace(" ","")
    toprint +='self.'+item +' = data[\"' + item +'\"]\n'
with open("hello.txt","w") as file:
    file.write(toprint)