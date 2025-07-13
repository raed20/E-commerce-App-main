import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']  // Corrected styleUrls
})
export class SignUpComponent {
  email: string = '';
  userName: string = '';
  password: string = '';
  errorMess: string|null=null;
  constructor(private as: AuthService, private r: Router) {}

  register() {
    if (this.email && this.userName && this.password) {
      this.as.register(this.email, this.userName, this.password).subscribe({next:() => {
        this.r.navigateByUrl('/home');
      }, error:(err)=>{
        this.errorMess = err.code;
      }});
    } else {
      alert("Registration failed. Please fill all fields.");
    }
  }
}
