import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartComponent } from './cart.component';
import { CartService } from '../services/cart.service';
import { of } from 'rxjs';
import { CartItem } from '../models/cart-item';
import { By } from '@angular/platform-browser';

// ✅ Mock CartService with correct logic and spies
class FakeCartService {
  cartVisibility$ = of(true);
  cartDetails$ = of([
    {
      product: { title: 'Product 1', price: 50 },
      qte: 2,
    },
    {
      product: { title: 'Product 2', price: 30 },
      qte: 1,
    },
  ] as CartItem[]); // 2 items, 130 total

  getTotal = jasmine.createSpy().and.returnValue(130);
  toggleCart = jasmine.createSpy();
  validerPanier = jasmine.createSpy();
  removeItem = jasmine.createSpy();
}

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;
  let cartService: FakeCartService;

  beforeEach(async () => {
    cartService = new FakeCartService();

    await TestBed.configureTestingModule({
      imports: [CartComponent],
      providers: [{ provide: CartService, useValue: cartService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the cart when isVisible is true', () => {
    const titleElement = fixture.debugElement.query(By.css('h5.offcanvas-title'));
    expect(titleElement.nativeElement.textContent).toContain('Your Cart');
  });

  it('should display correct number of items in the cart badge', () => {
    const badgeElement = fixture.debugElement.query(By.css('.badge'));
    expect(badgeElement.nativeElement.textContent.trim()).toBe('2');
  });

  it('should display the right total price using getTotal()', () => {
    expect(component.totalPrice).toBe(130);
    expect(cartService.getTotal).toHaveBeenCalled();
  });

  it('should call toggleCart when toggleCart() is triggered', () => {
    component.toggleCart();
    expect(cartService.toggleCart).toHaveBeenCalled();
  });

  it('should call validerPanier when valider() is triggered', () => {
    component.valider();
    expect(cartService.validerPanier).toHaveBeenCalled();
  });
it('should call removeItem when removeItem() is triggered with an item', () => {
  const item = {
    product: {
      id: 1,
      title: 'Product 1',
      price: 50,
      description: 'A great product',
      category: 'electronics',
      discountPercentage: 10,
      rating: 4.5,
      stock: 100,
      brand: 'TestBrand',
      thumbnail: 'image.jpg',
    },
    qte: 2,
  } as CartItem;

  component.removeItem(item);
  expect(cartService.removeItem).toHaveBeenCalledWith(item);
});

});
