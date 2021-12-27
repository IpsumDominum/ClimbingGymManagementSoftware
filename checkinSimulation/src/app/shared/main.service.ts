import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {DataService} from './data.service';
import { BehaviorSubject, from, Observable, of } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class MainService {

  constructor(
    private http:HttpClient,
    private dataService:DataService
  ) { }
  async checkIn(id){
    return await this.dataService
    .post('Checkin?id='+id,{},false)
    .then(data=>{
      return data;
    });
  } 
  async getAllUsers(){
    return await this.dataService
    .get('Member/All',false)
    .then(data=>{
      return data;
    });
  } 
  async getAllProducts(){
    return await this.dataService
    .get('Product/All',true)
    .then(data=>{
      return data;
    });
  } 
  async createMember(data){
    return await this.dataService
    .post('Member',data,true)
    .then(data=>{
      return data;
    });
  } 
  async createProduct(data){
    return await this.dataService
    .post('Product',data,true)
    .then(data=>{
      return data;
    });
  } 
  async searchMember(data){
    return await this.dataService
    .post('Member/Search',data,true)
    .then(data=>{
      return data;
    });
  } 
  async confirmSale(data){
    return await this.dataService
    .post('Sale',data,true)
    .then(data=>{
      return data;
    })
  }
  async getSalesToday(data){
    return await this.dataService
    .post('Sale/All',data,true)
    .then(data=>{
      return data;
    });
  }
  async getSalesByMember(data){
    return await this.dataService
    .post('Sale/GetByMember',data,true)
    .then(data=>{
      return data;
    });
  }
  async createMembership(data){
    return await this.dataService
    .post('Membership',data,true)
    .then(data=>{
      return data;
    });
  }
  async deleteSaleEntry(data){
  return await this.dataService
  .post('Sale/Delete',data,true)
  .then(data=>{
    return data;
  });
  }
  async getMember(id){
    return await this.dataService
    .get('Member?id='+id,true)
    .then(data=>{
      return data;
    });
  }
  async deleteMember(id){
    return await this.dataService
    .delete('Member?id='+id,true)
    .then(data=>{
      return data;
    });
  }
  async editMember(data){
    return await this.dataService
    .post('Member/Edit',data,true)
    .then(data=>{
      return data;
    });
  }

  async createPaymentMethod(data){
    return await this.dataService
    .post('PaymentMethod/New',data,true)
    .then(data=>{
      return data;
    });
  }
  async getAllMemberships(){
    return await this.dataService
    .get('Membership/All',true)
    .then(data=>{
      return data;
    });
  }
  async getProduct(id){
    return await this.dataService
    .get('Product?id='+id,true)
    .then(data=>{
      return data;
    });
  }
  async deleteProduct(id){
    return await this.dataService
    .delete('Product?id='+id,true)
    .then(data=>{
      return data;
    });
  }
  async editProduct(data){
    return await this.dataService
    .post('Product/Edit',data,true)
    .then(data=>{
      return data;
    });
  }
  /*
  SUBPRODUCT ENDPOINTS
  */
  async getSubProduct(id){
    return await this.dataService
    .get('SubProduct?id='+id,true)
    .then(data=>{
      return data;
    });
  }
  async deleteSubProduct(id){
    return await this.dataService
    .delete('SubProduct?id='+id,true)
    .then(data=>{
      return data;
    });
  }
  async createSubProduct(data){
    return await this.dataService
    .post('SubProduct',data,true)
    .then(data=>{
      return data;
    });
  }
  async editSubProduct(data){
    return await this.dataService
    .post('SubProduct/Edit',data,true)
    .then(data=>{
      return data;
    });
  }
  /*
  RESTOCK ENDPOINTS
  */
  async addRestock(data){
    return await this.dataService
    .post('Restock',data,true)
    .then(data=>{
      return data;
    });
  }
  /*
  INVOICES ENDPOINTS
  */
  async getInvoicesByUser(id){
    return await this.dataService
    .get('Invoices/ByUser?id='+id,true)
    .then(data=>{
      return data;
    });   
  }
  async getAllInvoices(){
    return await this.dataService
    .get('Invoices/All',true)
    .then(data=>{
      return data;
    });   
  }
  /*
  Membership Freeze
  */
 async toggleMembershipFreeze(data){
  return await this.dataService
  .post('Membership/Freeze',data,true)
  .then(data=>{
    return data;
  });
}
  /*
  Membership Cancel
  */
  async cancelMembership(id){
    return await this.dataService
    .delete('Membership?id='+id,true)
    .then(data=>{
      return data;
    });
  }
  /*
 Temp waivers
  */
 async getTempWaivers(){  
  return await this.dataService
  .get('WaiverTemp',true)
  .then(data=>{
    return data;
  });
}
async fetchNewWaivers(){  
  return await this.dataService
  .get('WaiverTempFetchFromStation',true)
  .then(data=>{
    return data;
  });
}
async getWaiverFetchLogs(){  
  return await this.dataService
  .get('WaiverTempFetchLog',true)
  .then(data=>{
    return data;
  });
}

async markWaiverTempAsSolved(id){  
  return await this.dataService
  .delete('WaiverTemp?id='+id,true)
  .then(data=>{
    return data;
  });
}

/*
Family
*/
async getFamily(id){  
  return await this.dataService
  .get('Family?id='+id,true)
  .then(data=>{
    return data;
  });
}
async addFamily(data){  
  return await this.dataService
  .post('Family',data,true)
  .then(data=>{
    return data;
  });
}
async removeFromFamily(id){  
  return await this.dataService
  .delete('Family?id='+id,true)
  .then(data=>{
    return data;
  });
}
/*
Rental
*/
async getAllRentals(){  
  return await this.dataService
  .get('RentalAll',true)
  .then(data=>{
    return data;
  });
}
async getRentalsByMember(id){  
  return await this.dataService
  .get('RentalGetByMember?id='+id,true)
  .then(data=>{
    return data;
  });
}
async getRentalsBySubProduct(id){  
  return await this.dataService
  .get('RentalGetBySubProduct?id='+id,true)
  .then(data=>{
    return data;
  });
}

}