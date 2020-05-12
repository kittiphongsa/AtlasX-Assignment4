/*
  Copyright 2019 Esri
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnDestroy
} from "@angular/core";
import { Subscription } from 'rxjs';
import { loadModules } from "esri-loader";
import esri = __esri; // Esri TypeScript Types
import { LocationService } from '../services/location.service';
import { CustomPoint } from '../locator/custompoint.class';

@Component({
  selector: "app-esri-map",
  templateUrl: "./esri-map.component.html",
  styleUrls: ["./esri-map.component.scss"]
})
export class EsriMapComponent implements OnInit, OnDestroy {
  @Output() mapLoadedEvent = new EventEmitter<boolean>();
  @Output() locationChangedEvent = new EventEmitter<CustomPoint>();

  // The <div> where we will place the map
  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;

  /**
   * _zoom sets map zoom
   * _center sets map center
   * _basemap sets type of map
   * _loaded provides map loaded status
   */
  private _zoom = 10;
  private _center: Array<number> = [0.1278, 51.5074];
  private _basemap = "streets";
  private _loaded = false;
  private _view: esri.MapView = null;
  private _graphicsLayer: esri.GraphicsLayer = null;

  // Location Subscription
  private locationSub: Subscription;

  get mapLoaded(): boolean {
    return this._loaded;
  }

  @Input()
  set zoom(zoom: number) {
    this._zoom = zoom;
  }

  get zoom(): number {
    return this._zoom;
  }

  @Input()
  set center(center: Array<number>) {
    this._center = center;
  }

  get center(): Array<number> {
    return this._center;
  }

  @Input()
  set basemap(basemap: string) {
    this._basemap = basemap;
  }

  get basemap(): string {
    return this._basemap;
  }

  constructor(public locService: LocationService) {}

  async initializeMap() {
    try {
      // Load the modules for the ArcGIS API for JavaScript
      const [
        EsriMap,
        EsriMapView,
        EsriGraphic,
        EsriGraphicsLayer,
        EsriMapImageLayer
      ] = await loadModules([
        "esri/Map",
        "esri/views/MapView",
        "esri/Graphic",
        "esri/layers/GraphicsLayer",
        "esri/layers/MapImageLayer"
      ]);

      // Configure the Map
      const mapProperties: esri.MapProperties = {
        basemap: this._basemap
      };

      const map: esri.Map = new EsriMap(mapProperties);

      // Create graphic layer and set initial center point
      const graphicsLayer = new EsriGraphicsLayer();

      const point = {
        type: "point",
        longitude: this._center[0],
        latitude: this._center[1]
      };

      const simpleMarkerSymbol = {
        type: "simple-marker",
        color: [226, 119, 40],  // orange
        outline: {
          color: [255, 255, 255], // white
          width: 1
        }
      };

      const pointGraphic = new EsriGraphic({
        geometry: point,
        symbol: simpleMarkerSymbol
      });

      graphicsLayer.add(pointGraphic);

      this._graphicsLayer = graphicsLayer;

      // Add graphic layer to map
      map.add(graphicsLayer);

      // Create map image layer
      const mapImageLayer = new EsriMapImageLayer({
        url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer",
        sublayers: [{
          id: 3,
          visible: true,
          popupTemplate: {
            title: "{STATE_NAME}",
            content: "Population 2007: {POP2007}<br />Area: {Shape_Area}"
          }
        }]
      });

      // Add graphic layer to map
      map.add(mapImageLayer);

      // Initialize the MapView
      const mapViewProperties: esri.MapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this._center,
        zoom: this._zoom,
        map: map
      };

      this._view = new EsriMapView(mapViewProperties);

      await this._view.when();

      this._view.on("click",(e) => {
        console.log("Clicked on " + e.mapPoint.latitude + "," + e.mapPoint.longitude);
        this._view.goTo([e.mapPoint.longitude,e.mapPoint.latitude]);
        this._center = [e.mapPoint.longitude,e.mapPoint.latitude];
        this.locService.setLocation(e.mapPoint.longitude,e.mapPoint.latitude);
        this.locationChangedEvent.emit(new CustomPoint(e.mapPoint.longitude,e.mapPoint.latitude));
      });

      return this._view;

    } catch (error) {
      console.log("EsriLoader: ", error);
    }
  }

  ngOnInit() {
    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(mapView => {
      // The map has been initialized
      console.log("mapView ready: ", this._view.ready);
      this._loaded = this._view.ready;
      this.mapLoadedEvent.emit(true);

      // Set initial center point to Locator and LocationService
      this.locService.setLocation(this._center[0],this._center[1]);

      // Subscribe for center point update
      this.locationSub = this.locService.getLocationUpdateListener().subscribe(async (location: CustomPoint) => {

        // Change center point
        try {
          const [EsriGraphic] = await loadModules([
            "esri/Graphic"
          ]);

          this._center = [location.longitude,location.latitude];

          mapView.goTo({
            target: [location.longitude,location.latitude],
            center: [location.longitude,location.latitude]
          });

          var currentPointGraphic = this._graphicsLayer.graphics.getItemAt(0);

          this._graphicsLayer.remove(currentPointGraphic);

          const point = {
            type: "point",
            longitude: this._center[0],
            latitude: this._center[1]
          };

          const simpleMarkerSymbol = {
            type: "simple-marker",
            color: [226, 119, 40],  // orange
            outline: {
              color: [255, 255, 255], // white
              width: 1
            }
          };

          const newPointGraphic = new EsriGraphic({
            geometry: point,
            symbol: simpleMarkerSymbol
          });

          this._graphicsLayer.add(newPointGraphic);

        } catch (error) {
          console.log("EsriLoader: ", error);
        }

      });

    });
  }

  ngOnDestroy() {
    if (this._view) {
      // destroy the map view
      this._view.container = null;
      this.locationSub.unsubscribe();
    }
  }
}
