import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import {Category} from 'models';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  categories = Category.collection();

  searchText = '';

  constructor(public navCtrl: NavController) {
  	this.categories.find();
  }

  filterE(){
  	this.categories.findContaining('El');
  }

  search(){
  	this.categories.findContaining(this.searchText);
  }

}
