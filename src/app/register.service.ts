import { Injectable } from '@angular/core';
import {HttpClient}  from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  private api = "http://localhost:3000/register"

  constructor(private http:HttpClient) { }


userRegister(user:any){

 return this.http.post(this.api,user)
}


getRegister(){

 return this.http.get(this.api)
}



deleteRegister(id:any){

 return this.http.delete(`${this.api}/${id}`)
}




updateRegister(id:any,user:any){

 return this.http.put(`${this.api}/${id}`,user)
}



}
