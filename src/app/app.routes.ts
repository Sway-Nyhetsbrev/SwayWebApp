import { Routes } from '@angular/router';
import { NewsletterComponent } from './views/newsletter/newsletter.component';
import { HomeComponent } from './views/home/home.component';


export const routes: Routes = [
    {
        path:"",
        component:HomeComponent
    },
    {
        path: "newsletter",
        component: NewsletterComponent
    }

];
