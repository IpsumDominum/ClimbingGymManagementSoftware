import { Component, OnInit } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/angular'; // useful for typechecking

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  today:Date = new Date();

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    height:'800px'
  };

  
  constructor() { setInterval(() => {
    this.today = new Date();
  }, 1);}

  ngOnInit(): void {

  }

}
