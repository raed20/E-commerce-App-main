import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignInComponent } from './sign-in.component';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [SignInComponent, FormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call login and navigate on successful login', () => {
    component.email = 'test@example.com';
    component.password = 'password123';
    authServiceSpy.login.and.returnValue(of(void 0)); // ✅ retourne void

    component.register();

    expect(authServiceSpy.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/home');
  });

  it('should show error message on login failure', () => {
    const error = { code: 'auth/invalid-credentials' };
    authServiceSpy.login.and.returnValue(throwError(() => error));

    component.email = 'wrong@example.com';
    component.password = 'wrongpass';
    component.register();

    expect(component.errorMess).toBe('auth/invalid-credentials');
  });

  it('should show alert if email or password is missing', () => {
    spyOn(window, 'alert');

    component.email = '';
    component.password = '';
    component.register();

    expect(window.alert).toHaveBeenCalledWith('Registration failed. Please fill all fields.');
  });
});
