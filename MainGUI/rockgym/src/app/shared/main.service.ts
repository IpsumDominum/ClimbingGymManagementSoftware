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

  async getAllUsers(){
    return await this.dataService
    .get('Member/All',true)
    .then(data=>{
      return data;
    });
  } 
  async memberUpdateWaiverSignature(data){
    return await this.dataService
    .post("Member/UpdateWaiver",data,false)
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
  async editSale(data){
    return await this.dataService
    .post('Sale/Edit',data,true)
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
  async searchSales(data){
    return await this.dataService
    .post('Sale/Search',data,true)
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
  /*Membership*/
  async createMembership(data){
    return await this.dataService
    .post('Membership',data,true)
    .then(data=>{
      return data;
    });
  }
  async searchMembership(data){
    return await this.dataService
    .post('Membership/Search',data,true)
    .then(data=>{
      return data;
    });
  }
  /*Member*/  
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
    .post('PaymentMethod',data,true)
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
  async voidInvoice(id){
    return await this.dataService
    .delete('MembershipInvoice?id='+id,true)
    .then(data=>{
      return data;
    });   
  }
  async confirmInvoice(id){
    return await this.dataService
    .get('MembershipInvoice?id='+id,true)
    .then(data=>{
      return data;
    });   
  }
  async retryInvoice(id){
    return await this.dataService
    .post('MembershipInvoice',{'id':id},true)
    .then(data=>{
      return data;
    });   
  }
  async searchInvoices(data){
    return await this.dataService
    .post('Invoices/Search',data,true)
    .then(data=>{
      return data;
    });   
  }
  /*
  Membership Freeze
  */
 async MembershipFreeze(data){
  return await this.dataService
  .post('Membership/Freeze',data,true)
  .then(data=>{
    return data;
  });
}
async MembershipHoliday(data){
  return await this.dataService
  .post('Membership/Holiday',data,true)
  .then(data=>{
    return data;
  });
}

async MembershipFreezeAll(){
  return await this.dataService
  .get('Membership/FreezeAll',true)
  .then(data=>{
    return data;
  });
}
async MembershipUnFreezeAll(){
  return await this.dataService
  .delete('Membership/FreezeAll',true)
  .then(data=>{
    return data;
  });
}
async MembershipHolidayAll(){
  return await this.dataService
  .get('Membership/HolidayAll',true)
  .then(data=>{
    return data;
  });
}
async MembershipTerminateHolidayAll(){
  return await this.dataService
  .delete('Membership/HolidayAll',true)
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
  async cancelAllMemberships(){
    return await this.dataService
    .delete('Membership/All',true)
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
  .get('Rental/All',true)
  .then(data=>{
    return data;
  });
}
async getRentalsByMember(id){  
  return await this.dataService
  .get('Rental/GetByMember?id='+id,true)
  .then(data=>{
    return data;
  });
}
async getRentalsBySubProduct(id){  
  return await this.dataService
  .get('Rental/GetBySubProduct?id='+id,true)
  .then(data=>{
    return data;
  });
}
async rentalMarkAllAsReturned(){  
  return await this.dataService
  .delete('Rental/MarkAsReturned',true)
  .then(data=>{
    return data;
  });
}
async rentalMarkAsReturned(id){  
  return await this.dataService
  .get('Rental/MarkAsReturned?id='+id,true)
  .then(data=>{
    return data;
  });
}
async rentalMarkAsLost(id){  
  return await this.dataService
  .get('Rental/MarkAsLost?id='+id,true)
  .then(data=>{
    return data;
  });
}
async rentalMarkAsDamaged(id){  
  return await this.dataService
  .get('Rental/MarkAsDamaged?id='+id,true)
  .then(data=>{
    return data;
  });
}
/*
Alerts
*/
async getAllAlerts(){
  return await this.dataService
  .get('Alerts',true)
  .then(data=>{
    return data;
  });
}
async markAlertAsSolved(id){
  return await this.dataService
  .delete('Alerts?id='+id,true)
  .then(data=>{
    return data;
  });
}
/*
Checkins
*/
async getAllCheckins(data){
  return await this.dataService
  .post('Checkin/GetAll',data,true)
  .then(data=>{
    return data;
  }); 
}
async getCheckinHistoryByMember(data){
  return await this.dataService
  .post('GetCheckinHistoryByMember',data,true)
  .then(data=>{
    return data;
  }); 
}
/*
  Send email 
*/
async getAllEmailTemplates(){
  return await this.dataService
  .get('Email',true)
  .then(data=>{
    return data;
  }); 
}
async sendArbitaryEmail(mailData){
  return await this.dataService
  .post('Email',mailData,true)
  .then(data=>{
    return data;
  }); 
}
async editEmailTemplate(data){
  return await this.dataService
  .post('Email/EditTemplate',data,true)
  .then(data=>{
    return data;
  }); 
}
async toggleTemplateActivation(id){
  return await this.dataService
  .delete('Email?id='+id,true)
  .then(data=>{
    return data;
  }); 
}
async getMailQueue(){
  return await this.dataService
  .get('Email/MailQueue',true)
  .then(data=>{
    return data;
  });  
}

async cancelMailingJob(mail_queue_id){
  return await this.dataService
  .delete('Email/MailQueue?id='+mail_queue_id,true)
  .then(data=>{
    return data;
  });  
}

/*Paxton Card*/
async addPaxtonCardToUser(paxton_card_id,member_id){
  let data = {
    "paxton_card_id":paxton_card_id,
    "member_id":member_id
  }
  return await this.dataService
  .post('Paxton/Card',data,true)
  .then(data=>{
    return data;
  });  
}

async clearUserPaxtonCard(member_id){
  return await this.dataService
  .delete('Paxton/Card?id='+member_id,true)
  .then(data=>{
    return data;
  });  
}
async checkIn(id){
  return await this.dataService
  .get('Checkin?id='+id,false)
  .then(data=>{
    return data;
  });
} 
async revokeCheckIn(id){
  return await this.dataService
  .delete('Checkin?id='+id,false)
  .then(data=>{
    return data;
  });
}
async reportAllStock(){
  return await this.dataService
  .get('Product/ReportAllStock',false)
  .then(data=>{
    return data;
  });
}
async getOverdueRentals(data){
  return await this.dataService
  .post('Rental/All',data,false)
  .then(data=>{
    return data;
  });
}
async deletePaymentMethod(id){
  return await this.dataService
  .delete('PaymentMethod?id='+id,false)
  .then(data=>{
    return data;
  });
}
async getSystemLogs(date){
  return await this.dataService
  .post('System/SystemLogs',date,false)
  .then(data=>{
    return data;
  }); 
}
async getSystemChecks(){
  return await this.dataService
  .get('System/SystemChecks',false)
  .then(data=>{
    return data;
  }); 
}
async getDailyCheckProgress(){
  return await this.dataService
  .post('CheckDaily',[],false)
  .then(data=>{
    return data;
  });   
}
async triggerDailyCheck(){
  return await this.dataService
  .get('CheckDaily',false)
  .then(data=>{
    return data;
  }); 
}
  async checkTerminalOK(){
    return await this.dataService
    .get('EFTPOS',false)
    .then(data=>{
      return data;
    });   
  }
  async sendEFTPOSOperation(data){
    return await this.dataService
    .post('EFTPOS',data,false)
    .then(data=>{
      return data;
    });   
  }
}