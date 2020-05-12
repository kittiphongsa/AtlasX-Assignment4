import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { CustomPoint } from '../locator/custompoint.class';

@Injectable({providedIn: 'root'})
export class LocationService {

  private location: CustomPoint = undefined;
  private locationSet = new Subject<CustomPoint>();

  getLocation(){
    return this.location;
  }

  getLocationUpdateListener(){
    return this.locationSet.asObservable();
  }

  setLocation(lng: number, lat: number){
    this.location = new CustomPoint(lng,lat);
    this.locationSet.next(this.location);
    console.log("In Service",this.location);
  }

}
