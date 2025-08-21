export {};
declare global {
  interface Window {
    bootstrap: any;
    GeoSearch: {
      GeoSearchControl: new (opts: any) => any;
      OpenStreetMapProvider: new (opts?: any) => any;
    };
  }
}
