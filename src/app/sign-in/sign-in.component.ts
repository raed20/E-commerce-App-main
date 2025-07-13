import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [FormsModule,RouterLink],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent {
  email : string='';
  password : string='';
  errorMess: string|null=null;
  constructor(private as: AuthService, private r: Router) {}
  register() {
    if (this.email &&  this.password) {
      this.as.login(this.email, this.password).subscribe({next:() => {
        this.r.navigateByUrl('/home');
      }, error:(err)=>{
        this.errorMess = err.code;
      }});
    } else {
      alert("Registration failed. Please fill all fields.");
    }
  }
}
