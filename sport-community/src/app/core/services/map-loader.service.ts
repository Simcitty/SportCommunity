import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MapLoaderService {
  private _loaded  = false;
  private _loading: Promise<void> | null = null;

  load(): Promise<void> {
    if (this._loaded)  return Promise.resolve();
    if (this._loading) return this._loading;

    this._loading = new Promise<void>((resolve, reject) => {
      // Callback-Name den Google Maps Script aufruft wenn fertig
      const callbackName = '__googleMapsReady__';
      (window as unknown as Record<string, unknown>)[callbackName] = () => {
        this._loaded = true;
        resolve();
      };

      const script    = document.createElement('script');
      // Google Maps wird nur noch für die Kartendarstellung benötigt (nicht für Places API)
      script.src      = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&callback=${callbackName}&language=de`;
      script.async    = true;
      script.defer    = true;
      script.onerror  = () => reject(new Error('Google Maps konnte nicht geladen werden'));
      document.head.appendChild(script);
    });

    return this._loading;
  }
}
