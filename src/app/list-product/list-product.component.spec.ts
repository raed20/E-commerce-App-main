import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListProductComponent } from './list-product.component';
import { ProductService } from '../services/product.service';
import { of, BehaviorSubject } from 'rxjs';
import { Product } from '../models/product';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('ListProductComponent', () => {
  let component: ListProductComponent;
  let fixture: ComponentFixture<ListProductComponent>;
  let productService: jasmine.SpyObj<ProductService>;

  const searchQuerySubject = new BehaviorSubject<string>('');
  const categorySubject = new BehaviorSubject<string>('All Categories');

  beforeEach(async () => {
    const productServiceSpy = jasmine.createSpyObj('ProductService', [
      'getAllProducts',
      'getProductBykey',
      'getProductBycategory'
    ], {
      searchQuery$: searchQuerySubject.asObservable(),
      category$: categorySubject.asObservable()
    });
await TestBed.configureTestingModule({
  imports: [ListProductComponent], // ✅ Import standalone component
  providers: [{ provide: ProductService, useValue: productServiceSpy }],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Optional if <app-product-item> is unknown
}).compileComponents();

    fixture = TestBed.createComponent(ListProductComponent);
    component = fixture.componentInstance;
    productService = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call getAllProducts() on init', () => {
    const spy = spyOn(component, 'getAllProducts');
    component.ngOnInit();
    expect(spy).toHaveBeenCalled();
  });

  it('should load products from ProductService', () => {
    const mockProducts = [{ title: 'Test Product', price: 50, category: 'Test' }] as Product[];
    productService.getAllProducts.and.returnValue(of({ products: mockProducts }));

    component.getAllProducts();
    expect(component.products).toEqual(mockProducts);
  });

  it('should filter products by search query only', () => {
    const mockProducts = [{ title: 'Laptop', category: 'Tech' }] as Product[];
    component.searchQuery = 'laptop';
    component.category = '';

    productService.getProductBykey.and.returnValue(of({ products: mockProducts }));

    component.filterProducts();
    expect(component.products).toEqual(mockProducts);
  });

  it('should filter products by category only', () => {
    const mockProducts = [{ title: 'Shirt', category: 'Clothing' }] as Product[];
    component.searchQuery = '';
    component.category = 'Clothing';

    productService.getProductBycategory.and.returnValue(of({ products: mockProducts }));

    component.filterProducts();
    expect(component.products).toEqual(mockProducts);
  });

  it('should filter products by both search query and category', () => {
    const mockProducts = [
      { title: 'Handbag', category: 'Accessories' },
      { title: 'Backpack', category: 'Tech' }
    ] as Product[];

    component.searchQuery = 'bag';
    component.category = 'Accessories';

    productService.getProductBykey.and.returnValue(of({ products: mockProducts }));

    component.filterProducts();
    expect(component.products.length).toBe(1);
    expect(component.products[0].category).toBe('Accessories');
  });

});
