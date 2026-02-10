import { NgFor, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PreferenceI } from '../../servisI/korisniciI';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-znacka-forma',
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './znacka-forma.html',
  styleUrl: './znacka-forma.scss',
})
export class ZnackaForma {
  @Input() preference: PreferenceI[] = [];
  @Input() poruka = '';
  @Input() odabranePreference: Record<number, boolean> = {};
}
