import { Component, OnInit, Input } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'view-purchase-history-modal',
  templateUrl: './view-purchase-history.component.html',
  styleUrls: ['./view-purchase-history.component.css']
})
export class ViewPurchaseHistoryComponent implements OnInit {
  @Input() member_ref;

  purchasesBufferArray:any[];
  purchasesDisplay:any[] = new Array(10).fill(undefined);
  constructor(
    private modalService:ModalService,
    private mainService:MainService
  ) { }

  ngOnInit(): void {
    this.load();
  }
  async load(){
    let data = {
      "member_id":this.member_ref.id
    }
    this.mainService.getSalesByMember(data).then((result)=>{
      if(!result["response"]){
        alert("Error::Unknown Error");
      }else{        
        if(result["response"]!="success"){
          alert(result["response"]);
          return;
        }
      }
      this.purchasesBufferArray = result["data"];
      this.purchasesDisplay = this.insertIntoPlaceHolderArray(this.purchasesDisplay,result["data"]);  
    });
  }
  insertIntoPlaceHolderArray(placeHolderArray,array){
    for(var i=0;i<array.length;i++){
      if(i<placeHolderArray.length){
        placeHolderArray[i] = array[i];
      }else{
        placeHolderArray.push(array[i]);
      }
    }
    return placeHolderArray;
}
  openModal(id: string) {
    this.modalService.open(id);
}

closeModal(id: string) {
    this.modalService.close(id);
}

}
