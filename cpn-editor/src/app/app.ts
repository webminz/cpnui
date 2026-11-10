import { Component, inject } from '@angular/core';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { PaletteComponent } from './palette/palette.component';
import { CanvasComponent } from './canvas/canvas.component';
import { PropertyPanelComponent } from './properties/property-panel.component';
import { NavControlsComponent } from './canvas/nav-controls.component';
import { DeclarationsPanelComponent } from './declarations/declarations-panel.component';
import { ViolationsPanelComponent } from './violations/violations-panel.component';
import { CheatsheetOverlayComponent } from './canvas/cheatsheet-overlay.component';
import { CanvasStoreService } from './state/canvas-store.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ToolbarComponent,
    PaletteComponent,
    CanvasComponent,
    PropertyPanelComponent,
    NavControlsComponent,
    DeclarationsPanelComponent,
    ViolationsPanelComponent,
    CheatsheetOverlayComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly canvasStore = inject(CanvasStoreService);
}
