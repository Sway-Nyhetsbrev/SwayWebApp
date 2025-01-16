import { Routes } from '@angular/router';
import { HomeComponent } from './views/home/home.component';
import { MyNewslettersComponent } from './views/newsletter/my-newsletters/my-newsletters.component';
import { CreateNewsletterComponent } from './views/newsletter/create-newsletter/create-newsletter.component';
import { LatestNewsletterComponent } from './views/newsletter/latest-newsletter/latest-newsletter.component';
import { AdminPortalComponent } from './views/admin/admin-portal/admin-portal.component';
import { RoleGuard } from './guards/role.guard';
import { NewsletterDetailsComponent } from './views/newsletter/newsletter-details/newsletter-details.component';
import { AllUsersComponent } from './views/admin/admin-portal/all-users/all-users.component';
import { AllNewslettersComponent } from './views/admin/admin-portal/all-newsletters/all-newsletters.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { UserDetailsComponent } from './views/admin/admin-portal/user-details/user-details.component';
import { UpdateNewsletterComponent } from './views/admin/admin-portal/update-newsletter/update-newsletter.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'latest-newsletter',
    component: LatestNewsletterComponent,
  },
  {
    path: 'my-newsletters/:userId',
    component: MyNewslettersComponent,
  },
  {
    path: 'newsletter-details/:userId/:newsletterId',
    component: NewsletterDetailsComponent,
  },
  {
    path: 'create-newsletter',
    component: CreateNewsletterComponent,
  },
  {
    // Skydda admin-portal med RoleGuard
    path: 'admin-portal/:userId',
    component: AdminPortalComponent,
    canActivate: [RoleGuard],
    children: [
        {
          path: 'all-newsletters',
          component: AllNewslettersComponent,
          children: [
            {
              path: 'search-newsletter',
              component: SearchBarComponent
            }
          ]
        },
        {
          path: 'all-users',
          component: AllUsersComponent,
          children: [
            {
              path: 'search-user',
              component: SearchBarComponent
            },
          ]
        },
    ],
  },
  {
    path: 'user-details/:userId',
    component: UserDetailsComponent,
    canActivate: [RoleGuard]
  },
  {
    path: 'update-newsletter/:newsletterId',
    component: UpdateNewsletterComponent,
    canActivate: [RoleGuard]
  }
];
