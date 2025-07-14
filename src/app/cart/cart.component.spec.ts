import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartComponent } from './cart.component';
import { CartService } from '../services/cart.service';
import { of } from 'rxjs';
import { CartItem } from '../models/cart-item';
import { By } from '@angular/platform-browser';

// Mock CartService
class FakeCartService {
  cartVisibility$ = of(true);
  cartDetails$ = of([
    {
      product: { title: 'Product 1', price: 25 },
      qte: 1,
    },
    {
      product: { title: 'Product 2', price: 30 },
      qte: 1,
    },
  ] as CartItem[]); // 2 items
 getTotal() {
    return 130; // 50*2 + 30*1
  }
  toggleCart() {}
  validerPanier() {}
  removeItem(item: CartItem) {}
}

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartComponent],
      providers: [{ provide: CartService, useClass: FakeCartService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display the cart when isVisible is true', () => {
    const titleElement = fixture.debugElement.query(By.css('h5.offcanvas-title'));
    expect(titleElement.nativeElement.textContent).toContain('Your Cart');
  });

  // ✅ NEW TEST HERE
  it('should display correct number of items in the cart badge', () => {
  const badgeElement = fixture.debugElement.query(By.css('.badge'));
  console.log('Badge content:', badgeElement.nativeElement.textContent.trim());
  expect(badgeElement.nativeElement.textContent.trim()).toBe('2');
});
  it('should display the right total price using getTotal()', () => {
    expect(component.totalPrice).toBe(130);
    console.log('✅ Total price from getTotal():', component.totalPrice);
  });


});
