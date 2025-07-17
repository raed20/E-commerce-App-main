import { Component } from '@angular/core';
import { ProductService } from '../services/product.service';
import { CommonModule } from '@angular/common';
import { debounceTime } from 'rxjs/operators';
import { FormsModule } from '@angular/forms'; 

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './search-bar.component.html'
})
export class SearchBarComponent {
  searchQuery: string="";
  category:string = 'All Categories';
  categories :string[]=[];
  constructor(private readonly ps:ProductService){};
  ngOnInit():void {
    this.getAllCats();
    this.ps.searchQuery$.pipe(debounceTime(300)).subscribe(query => {
      this.searchQuery = query;
    });
    this.ps.category$.pipe(debounceTime(300)).subscribe(query => {
      this.category = query;
    });
  }
  getAllCats(){
    this.ps.getAllCats().subscribe((response: any) => {
      this.categories = response;
    });
    this.ps.searchQuery$.pipe(debounceTime(300)).subscribe(query => {
      this.searchQuery = query;
    });
  }
  onSearch() {
    this.ps.setSearchQuery(this.searchQuery);
    // Optionally, you can prevent the form from submitting
    return false;
  }
  onChange(){
    this.ps.setCategory(this.category);
    // Optionally, you can prevent the form from submitting
    return false;
  }

}