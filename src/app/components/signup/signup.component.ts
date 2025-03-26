import { Component } from '@angular/core';
import { BackendService } from 'src/app/services/backend.service';
@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  form = {
    nom: null,
    email: '',
    password: '',
    role: 'client' // Valeur par défaut
  };
  constructor(private backendService: BackendService) {}
  public error:any=[];
  onSignIn() {
    
    console.log('Formulaire soumis:', this.form);
    return this.backendService.signup(this.form).subscribe(
      (data) => {console.log(data)},
      (error)=>{this.handleError(error)});
    
    
  }
  handleError(error: any) {
    this.error = error.error.errors;}
}
