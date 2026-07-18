import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { RegisterService } from 'src/app/register.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit{

  registers:any =[]

  userId! : number 


  isEdit = false;

constructor(private mathis:RegisterService){

}

ngOnInit(): void {
   this.gettuser()
}

 register =  new FormGroup({
    name : new FormControl("",[Validators.required, Validators.minLength(3)])
  })


   onSubmit() {

  if(this.isEdit){



    this.mathis.updateRegister(this.userId,this.register.value).subscribe(()=>
    {
      alert("form udpate") ;
      this.gettuser()
    })

    
  }
else{
  this.mathis.userRegister(this.register.value).subscribe(()=>{
    alert("sdfghjkl");
      this.gettuser()

  })
}
 
  }


  gettuser(){
    this.mathis.getRegister().subscribe((data)=>{

      this.registers=data
console.log(data)

    })
  }


  deltetheuser(id:any){
    this.mathis.deleteRegister(id).subscribe(()=>{
      alert("user suucccess")
this.gettuser()
    })
  }





  updaetuser(user:any){

    this.isEdit=true;

    this.userId = user.id!;

    this.register.patchValue(user)







  }

}
