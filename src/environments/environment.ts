export const environment = {
  production: false,
  // Uses relative /api path — proxied to http://localhost:8080 via proxy.conf.json
  // This avoids CORS issues entirely. Requires: ng serve --configuration development
  apiUrl: '/api'
};
