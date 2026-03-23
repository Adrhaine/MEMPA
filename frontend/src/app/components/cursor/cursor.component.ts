import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-cursor',
  standalone: true,
  template: `
    <div class="cursor-vinyl">
      <div class="vinyl-outer">
        <div class="vinyl-inner"></div>
        <div class="vinyl-center"></div>
      </div>
    </div>
  `,
  styles: [`
    .cursor-vinyl {
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      margin-left: -12px;
      margin-top: -12px;
    }
    .vinyl-outer {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #1a1410;
      border: 2px solid #e8c46c;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .vinyl-inner {
      position: absolute;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1px solid #3d2d1e;
    }
    .vinyl-center {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #e8c46c;
      position: absolute;
    }
  `]
})
export class CursorComponent implements OnInit, OnDestroy {
  private cursorEl!: HTMLElement;

  ngOnInit(): void {
    this.cursorEl = document.querySelector('.cursor-vinyl')!;
    document.addEventListener('mousemove', this.onMouseMove);
  }

  private onMouseMove = (e: MouseEvent): void => {
    this.cursorEl.style.left = e.clientX + 'px';
    this.cursorEl.style.top = e.clientY + 'px';
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onMouseMove);
  }
}
