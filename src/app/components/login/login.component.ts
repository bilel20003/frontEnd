import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  public form={
    username: null,
  password:null
  }
  

  constructor(private router: Router, private http: HttpClient) {}

  onLogin() {
   console.log(this.form);
  }
}
