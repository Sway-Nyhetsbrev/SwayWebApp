import { Routes } from '@angular/router';
import { HomeComponent } from './views/home/home.component';
import { MyNewslettersComponent } from './views/newsletter/my-newsletters/my-newsletters.component';
import { CreateNewsletterComponent } from './views/newsletter/create-newsletter/create-newsletter.component';
import { AllNewslettersComponent } from './views/newsletter/all-newsletters/all-newsletters.component';
import { LatestNewsletterComponent } from './views/newsletter/latest-newsletter/latest-newsletter.component';
import { AdminPortalComponent } from './views/admin/admin-portal/admin-portal.component';
import { RoleGuard } from './guards/role.guard';
import { NewsletterDetailsComponent } from './views/newsletter/newsletter-details/newsletter-details.component';

export const routes: Routes = [
    {
        path:"",
        component:HomeComponent
    },
    {
        path: "latest-newsletter",
        component: LatestNewsletterComponent
    },
    {
        path: "my-newsletters",
        component: MyNewslettersComponent,
        children: [{
            path: "newsletter-details",
            component: NewsletterDetailsComponent
        }]
    },
    {
        path: "create-newsletter",
        component: CreateNewsletterComponent,
    },
    {
        path: "all-newsletters",
        component: AllNewslettersComponent,
        children: [{
            path: "newsletter-details",
            component: NewsletterDetailsComponent
        }]
    },
    {
        // Skydda admin-portal med RoleGuard     
        path: 'admin-portal',
        component: AdminPortalComponent,
        canActivate: [RoleGuard]
      }
];
