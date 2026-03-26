import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';

bootstrapApplication(AppComponent, appConfig)
<<<<<<< HEAD
  .catch(err => console.error(err));
=======
  .catch(() => {}); // Production error handling

>>>>>>> 11593b025aa24e4c84d21c7698ccc76055fc7f08
