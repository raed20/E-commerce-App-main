import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CartService } from './cart.service';
import { CommandeService } from './commande.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { of } from 'rxjs';
import { CartItem } from '../models/cart-item';
import { Product } from '../models/product';
import { User } from '@angular/fire/auth';
import { OrderDto } from '../models/order-dto';

describe('CartService', () => {
  let service: CartService;
  let commandeServiceSpy: jasmine.SpyObj<CommandeService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let datePipeSpy: jasmine.SpyObj<DatePipe>;

  const mockProduct: Product = {
    id: 1,
    title: 'Test Product',
    price: 100,
    description: '',
    category: '',
    discountPercentage: 0,
    rating: 0,
    stock: 0,
    tags: [],
    brand: '',
    thumbnail: ''
  };

  const mockCartItem: CartItem = {
    product: mockProduct,
    qte: 2
  };

  const mockUser: User = {
    uid: 'user123',
    email: 'test@test.com',
    displayName: 'Test User'
  } as User;

  beforeEach(() => {
    const commandeSpy = jasmine.createSpyObj('CommandeService', ['addCommande']);
    const authSpy = jasmine.createSpyObj('AuthService', ['getAuthState'], {
      user$: of(mockUser)
    });
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);
    const datePipeSpyObj = jasmine.createSpyObj('DatePipe', ['transform']);

    TestBed.configureTestingModule({
      providers: [
        CartService,
        { provide: CommandeService, useValue: commandeSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj },
        { provide: DatePipe, useValue: datePipeSpyObj }
      ]
    });

    service = TestBed.inject(CartService);
    commandeServiceSpy = TestBed.inject(CommandeService) as jasmine.SpyObj<CommandeService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    datePipeSpy = TestBed.inject(DatePipe) as jasmine.SpyObj<DatePipe>;

    // Mock localStorage
    let store: { [key: string]: string } = {};
    spyOn(localStorage, 'getItem').and.callFake((key: string) => store[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => store[key] = value);
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => delete store[key]);
    spyOn(localStorage, 'clear').and.callFake(() => store = {});

    // Ensure clean state before each test
    localStorage.clear();
    (service as any).cartItems = [];

  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle cart visibility', fakeAsync(() => {
    let result: boolean | undefined;
    service.cartVisibility$.subscribe(v => result = v);
    tick();
    expect(result).toBe(false);

    service.toggleCart();
    tick();
    expect(result).toBe(true);
  }));

  it('should add item to cart', fakeAsync(() => {
    const item = JSON.parse(JSON.stringify(mockCartItem));
    service.addToCart(item);
    tick();

    service.cartDetails$.subscribe(cart => {
      expect(cart.length).toBe(1);
      expect(cart[0].qte).toBe(2);
    });
  }));

  it('should increase quantity if item already exists', fakeAsync(() => {
    const item = JSON.parse(JSON.stringify(mockCartItem));
    service.addToCart(item);
    service.addToCart(item);
    tick();

    service.cartDetails$.subscribe(cart => {
      expect(cart.length).toBe(1);
      expect(cart[0].qte).toBe(4);
    });
  }));

  it('should remove one quantity if qte > 1', fakeAsync(() => {
    const item = JSON.parse(JSON.stringify(mockCartItem)); // qte = 2
    service.addToCart(item);
    tick();

    service.removeItem(item);
    tick();

    service.cartDetails$.subscribe(cart => {
      expect(cart.length).toBe(1);
      expect(cart[0].qte).toBe(1);
    });
  }));

  it('should remove item entirely if qte == 1', fakeAsync(() => {
    const item = { ...mockCartItem, qte: 1 };
    service.addToCart(item);
    tick();

    service.removeItem(item);
    tick();

    service.cartDetails$.subscribe(cart => {
      expect(cart.length).toBe(0);
    });
  }));

  it('should calculate total correctly', fakeAsync(() => {
    const item = JSON.parse(JSON.stringify(mockCartItem)); // price 100 * qte 2
    service.addToCart(item);
    tick();

    const total = service.getTotal();
    expect(total).toBe(200);
  }));

  it('should redirect to login if not authenticated', () => {
    authServiceSpy.getAuthState.and.returnValue(false);
    service.validerPanier();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should call addCommande and clear cart if authenticated', fakeAsync(() => {
    authServiceSpy.getAuthState.and.returnValue(true);
    datePipeSpy.transform.and.returnValue('2024-01-01');

    const item = JSON.parse(JSON.stringify(mockCartItem));
    service.addToCart(item);
    tick();

    service.validerPanier();
    tick();

    const expectedOrder = [new OrderDto(mockProduct.id, item.qte)];
    expect(commandeServiceSpy.addCommande).toHaveBeenCalledWith('user123', 200, expectedOrder);
  }));

  it('should not call addCommande if user$ is null', fakeAsync(() => {
    authServiceSpy.getAuthState.and.returnValue(true);
    Object.defineProperty(authServiceSpy, 'user$', {
      get: () => of(null)
    });

    const item = JSON.parse(JSON.stringify(mockCartItem));
    service.addToCart(item);
    tick();

    service.validerPanier();
    tick();

    expect(commandeServiceSpy.addCommande).not.toHaveBeenCalled();
  }));
});
