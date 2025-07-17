import { Component } from '@angular/core';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartItem } from '../models/cart-item';
import { CartService } from '../services/cart.service';
import { CommentComponent } from '../comment/comment.component';
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [FormsModule,CommentComponent],
  templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent {
  produit!:Product;
  productId!:number;
  quantity:number=1;
  constructor(private ps :ProductService,private route: ActivatedRoute,private cs:CartService){}
  ngOnInit(){
    this.route.paramMap.subscribe(params => {
      this.productId = +params.get('id')!; // Extract the 'id' parameter and convert it to a number
      this.getProduct(); // Fetch the product details after getting the ID
    });
  }


  getProduct(){
    this.ps.getProductById(this.productId).subscribe((product: Product) => {
      this.produit = product; // Store the fetched product
    });
  }
  addToPanier() {
    if (this.produit) {
      let ci: CartItem =new CartItem(this.produit,this.quantity);
      this.cs.addToCart(ci);
      alert(`${this.produit.title} added to cart!`); // Optional: Notify the user
    }
  }

}
