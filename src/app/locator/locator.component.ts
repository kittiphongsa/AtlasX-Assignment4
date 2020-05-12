import { Component, EventEmitter, OnInit, Input, Output, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { CustomPoint } from './custompoint.class';
import { LocationService } from '../services/location.service';

@Component({
  selector: 'app-locator',
  templateUrl: './locator.component.html',
  styleUrls: ['./locator.component.css']
})
export class LocatorComponent implements OnInit, OnDestroy {

  location: CustomPoint;

  currentLat: number;
  currentLng: number;

  // Location Subscription
  private locationSub: Subscription;

  @Input() formTitle = "Locator";
  @Input() set locatePoint(point: CustomPoint){
    this.location = point;
    this.currentLng = point.longitude;
    this.currentLat = point.latitude;
  }

  get locatePoint(){
    return this.location;
  }

  @Output() located = new EventEmitter<CustomPoint>();

  constructor(public locService: LocationService){}

  ngOnInit(){
    console.log("ngOnInit",this.location);
  }

  ngOnDestroy(){
    this.locationSub.unsubscribe();
  }

  onLocate(){
    this.location = new CustomPoint(this.currentLng,this.currentLat);
    this.located.emit(this.location);
    this.locService.setLocation(this.currentLng,this.currentLat);
    console.log("onLocate",this.location);
  }

}
