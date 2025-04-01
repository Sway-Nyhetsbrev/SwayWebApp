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
import { UpdateNewsletterComponent } from './views/newsletter/update-newsletter/update-newsletter.component';
import { AuthGuard } from './guards/auth.guard';
import { InfoTabletComponent } from './views/info-tablet/info-tablet.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'latest-newsletter',
    component: LatestNewsletterComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'my-newsletters/:userId',
    component: MyNewslettersComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'newsletter-details/:userId/:newsletterId',
    component: NewsletterDetailsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'create-newsletter',
    component: CreateNewsletterComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'update-newsletter/:newsletterId',
    component: UpdateNewsletterComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'publish-newsletter/:newsletterId',
    component: InfoTabletComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin-portal/:userId',
    component: AdminPortalComponent,
    canActivate: [RoleGuard],
    children: [
      {
        path: 'all-newsletters',
        component: AllNewslettersComponent,
        canActivate: [RoleGuard], 
        children: [
          {
            path: 'search-newsletter',
            component: SearchBarComponent,
            canActivate: [RoleGuard]
          }
        ]
      },
      {
        path: 'all-users',
        component: AllUsersComponent,
        canActivate: [RoleGuard],
        children: [
          {
            path: 'search-user',
            component: SearchBarComponent,
            canActivate: [RoleGuard]
          },
        ]
      },
    ],
  },
  {
    path: 'user-details/:userId',
    component: UserDetailsComponent,
    canActivate: [RoleGuard]
  }
];