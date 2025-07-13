import { Component } from '@angular/core';
import { ProductItemComponent } from '../product-item/product-item.component';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product';
import { CommonModule } from '@angular/common';
import { CartItem } from '../models/cart-item';

@Component({
  selector: 'app-list-product',
  standalone: true,
  imports: [ProductItemComponent, CommonModule],
  templateUrl: './list-product.component.html',
  styleUrls: ['./list-product.component.css']
})
export class ListProductComponent {
  products: Product[] = [];
  searchQuery: string = '';
  category: string = ''; // Default category

  constructor(private ps: ProductService) {}

  ngOnInit(): void {
    this.getAllProducts();

    // Subscribe to search query changes
    this.ps.searchQuery$.subscribe(query => {
      this.searchQuery = query;
      this.filterProducts(); // Call the combined filter function
    });

    // Subscribe to category changes
    this.ps.category$.subscribe(category => {
      this.category = category;
      this.filterProducts(); // Call the combined filter function
    });
  }

  getAllProducts() {
    this.ps.getAllProducts().subscribe((response: any) => {
      this.products = response.products;
    });
  }

  filterProducts() {
    if (this.searchQuery) {
      if (this.category && this.category !== 'All Categories') {
        this.ps.getProductBykey(this.searchQuery).subscribe((response: any) => {
          this.products = response.products.filter((product: Product) => product.category === this.category);
        });
      } else {
        this.ps.getProductBykey(this.searchQuery).subscribe((response: any) => {
          this.products = response.products; 
        });
      }
    } else {
      if (this.category && this.category !== 'All Categories') {
        this.ps.getProductBycategory(this.category).subscribe((response: any) => {
          this.products = response.products; 
        });
      } else {
        this.getAllProducts();
      }
    }
  }

}
  

