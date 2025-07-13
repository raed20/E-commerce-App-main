
import { Product } from '../models/product';

export class CartItem {
    product: Product;
    qte: number; 
  
    constructor(
        product: Product,
        qte: number
      ) {
        this.product = product;
        this.qte = qte;
      }
  }