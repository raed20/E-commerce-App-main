import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductDetailComponent } from './product-detail.component';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Auth } from '@angular/fire/auth';

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let cartServiceSpy: jasmine.SpyObj<CartService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const activatedRouteStub = {
    paramMap: of({
      get: (key: string) => '1' // simulate route param 'id' = '1'
    })
  };

  const authMock = {}; // mock minimal

  beforeEach(async () => {
    productServiceSpy = jasmine.createSpyObj('ProductService', ['getProductById']);
    cartServiceSpy = jasmine.createSpyObj('CartService', ['addToCart']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['someMethod']); // mock si besoin

    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: CartService, useValue: cartServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Auth, useValue: authMock }  // <-- important !
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should set productId from route params and call getProduct on ngOnInit', () => {
    const mockProduct = { id: 1, title: 'Test Product', price: 100 } as any;
    productServiceSpy.getProductById.and.returnValue(of(mockProduct));
    spyOn(component, 'getProduct').and.callThrough();

    component.ngOnInit();

    expect(component.productId).toBe(1);
    expect(component.getProduct).toHaveBeenCalled();

    // Since getProduct uses productService.getProductById asynchronously, trigger it:
    fixture.detectChanges();

    expect(component.produit).toEqual(mockProduct);
  });

  it('should call addToCart on CartService and alert on addToPanier', () => {
    spyOn(window, 'alert');
    const mockProduct = { id: 1, title: 'Test Product', price: 100 } as any;
    component.produit = mockProduct;
    component.quantity = 3;

    component.addToPanier();

    expect(cartServiceSpy.addToCart).toHaveBeenCalledWith(jasmine.objectContaining({
      product: mockProduct,
      qte: 3
    }));
    expect(window.alert).toHaveBeenCalledWith('Test Product added to cart!');
  });

  it('should not call addToCart if produit is undefined in addToPanier', () => {
    component.produit = undefined as any;
if (!cartServiceSpy.addToCart.calls) {
  spyOn(cartServiceSpy, 'addToCart');
}

    spyOn(window, 'alert');

    component.addToPanier();

    expect(cartServiceSpy.addToCart).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  });
});
