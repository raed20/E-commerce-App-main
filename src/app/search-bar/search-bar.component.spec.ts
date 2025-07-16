import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SearchBarComponent } from './search-bar.component';
import { ProductService } from '../services/product.service';
import { of, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;

  const searchQuerySubject = new Subject<string>();
  const categorySubject = new Subject<string>();

  const productServiceSpy = jasmine.createSpyObj('ProductService', ['getAllCats', 'setSearchQuery', 'setCategory'], {
    searchQuery$: searchQuerySubject.asObservable(),
    category$: categorySubject.asObservable(),
  });

  beforeEach(async () => {
    productServiceSpy.getAllCats.and.returnValue(of(['Cat1', 'Cat2', 'Cat3']));

    await TestBed.configureTestingModule({
      imports: [SearchBarComponent, FormsModule],
      providers: [{ provide: ProductService, useValue: productServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize categories from getAllCats()', () => {
    expect(productServiceSpy.getAllCats).toHaveBeenCalled();
    expect(component.categories).toEqual(['Cat1', 'Cat2', 'Cat3']);
  });

  it('should update searchQuery when searchQuery$ emits a new value', fakeAsync(() => {
    searchQuerySubject.next('test search');
    tick(300);
    fixture.detectChanges();
    expect(component.searchQuery).toBe('test search');
  }));

  it('should update category when category$ emits a new value', fakeAsync(() => {
    categorySubject.next('Electronics');
    tick(300);
    fixture.detectChanges();
    expect(component.category).toBe('Electronics');
  }));

  it('should call setSearchQuery when onSearch is called', () => {
    component.searchQuery = 'laptop';
    const result = component.onSearch();
    expect(productServiceSpy.setSearchQuery).toHaveBeenCalledWith('laptop');
    expect(result).toBeFalse();
  });

  it('should call setCategory when onChange is called', () => {
    component.category = 'Accessories';
    const result = component.onChange();
    expect(productServiceSpy.setCategory).toHaveBeenCalledWith('Accessories');
    expect(result).toBeFalse();
  });
});
