import { Component, OnInit, Input, EventEmitter, AfterViewInit, ViewChild, Output } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { SignaturePad } from 'ngx-signaturepad';
import { MainService } from '../../main.service';

@Component({
  selector: 'customer-view-waiver-modal',
  templateUrl: './customer-view-waiver-modal.component.html',
  styleUrls: ['./customer-view-waiver-modal.component.css']
})
export class CustomerViewWaiverModalComponent implements OnInit{
  @Input() openModalEvent:EventEmitter<any> = new EventEmitter();
  @Output() submitted: EventEmitter<any> = new EventEmitter();
  @ViewChild(SignaturePad) signaturePad:any;

  signaturePadOptions: Object = { // passed through to szimek/signature_pad constructor
    'minWidth':0.2,
    'maxWidth':2,
    'dotSize':2,
    'penColor':"black",
    'canvasWidth': 700,
    'canvasHeight': 500,
  };

  signing:boolean = false;
  member_ref;
  constructor(
    private modalService:ModalService,
    private mainService:MainService
  ) { 
    
  }
  ngOnInit(): void {
    this.openModalEvent.subscribe(customer=>{
      this.member_ref = customer;        
      this.openModal('customer-view-waiver-modal');
    });
  }

  drawComplete() {
    // will be notified of szimek/signature_pad's onEnd event
    //console.log(this.signaturePad.toDataURL());
  }
  clearPad(){
    this.signaturePad.clear();
  }
  async saveSignature(){
    let signatureImage = this.signaturePad.toDataURL();    
    let data = {
      "member_id":this.member_ref.id,
      "signatureImage":signatureImage
    }
    await this.mainService.memberUpdateWaiverSignature(data).then((result)=>{
      if(result["response"]=="success"){
        this.member_ref.signatureImage = signatureImage;
       this.signing = false;
      }else{
        alert(result["response"]);
      }
    })
  }

  drawStart() {
    // will be notified of szimek/signature_pad's onBegin event
    //console.log('begin drawing');
  }
  
  openModal(id: string) {
    if(this.signaturePad){
      this.signaturePad.clear();
    }
    this.signing = false;
    this.modalService.open(id);
}

closeModal(id: string) {
    this.submitted.emit(this.member_ref.id);
    this.modalService.close(id);
}

getCurrentName(){
  return this.member_ref.title + " " + this.member_ref.firstName + this.member_ref.middleName + " " + this.member_ref.lastName;
}
}
