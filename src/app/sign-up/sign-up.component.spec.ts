import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignUpComponent } from './sign-up.component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('SignUpComponent', () => {
  let component: SignUpComponent;
  let fixture: ComponentFixture<SignUpComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [SignUpComponent, FormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: {} } // pour éviter l'erreur éventuelle
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call register and navigate on successful registration', () => {
    component.email = 'test@example.com';
    component.userName = 'TestUser';
    component.password = 'Password123';
    authServiceSpy.register.and.returnValue(of(void 0));

    component.register();

    expect(authServiceSpy.register).toHaveBeenCalledWith('test@example.com', 'TestUser', 'Password123');
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/home');
  });

  it('should set errorMess on registration failure', () => {
    const error = { code: 'auth/email-already-in-use' };
    authServiceSpy.register.and.returnValue(throwError(() => error));

    component.email = 'fail@example.com';
    component.userName = 'FailUser';
    component.password = 'failpass';

    component.register();

    expect(component.errorMess).toBe('auth/email-already-in-use');
  });

  it('should alert if any field is missing', () => {
    spyOn(window, 'alert');

    component.email = '';
    component.userName = '';
    component.password = '';
    component.register();

    expect(window.alert).toHaveBeenCalledWith('Registration failed. Please fill all fields.');
    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });
});
