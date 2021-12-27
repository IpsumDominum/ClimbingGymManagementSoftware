import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'eftpos-menu-modal',
  templateUrl: './eftpos-menu-modal.component.html',
  styleUrls: ['./eftpos-menu-modal.component.css']
})
export class EftposMenuModalComponent implements OnInit {

  @Output() submitted: EventEmitter<any> = new EventEmitter();
  @Input() openModalEvent:EventEmitter<any> = new EventEmitter();

  page:number = 1;
  terminalOK = false;
  eftpos_input:string = "0.00";
  debug_message:string ="asldkajlsdkjlajsdl";
  constructor(
    private modalService:ModalService,
    private mainService:MainService
  ) { }
  ngOnInit(){
    this.openModalEvent.subscribe(data=>{
      this.checkEftposReady();
    this.openModal('eftpos-menu-modal');
    });
  }
  async checkEftposReady(){    
    await this.mainService.checkTerminalOK().then((result)=>{      
      console.log(result);
      if(result["response"]=="success"){
        this.terminalOK = result["eftposReady"];
      }
    });
  }
  openModal(id: string) {
    this.modalService.open(id);
}

  closeModal(id: string) {
    this.modalService.close(id);
  }
async purchase(){
  await this.mainService.sendEFTPOSOperation({"mode":"purchase","amount":parseFloat(this.eftpos_input)*100}).then((result)=>{      
    if(result["response"]=="success"){
      //Set response ...
      alert(result["message"]);
    }else{
      alert(result["message"]);
    }
  });
}
async refund(){
  await this.mainService.sendEFTPOSOperation({"mode":"refund","amount":20}).then((result)=>{      
    if(result["response"]=="success"){
      
    }else{
      alert(result["message"]);
    }
  });
}
async open_administration_menu(){
  await this.mainService.sendEFTPOSOperation({"mode":"admin_menu","amount":0}).then((result)=>{      
    if(result["response"]=="success"){
      
    }else{
      alert(result["message"]);
    }
  });
}
clicked(button){
  if(button=="back"){
    this.eftpos_input = this.eftpos_input.slice(0,this.eftpos_input.length-1);
  }else if(button=="clear"){
    this.eftpos_input = "0.00";
  }else if(button=="plus"){
    this.eftpos_input = (parseFloat(this.eftpos_input)+1).toString();
  }else if(button=="minus"){
    this.eftpos_input = (parseFloat(this.eftpos_input)-1).toString();
  }else if(this.eftpos_input=="0.00"){
    this.eftpos_input = button;
  }else{
    if(button.length==1 || button=="00"){
      this.eftpos_input += button;
    }else{
      this.eftpos_input = button;
    }
  }
}

}