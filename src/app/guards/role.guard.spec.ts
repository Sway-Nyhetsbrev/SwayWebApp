import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { RoleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    // Skapa mock-tjänster
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', ['loggedUser']);
    routerMock = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        RoleGuard,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    // Hämta instansen av guarden
    guard = TestBed.inject(RoleGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access if user has Admin role', () => {
    // Mocka en användare med admin-roll och id
    authServiceMock.loggedUser.and.returnValue({
      id: '123',
      email: 'admin@example.com',
      userName: 'Admin User',
      role: { id: '1', role: 'Admin' }, // Roll innehåller både id och role
    });

    const result = guard.canActivate({} as any, {} as any);

    expect(result).toBeTrue();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and navigate if user is not Admin', () => {
    // Mocka en användare utan admin-roll
    authServiceMock.loggedUser.and.returnValue({
      id: '124',
      email: 'user@example.com',
      userName: 'Regular User',
      role: { id: '2', role: 'User' }, // Roll innehåller både id och role
    });

    const result = guard.canActivate({} as any, {} as any);

    expect(result).toBeFalse();
    expect(routerMock.navigate).toHaveBeenCalledWith(['']);
  });

  it('should deny access and navigate if no user is logged in', () => {
    // Mocka ingen användare
    authServiceMock.loggedUser.and.returnValue(null);

    const result = guard.canActivate({} as any, {} as any);

    expect(result).toBeFalse();
    expect(routerMock.navigate).toHaveBeenCalledWith(['']);
  });
});
