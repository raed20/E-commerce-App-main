import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { of, BehaviorSubject } from 'rxjs';
import { OrdersComponent } from './orders.component';
import { CommandeService } from '../services/commande.service';
import { ProductService } from '../services/product.service';
import { AuthService } from '../services/auth.service';
import { Commande } from '../models/commande';
import { Product } from '../models/product';
import { OrderDto } from '../models/order-dto';
import { User } from '@angular/fire/auth';

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;
  let mockCommandeService: jasmine.SpyObj<CommandeService>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockDatePipe: jasmine.SpyObj<DatePipe>;
  let mockUser$: BehaviorSubject<User | null>;

  const mockUser: User = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User'
  } as User;

  const mockOrderDetails1: OrderDto[] = [
    new OrderDto(1, 2),
    new OrderDto(2, 1)
  ];

  const mockOrderDetails2: OrderDto[] = [
    new OrderDto(3, 1)
  ];

  const mockCommandes: Commande[] = [
    new Commande('test-user-id', 100.50, '2023-12-01T10:00:00Z', mockOrderDetails1),
    new Commande('test-user-id', 75.99, '2023-12-02T14:30:00Z', mockOrderDetails2)
  ];

  // Add IDs after creation (since they're optional in constructor)
  mockCommandes[0].id = '1';
  mockCommandes[1].id = '2';

  const mockProducts: Product[] = [
    {
      id: 1,
      title: 'iPhone 14 Pro',
      description: 'Latest iPhone with advanced features',
      category: 'smartphones',
      price: 999.99,
      discountPercentage: 5.5,
      rating: 4.8,
      stock: 50,
      tags: ['apple', 'smartphone', 'mobile'],
      brand: 'Apple',
      thumbnail: 'https://example.com/iphone14.jpg'
    },
    {
      id: 2,
      title: 'Samsung Galaxy S23',
      description: 'Premium Android smartphone',
      category: 'smartphones',
      price: 799.99,
      discountPercentage: 8.0,
      rating: 4.6,
      stock: 30,
      tags: ['samsung', 'android', 'smartphone'],
      brand: 'Samsung',
      thumbnail: 'https://example.com/galaxy-s23.jpg'
    },
    {
      id: 3,
      title: 'MacBook Pro 13"',
      description: 'Powerful laptop for professionals',
      category: 'laptops',
      price: 1299.99,
      discountPercentage: 3.0,
      rating: 4.9,
      stock: 20,
      tags: ['apple', 'laptop', 'computer'],
      brand: 'Apple',
      thumbnail: 'https://example.com/macbook-pro.jpg'
    }
  ];

  beforeEach(async () => {
    // Create spies for services
    mockCommandeService = jasmine.createSpyObj('CommandeService', ['getCommandesByUserId']);
    mockProductService = jasmine.createSpyObj('ProductService', ['getProductById']);
    mockAuthService = jasmine.createSpyObj('AuthService', [], {
      user$: new BehaviorSubject<User | null>(null)
    });
    mockDatePipe = jasmine.createSpyObj('DatePipe', ['transform']);

    // Get reference to the user$ BehaviorSubject
    mockUser$ = mockAuthService.user$ as BehaviorSubject<User | null>;

    await TestBed.configureTestingModule({
      imports: [OrdersComponent],
      providers: [
        { provide: CommandeService, useValue: mockCommandeService },
        { provide: ProductService, useValue: mockProductService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: DatePipe, useValue: mockDatePipe }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty commandes array', () => {
      expect(component.commandes).toEqual([]);
    });

    it('should initialize with null selectedCommande', () => {
      expect(component.selectedCommande).toBeNull();
    });

    it('should initialize with empty productNameMap', () => {
      expect(component.productNameMap.size).toBe(0);
    });

    it('should call loadOrders on ngOnInit', () => {
      spyOn(component, 'loadOrders');
      component.ngOnInit();
      expect(component.loadOrders).toHaveBeenCalled();
    });
  });

  describe('loadOrders method', () => {
    it('should load orders when user is authenticated', () => {
      // Setup mocks
      mockCommandeService.getCommandesByUserId.and.returnValue(of(mockCommandes));
      mockDatePipe.transform.and.returnValue('2023-12-01');

      // Execute
      component.loadOrders();
      mockUser$.next(mockUser);

      // Verify
      expect(mockCommandeService.getCommandesByUserId).toHaveBeenCalledWith('test-user-id');
      expect(component.commandes).toEqual(jasmine.arrayContaining([
        jasmine.objectContaining({
          id: '1',
          userId: 'test-user-id',
          dateCommande: '2023-12-01',
          montant: 100.50
        })
      ]));
      expect(mockDatePipe.transform).toHaveBeenCalledWith('2023-12-01T10:00:00Z', 'yyyy-MM-dd');
    });

    it('should not load orders when user is not authenticated', () => {
      // Execute
      component.loadOrders();
      mockUser$.next(null);

      // Verify
      expect(mockCommandeService.getCommandesByUserId).not.toHaveBeenCalled();
      expect(component.commandes).toEqual([]);
    });

    it('should handle date transformation returning null', () => {
      // Setup mocks
      mockCommandeService.getCommandesByUserId.and.returnValue(of(mockCommandes));
      mockDatePipe.transform.and.returnValue(null);

      // Execute
      component.loadOrders();
      mockUser$.next(mockUser);

      // Verify
      expect(component.commandes[0].dateCommande).toBe('');
    });
  });

  describe('showDetails method', () => {
    it('should set selectedCommande and call loadProductNames', () => {
      spyOn(component, 'loadProductNames');
      const commande = mockCommandes[0];

      component.showDetails(commande);

      expect(component.selectedCommande).toBe(commande);
      expect(component.loadProductNames).toHaveBeenCalled();
    });
  });

  describe('closeDetails method', () => {
    it('should set selectedCommande to null', () => {
      component.selectedCommande = mockCommandes[0];

      component.closeDetails();

      expect(component.selectedCommande).toBeNull();
    });
  });

  describe('loadProductNames method', () => {
    beforeEach(() => {
      component.selectedCommande = mockCommandes[0];
    });

    it('should clear productNameMap and load product names for selected commande', () => {
      spyOn(component, 'fetchProductName').and.returnValue(Promise.resolve('Product Name'));

      component.loadProductNames();

      expect(component.productNameMap.size).toBe(2);
      expect(component.fetchProductName).toHaveBeenCalledWith(1);
      expect(component.fetchProductName).toHaveBeenCalledWith(2);
    });

    it('should not load product names when selectedCommande is null', () => {
      component.selectedCommande = null;
      spyOn(component, 'fetchProductName');

      component.loadProductNames();

      expect(component.fetchProductName).not.toHaveBeenCalled();
      expect(component.productNameMap.size).toBe(0);
    });

    it('should clear existing productNameMap before loading new product names', () => {
      // Add some existing entries
      component.productNameMap.set(999, Promise.resolve('Old Product'));
      expect(component.productNameMap.size).toBe(1);

      spyOn(component, 'fetchProductName').and.returnValue(Promise.resolve('New Product'));

      component.loadProductNames();

      expect(component.productNameMap.size).toBe(2); // Should only have new entries
      expect(component.productNameMap.has(999)).toBeFalsy();
    });
  });

  describe('fetchProductName method', () => {
    it('should return product title as Promise', async () => {
      const mockProduct = mockProducts[0];
      mockProductService.getProductById.and.returnValue(of(mockProduct));

      const result = await component.fetchProductName(1);

      expect(mockProductService.getProductById).toHaveBeenCalledWith(1);
      expect(result).toBe('iPhone 14 Pro');
    });

    it('should handle product service call correctly', async () => {
      const mockProduct: Product = {
        id: 2,
        title: 'Test Product',
        description: 'A test product description',
        category: 'test-category',
        price: 30.00,
        discountPercentage: 0,
        rating: 4.0,
        stock: 100,
        tags: ['test', 'product'],
        brand: 'Test Brand',
        thumbnail: 'https://example.com/test.jpg'
      };
      mockProductService.getProductById.and.returnValue(of(mockProduct));

      const promise = component.fetchProductName(2);

      expect(promise).toBeInstanceOf(Promise);
      const result = await promise;
      expect(result).toBe('Test Product');
    });
  });

  describe('Integration Tests', () => {
    it('should properly handle the complete flow of showing order details', async () => {
      // Setup
      mockProductService.getProductById.and.returnValues(
        of(mockProducts[0]),
        of(mockProducts[1])
      );

      const commande = mockCommandes[0];

      // Execute
      component.showDetails(commande);

      // Verify
      expect(component.selectedCommande).toBe(commande);
      expect(component.productNameMap.size).toBe(2);

      // Wait for promises to resolve
      const productName1 = await component.productNameMap.get(1);
      const productName2 = await component.productNameMap.get(2);

      expect(productName1).toBe('iPhone 14 Pro');
      expect(productName2).toBe('Samsung Galaxy S23');
    });

    it('should handle switching between different commandes', async () => {
      // Setup first commande
      mockProductService.getProductById.and.returnValue(of(mockProducts[0]));
      component.showDetails(mockCommandes[0]);

      expect(component.productNameMap.size).toBe(2);

      // Switch to second commande
      mockProductService.getProductById.and.returnValue(of(mockProducts[2]));
      component.showDetails(mockCommandes[1]);

      expect(component.selectedCommande).toBe(mockCommandes[1]);
      expect(component.productNameMap.size).toBe(1); // Should be cleared and repopulated
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in commande service gracefully', () => {
      mockCommandeService.getCommandesByUserId.and.returnValue(of([]));

      component.loadOrders();
      mockUser$.next(mockUser);

      expect(component.commandes).toEqual([]);
    });

    it('should handle product service errors in fetchProductName', async () => {
      const mockProduct: Product = {
        id: 1,
        title: 'Fallback Product',
        description: 'A fallback product',
        category: 'fallback',
        price: 0,
        discountPercentage: 0,
        rating: 0,
        stock: 0,
        tags: [],
        brand: 'Unknown',
        thumbnail: ''
      };
      mockProductService.getProductById.and.returnValue(of(mockProduct));

      const result = await component.fetchProductName(1);

      expect(result).toBe('Fallback Product');
    });
  });
});
