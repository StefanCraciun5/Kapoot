import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { MAX_NUMBERS_IN_CODE } from '@common/constant';

@Component({
    selector: 'app-join-game-code',
    templateUrl: './join-game-code.component.html',
    styleUrls: ['./join-game-code.component.scss'],
})
export class JoinGameCodeComponent {
    @Output() codeSent = new EventEmitter<string>();
    code: string = '';
    currentIndex = 0;
    inputs: number[] = Array(MAX_NUMBERS_IN_CODE).fill(0);

    sendCode(siblings: Element[]) {
        if (!/^\d{4}$/.test(this.code)) {
            alert('Please enter a 4-digit code');
            this.clearCode(siblings)
            return;
        }
        this.codeSent.emit(this.code);
        this.clearCode(siblings)
    }

    @HostListener('keydown', ['$event'])
    @HostListener('paste', ['$event'])
    onEvent(event: KeyboardEvent | ClipboardEvent) {
        const siblings = Array.from((event.target as HTMLElement).parentNode?.children as HTMLCollection);
        if (event instanceof ClipboardEvent) {
            this.paste(event, siblings);
            return;
        }
        if (event instanceof KeyboardEvent) {
            this.currentIndex = siblings.indexOf(<HTMLElement>event.target);
            if (event.key === 'Backspace') {
                this.delete(siblings);
            }
            if (Number(event.key) || event.key === '0') {
                event.preventDefault();
                this.enterNumber(event, siblings);
            }
            if (event.key === 'Enter') {
                this.sendCode(siblings);
            }
        }
    }

    delete(siblings: Element[]) {
        (siblings[this.currentIndex] as HTMLInputElement).value = '';
        this.code = this.code.slice(0, -1);
        (siblings[--this.currentIndex >= 0 ? this.currentIndex : 0] as HTMLElement).focus();
    }

    enterNumber(event: KeyboardEvent, siblings: Element[]) {
        (siblings[this.currentIndex] as HTMLInputElement).value = event.key;
        this.code += event.key;
        (siblings[++this.currentIndex < MAX_NUMBERS_IN_CODE ? this.currentIndex : MAX_NUMBERS_IN_CODE - 1] as HTMLElement).focus();
        if (this.currentIndex === MAX_NUMBERS_IN_CODE) {
            this.sendCode(siblings);
        }
    }

    paste(event: ClipboardEvent, siblings: Element[]) {
        const pastedText = (event.clipboardData as DataTransfer).getData('text/plain');
        this.code = pastedText;
        for (let i = 0; i < MAX_NUMBERS_IN_CODE && this.code[i]; i++) {
            (siblings[i] as HTMLInputElement).value = this.code[i] as string;
            (siblings[i + 1 < MAX_NUMBERS_IN_CODE ? i + 1 : i] as HTMLElement).focus();
        }
    }

    clearCode(siblings: Element[]) {
        for (let i = MAX_NUMBERS_IN_CODE - 1; i >= 0; i--) {
            (siblings[i] as HTMLInputElement).value = '';
        }
        (siblings[0] as HTMLElement).focus();
        this.code = '';
    }
}
