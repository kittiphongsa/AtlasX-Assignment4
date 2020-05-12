import { Component } from '@angular/core';

import { CustomPoint } from './locator/custompoint.class';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  // Set our map properties
  mapPoint = new CustomPoint(-122.4194, 37.7749);
  basemapType = 'satellite';
  mapZoomLevel = 5;

  // See app.component.html
  mapLoadedEvent(status: boolean) {
    console.log('The map loaded: ' + status);
  }

  locationChangedEvent(location: CustomPoint){
    console.log('Location changed: ', location);
    this.mapPoint = location;
  }

}

