import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { Product } from '../models/product';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  const mockProduct: Product = {
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
  };

  const mockProducts: Product[] = [
    mockProduct,
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
    }
  ];

  const mockProductsResponse = {
    products: mockProducts,
    total: 2,
    skip: 0,
    limit: 30
  };

  const mockCategories = [
    'smartphones',
    'laptops',
    'fragrances',
    'skincare',
    'groceries'
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty search query', (done) => {
      service.searchQuery$.subscribe(query => {
        expect(query).toBe('');
        done();
      });
    });

    it('should initialize with empty category', (done) => {
      service.category$.subscribe(category => {
        expect(category).toBe('');
        done();
      });
    });

    it('should have searchQuery$ as observable', () => {
      expect(service.searchQuery$).toBeDefined();
      expect(typeof service.searchQuery$.subscribe).toBe('function');
    });

    it('should have category$ as observable', () => {
      expect(service.category$).toBeDefined();
      expect(typeof service.category$.subscribe).toBe('function');
    });
  });

  describe('getAllProducts', () => {
    it('should make GET request to correct URL', () => {
      service.getAllProducts().subscribe();

      const req = httpMock.expectOne('https://dummyjson.com/products');
      expect(req.request.method).toBe('GET');

      req.flush(mockProductsResponse);
    });

    it('should return products data', () => {
      service.getAllProducts().subscribe(response => {
        expect(response).toEqual(mockProductsResponse);
      });

      const req = httpMock.expectOne('https://dummyjson.com/products');
      req.flush(mockProductsResponse);
    });

    it('should handle HTTP errors', () => {
      const errorMessage = 'Server error';

      service.getAllProducts().subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne('https://dummyjson.com/products');
      req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getAllCats', () => {
    it('should make GET request to correct URL', () => {
      service.getAllCats().subscribe();

      const req = httpMock.expectOne('https://dummyjson.com/products/category-list');
      expect(req.request.method).toBe('GET');

      req.flush(mockCategories);
    });

    it('should return categories data', () => {
      service.getAllCats().subscribe(response => {
        expect(response).toEqual(mockCategories);
      });

      const req = httpMock.expectOne('https://dummyjson.com/products/category-list');
      req.flush(mockCategories);
    });

    it('should handle HTTP errors', () => {
      service.getAllCats().subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne('https://dummyjson.com/products/category-list');
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getProductBycategory', () => {
    it('should make GET request to correct URL with category parameter', () => {
      const category = 'smartphones';

      service.getProductBycategory(category).subscribe();

      const req = httpMock.expectOne(`https://dummyjson.com/products/category/${category}`);
      expect(req.request.method).toBe('GET');

      req.flush({ products: mockProducts });
    });

    it('should return products for specific category', () => {
      const category = 'smartphones';
      const expectedResponse = { products: mockProducts };

      service.getProductBycategory(category).subscribe(response => {
        expect(response).toEqual(expectedResponse);
        expect(response.products).toEqual(mockProducts);
      });

      const req = httpMock.expectOne(`https://dummyjson.com/products/category/${category}`);
      req.flush(expectedResponse);
    });

    it('should handle different category values', () => {
      const categories = ['laptops', 'fragrances', 'skincare'];

      categories.forEach(category => {
        service.getProductBycategory(category).subscribe();

        const req = httpMock.expectOne(`https://dummyjson.com/products/category/${category}`);
        expect(req.request.method).toBe('GET');
        req.flush({ products: [] });
      });
    });

    it('should handle empty category', () => {
      service.getProductBycategory('').subscribe();

      const req = httpMock.expectOne('https://dummyjson.com/products/category/');
      req.flush({ products: [] });
    });

    it('should handle HTTP errors', () => {
      service.getProductBycategory('invalid-category').subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne('https://dummyjson.com/products/category/invalid-category');
      req.flush('Category not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getProductBykey', () => {
    it('should make GET request to correct URL with search parameter', () => {
      const searchText = 'iPhone';

      service.getProductBykey(searchText).subscribe();

      const req = httpMock.expectOne(`https://dummyjson.com/products/search?q=${searchText}`);
      expect(req.request.method).toBe('GET');

      req.flush({ products: mockProducts });
    });

    it('should return products matching search query', () => {
      const searchText = 'iPhone';
      const expectedResponse = { products: [mockProduct] };

      service.getProductBykey(searchText).subscribe(response => {
        expect(response).toEqual(expectedResponse);
        expect(response.products).toEqual([mockProduct]);
      });

      const req = httpMock.expectOne(`https://dummyjson.com/products/search?q=${searchText}`);
      req.flush(expectedResponse);
    });

    it('should handle different search terms', () => {
      const searchTerms = ['Samsung', 'laptop', 'phone'];

      searchTerms.forEach(term => {
        service.getProductBykey(term).subscribe();

        const req = httpMock.expectOne(`https://dummyjson.com/products/search?q=${term}`);
        expect(req.request.method).toBe('GET');
        req.flush({ products: [] });
      });
    });

    it('should handle empty search text', () => {
      service.getProductBykey('').subscribe();

      const req = httpMock.expectOne('https://dummyjson.com/products/search?q=');
      req.flush({ products: mockProducts });
    });

    it('should handle special characters in search', () => {
      const searchText = 'iPhone 14 Pro Max';

      service.getProductBykey(searchText).subscribe();

      const req = httpMock.expectOne(`https://dummyjson.com/products/search?q=${searchText}`);
      req.flush({ products: [mockProduct] });
    });

    it('should handle no results', () => {
      service.getProductBykey('nonexistent').subscribe(response => {
        expect(response.products).toEqual([]);
      });

      const req = httpMock.expectOne('https://dummyjson.com/products/search?q=nonexistent');
      req.flush({ products: [] });
    });
  });

  describe('getProductById', () => {
    it('should make GET request to correct URL with product ID', () => {
      const productId = 1;

      service.getProductById(productId).subscribe();

      const req = httpMock.expectOne(`https://dummyjson.com/products/${productId}`);
      expect(req.request.method).toBe('GET');

      req.flush(mockProduct);
    });

    it('should return specific product by ID', () => {
      const productId = 1;

      service.getProductById(productId).subscribe(response => {
        expect(response).toEqual(mockProduct);
        expect(response.id).toBe(productId);
      });

      const req = httpMock.expectOne(`https://dummyjson.com/products/${productId}`);
      req.flush(mockProduct);
    });

    it('should handle different product IDs', () => {
      const productIds = [1, 2, 100, 999];

      productIds.forEach(id => {
        service.getProductById(id).subscribe();

        const req = httpMock.expectOne(`https://dummyjson.com/products/${id}`);
        expect(req.request.method).toBe('GET');
        req.flush({ ...mockProduct, id });
      });
    });

    it('should handle invalid product ID', () => {
      service.getProductById(999).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne('https://dummyjson.com/products/999');
      req.flush('Product not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('setSearchQuery', () => {
    it('should update searchQuerySubject value', () => {
      const searchQuery = 'iPhone';

      service.setSearchQuery(searchQuery);

      service.searchQuery$.subscribe(query => {
        expect(query).toBe(searchQuery);
      });
    });

    it('should emit new values to subscribers', () => {
      const queries = ['iPhone', 'Samsung', 'laptop'];
      let emittedValues: string[] = [];

      service.searchQuery$.subscribe(query => {
        emittedValues.push(query);
      });

      queries.forEach(query => {
        service.setSearchQuery(query);
      });

      expect(emittedValues).toEqual(['', ...queries]); // First emission is initial empty value
    });

    it('should handle empty search query', () => {
      service.setSearchQuery('test');
      service.setSearchQuery('');

      service.searchQuery$.subscribe(query => {
        expect(query).toBe('');
      });
    });

    it('should handle multiple subscribers', () => {
      const searchQuery = 'test query';
      let subscriber1Value: string = '';
      let subscriber2Value: string = '';

      service.searchQuery$.subscribe(query => {
        subscriber1Value = query;
      });

      service.searchQuery$.subscribe(query => {
        subscriber2Value = query;
      });

      service.setSearchQuery(searchQuery);

      expect(subscriber1Value).toBe(searchQuery);
      expect(subscriber2Value).toBe(searchQuery);
    });
  });

  describe('setCategory', () => {
    it('should update categorySubject value', () => {
      const category = 'smartphones';

      service.setCategory(category);

      service.category$.subscribe(cat => {
        expect(cat).toBe(category);
      });
    });

    it('should emit new values to subscribers', () => {
      const categories = ['smartphones', 'laptops', 'fragrances'];
      let emittedValues: string[] = [];

      service.category$.subscribe(category => {
        emittedValues.push(category);
      });

      categories.forEach(category => {
        service.setCategory(category);
      });

      expect(emittedValues).toEqual(['', ...categories]); // First emission is initial empty value
    });

    it('should handle empty category', () => {
      service.setCategory('smartphones');
      service.setCategory('');

      service.category$.subscribe(category => {
        expect(category).toBe('');
      });
    });

    it('should handle multiple subscribers', () => {
      const category = 'laptops';
      let subscriber1Value: string = '';
      let subscriber2Value: string = '';

      service.category$.subscribe(cat => {
        subscriber1Value = cat;
      });

      service.category$.subscribe(cat => {
        subscriber2Value = cat;
      });

      service.setCategory(category);

      expect(subscriber1Value).toBe(category);
      expect(subscriber2Value).toBe(category);
    });
  });

  describe('BehaviorSubject Integration', () => {
    it('should maintain state between subscriptions', () => {
      // Set initial values
      service.setSearchQuery('iPhone');
      service.setCategory('smartphones');

      // Subscribe after setting values
      service.searchQuery$.subscribe(query => {
        expect(query).toBe('iPhone');
      });

      service.category$.subscribe(category => {
        expect(category).toBe('smartphones');
      });
    });

    it('should emit current values to new subscribers', () => {
      const searchQuery = 'test search';
      const category = 'test category';

      service.setSearchQuery(searchQuery);
      service.setCategory(category);

      // New subscriber should immediately receive current values
      service.searchQuery$.subscribe(query => {
        expect(query).toBe(searchQuery);
      });

      service.category$.subscribe(cat => {
        expect(cat).toBe(category);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      service.getAllProducts().subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne('https://dummyjson.com/products');
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle timeout errors', () => {
      service.getProductById(1).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne('https://dummyjson.com/products/1');
      req.error(new ErrorEvent('Timeout'));
    });
  });
});
