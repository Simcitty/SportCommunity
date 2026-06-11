import {
  Component, OnInit, OnDestroy,
  ElementRef, ViewChild, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MapLoaderService } from '../../core/services/map-loader.service';
import { EventDialogComponent } from '../events/event-dialog.component';

export interface VolleyballCourt {
  placeId:           string;
  name:              string;
  address:           string;
  location:          google.maps.LatLngLiteral;
  rating?:           number;
  userRatingsTotal?: number;
  openNow?:          boolean;
  photoUrl?:         string;
  website?:          string;
  phone?:            string;
  surface?:          string;
  capacity?:         string;
  openingHours?:     string;
  description?:      string;
}

type MapStatus = 'loading' | 'locating' | 'searching' | 'ready' | 'error';

@Component({
  selector:    'app-map',
  standalone:  true,
  imports:     [CommonModule, RouterLink, EventDialogComponent],
  templateUrl: './map.component.html',
  styleUrl:    './map.component.scss',
})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild('mapCanvas', { static: false }) mapCanvas!: ElementRef<HTMLDivElement>;
  @ViewChild(EventDialogComponent) eventDialog?: EventDialogComponent;

  // ── State ────────────────────────────────────────────────────────
  status        = signal<MapStatus>('loading');
  errorMessage  = signal<string>('');
  courts        = signal<VolleyballCourt[]>([]);
  selectedCourt = signal<VolleyballCourt | null>(null);
  searchRadius  = signal<number>(5000);
  userLocation  = signal<google.maps.LatLngLiteral | null>(null);
  showEventDialog = signal<boolean>(false);

  statusLabel = computed(() => {
    const labels: Record<MapStatus, string> = {
      loading:   'Google Maps wird geladen...',
      locating:  'Standort wird ermittelt...',
      searching: 'Beachvolleyball-Plätze werden gesucht...',
      ready:     '',
      error:     '',
    };
    return labels[this.status()];
  });

  // ── Google Maps Objekte ───────────────────────────────────────────
  private map!:         google.maps.Map;
  private markers:      google.maps.Marker[] = [];
  private infoWin!:     google.maps.InfoWindow;
  private userMarker?:  google.maps.Marker;

  constructor(private mapLoader: MapLoaderService) {}

  async ngOnInit(): Promise<void> {
    try {
      this.status.set('loading');
      await this.mapLoader.load();

      this.status.set('locating');
      const pos = await this._getUserLocation();
      this.userLocation.set(pos);
      console.log(' Standort:', pos);

      this._initMap(pos);

      this.status.set('searching');
      await this._searchCourts(pos);
      this.status.set('ready');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      console.error('Karten-Fehler:', msg);
      this.errorMessage.set(msg);
      this.status.set('error');
    }
  }

  ngOnDestroy(): void {
    this.markers.forEach(m => m.setMap(null));
  }

  // ── Karte initialisieren ─────────────────────────────────────────
  private _initMap(center: google.maps.LatLngLiteral): void {
    this.map = new google.maps.Map(this.mapCanvas.nativeElement, {
      center,
      zoom:              12,
      mapTypeId:         google.maps.MapTypeId.ROADMAP,
      styles:            DARK_MAP_STYLES,
      disableDefaultUI:  false,
      zoomControl:       true,
      mapTypeControl:    false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    this.infoWin = new google.maps.InfoWindow();

    // Nutzer-Marker (blauer Punkt)
    this.userMarker = new google.maps.Marker({
      position: center,
      map:      this.map,
      title:    'Dein Standort',
      icon: {
        path:         google.maps.SymbolPath.CIRCLE,
        scale:        10,
        fillColor:    '#4285F4',
        fillOpacity:  1,
        strokeColor:  '#ffffff',
        strokeWeight: 2,
      },
      zIndex: 999,
    });
  }

  // ── Overpass API Search (OpenStreetMap - kostenlos) ───────────────
  private async _searchCourts(location: google.maps.LatLngLiteral): Promise<void> {
    try {
      const radiusKm = this.searchRadius() / 1000;
      // Radius in Grad umrechnen (ca. 111 km pro Grad)
      const radiusDeg = radiusKm / 111;

      const bbox = {
        south: location.lat - radiusDeg,
        west:  location.lng - radiusDeg,
        north: location.lat + radiusDeg,
        east:  location.lng + radiusDeg,
      };

      console.log(' Suche Plätze bei:', location, 'Radius:', this.searchRadius(), 'm');

      // Overpass API Query (kostenlos, OpenStreetMap)
      const overpassQuery = `
        [out:json];
        (
          node["sport"="beachvolleyball"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
          way["sport"="beachvolleyball"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
          node["sport"="volleyball"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
          way["sport"="volleyball"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
        );
        out center;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body:   overpassQuery,
      });

      const data = await response.json() as {
        elements: Array<{
          id: number;
          lat?: number;
          lon?: number;
          center?: { lat: number; lon: number };
          tags?: Record<string, string>;
        }>;
      };

      const mapped = data.elements
        .map((element) => {
          const lat = element.lat ?? element.center?.lat;
          const lon = element.lon ?? element.center?.lon;

          if (!lat || !lon) return null;

          const tags = element.tags || {};

          // Bessere Adresskomposition
          const addressParts = [
            tags['addr:street'],
            tags['addr:housenumber'],
            tags['addr:postcode'],
            tags['addr:city']
          ].filter(Boolean);
          const address = addressParts.length > 0 ? addressParts.join(' ') : 'Adresse unbekannt';

          return {
            placeId:           `osm-${element.id}`,
            name:              tags['name'] ?? tags['sport'] ?? 'Volleyballplatz',
            address,
            location: { lat, lng: lon },
            website:           tags['website'] || tags['contact:website'],
            phone:             tags['phone'] || tags['contact:phone'],
            surface:           tags['surface'],
            capacity:          tags['capacity'],
            openingHours:      tags['opening_hours'],
            description:       tags['description'] || tags['name:de'] || tags['alt_name'],
          } as VolleyballCourt;
        })
        .filter(Boolean) as VolleyballCourt[];

      console.log(' Gefundene Plätze:', mapped.length);
      this.courts.set(mapped);
      this._addMarkers(mapped);
    } catch (error) {
      console.error(' Fehler bei Overpass API:', error);
      this.errorMessage.set('Fehler beim Suchen von Volleyballplätzen');
      this.status.set('error');
    }
  }

  // ── Marker hinzufügen ─────────────────────────────────────────────
  private _addMarkers(courts: VolleyballCourt[]): void {
    this.markers.forEach(m => m.setMap(null));
    this.markers = [];

    courts.forEach((court, i) => {
      const marker = new google.maps.Marker({
        position:  court.location,
        map:       this.map,
        title:     court.name,
        label: {
          text:       (i + 1).toString(),
          color:      '#0a0b0e',
          fontWeight: 'bold',
          fontSize:   '12px',
        },
        icon: {
          path:         google.maps.SymbolPath.CIRCLE,
          scale:        18,
          fillColor:    '#e8ff47',
          fillOpacity:  1,
          strokeColor:  '#0a0b0e',
          strokeWeight: 2,
        },
        animation: google.maps.Animation.DROP,
      });

      marker.addListener('click', () => {
        this.selectCourt(court);
        this.map.panTo(court.location);

        const content = `
          <div style="font-family:'DM Sans',sans-serif;padding:4px;max-width:220px">
            <strong style="font-size:14px">${court.name}</strong>
            <p style="font-size:12px;color:#666;margin:4px 0">${court.address}</p>
            ${court.rating
              ? `<span style="font-size:12px">⭐ ${court.rating} (${court.userRatingsTotal})</span>`
              : ''}
          </div>`;

        this.infoWin.setContent(content);
        this.infoWin.open(this.map, marker);
      });

      this.markers.push(marker);
    });
  }

  // ── Platz auswählen ───────────────────────────────────────────────
  selectCourt(court: VolleyballCourt): void {
    this.selectedCourt.set(court);
    this.map?.panTo(court.location);
  }

  closeDetail(): void {
    this.selectedCourt.set(null);
    this.infoWin?.close();
  }

  // ── Radius ändern ─────────────────────────────────────────────────
  async changeRadius(radius: number): Promise<void> {
    this.searchRadius.set(radius);
    const loc = this.userLocation();
    if (!loc) return;
    this.status.set('searching');
    await this._searchCourts(loc);
    this.status.set('ready');
  }

  // ── Auf Nutzer-Standort zentrieren ────────────────────────────────
  centerOnUser(): void {
    const loc = this.userLocation();
    if (loc) this.map?.panTo(loc);
  }

  // ── Event Dialog öffnen ────────────────────────────────────────────
  openEventDialog(court: VolleyballCourt): void {
    this.selectedCourt.set(court);
    this.showEventDialog.set(true);
    setTimeout(() => {
      if (this.eventDialog) {
        this.eventDialog.openCreate(court.placeId, court.name);
      }
    }, 0);
  }

  closeEventDialog(): void {
    this.showEventDialog.set(false);
  }

  // ── Geolocation ───────────────────────────────────────────────────
  private _getUserLocation(): Promise<google.maps.LatLngLiteral> {
    return new Promise((resolve) => {
      const HOLLABRUNN_FALLBACK = { lat: 48.5693, lng: 15.5829 };  // Hollabrunn

      if (!navigator.geolocation) {
        console.warn('Geolocation nicht unterstützt, Fallback: Hollabrunn');
        resolve(HOLLABRUNN_FALLBACK);
        return;
      }

      // Promise mit eigenem Timeout um Race-Conditions zu vermeiden
      const timeoutId = setTimeout(() => {
        console.warn('Geolocation-Timeout (10s), Fallback: Hollabrunn');
        resolve(HOLLABRUNN_FALLBACK);
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeoutId);
          const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          console.log(' Standort erhalten:', location);
          // Speichere Standort für zukünftige Besuche
          sessionStorage.setItem('lastUserLocation', JSON.stringify(location));
          resolve(location);
        },
        (err) => {
          clearTimeout(timeoutId);
          console.warn('️ Standort verweigert oder Fehler:', err.message, '→ Fallback: Hollabrunn');
          resolve(HOLLABRUNN_FALLBACK);
        },
        { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 },
      );
    });
  }

  // ── Stars helper ─────────────────────────────────────────────────
  starsArray(rating: number): string {
    return ''.repeat(Math.round(rating)) + ''.repeat(5 - Math.round(rating));
  }

  // ── Google Maps URL ───────────────────────────────────────────────
  mapsUrl(court: VolleyballCourt): string {
    return `https://www.google.com/maps/search/?api=1&query=${court.location.lat},${court.location.lng}&query_place_id=${court.placeId}`;
  }
}

// ── Dark Map Styles ───────────────────────────────────────────────────
const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry',                    stylers: [{ color: '#1a1d24' }] },
  { elementType: 'labels.text.stroke',          stylers: [{ color: '#111318' }] },
  { elementType: 'labels.text.fill',            stylers: [{ color: '#8a939b' }] },
  { featureType: 'road',       elementType: 'geometry',       stylers: [{ color: '#272b36' }] },
  { featureType: 'road',       elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'water',      elementType: 'geometry',       stylers: [{ color: '#17263c' }] },
  { featureType: 'water',      elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'poi.park',   elementType: 'geometry',       stylers: [{ color: '#1f2b1e' }] },
  { featureType: 'poi',        elementType: 'labels',         stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',    elementType: 'geometry',       stylers: [{ color: '#2f3948' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
];
