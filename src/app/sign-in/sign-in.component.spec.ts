import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignInComponent } from './sign-in.component';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [
        SignInComponent,
        FormsModule,
        RouterTestingModule.withRoutes([]) // Configuration avec routes vides
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router); // Récupère le router du TestBed
    spyOn(router, 'navigateByUrl'); // Espionne la méthode navigateByUrl
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call login and navigate on successful login', () => {
    component.email = 'test@example.com';
    component.password = 'Password123';
    authServiceSpy.login.and.returnValue(of(void 0));

    component.register();

    expect(authServiceSpy.login).toHaveBeenCalledWith('test@example.com', 'Password123');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/home');
  });

  it('should set errorMess on login failure', () => {
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
