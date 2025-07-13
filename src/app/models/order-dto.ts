export class OrderDto {
    productid: number;
    qte: number; 
  
    constructor(
        product: number,
        qte: number
      ) {
        this.productid = product;
        this.qte = qte;
      }
}
