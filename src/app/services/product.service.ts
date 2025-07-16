import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product';
import { Observable ,BehaviorSubject  } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private  readonly  searchQuerySubject = new BehaviorSubject<string>('');
private readonly categorySubject = new BehaviorSubject<string>('');

  // Observable properties for components to subscribe to
  searchQuery$ = this.searchQuerySubject.asObservable();
  category$ = this.categorySubject.asObservable();
 constructor(private readonly http: HttpClient) {}

  getAllProducts(){
    return this.http.get('https://dummyjson.com/products');
  }
  getAllCats(){
    return this.http.get('https://dummyjson.com/products/category-list');
  }
  getProductBycategory(category: string): Observable<{ products: Product[] }> {
    return this.http.get<{ products: Product[] }>(`https://dummyjson.com/products/category/${category}`);
  }

  getProductBykey(text: string): Observable<{ products: Product[] }> {
    return this.http.get<{ products: Product[] }>(`https://dummyjson.com/products/search?q=${text}`);
  }
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`https://dummyjson.com/products/${id}`);
  }
  setSearchQuery(query: string) {
    this.searchQuerySubject.next(query);
  }

  setCategory(category: string) {
    this.categorySubject.next(category);
  }

}
