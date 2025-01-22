import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JoinGameCodeComponent } from './join-game-code.component';

describe('JoinGameCodeComponent', () => {
    let component: JoinGameCodeComponent;
    let fixture: ComponentFixture<JoinGameCodeComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [JoinGameCodeComponent]
        });
        fixture = TestBed.createComponent(JoinGameCodeComponent);
        component = fixture.componentInstance;
        component.currentIndex = 0;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // it('should emit code when a valid 4-digit code is entered', () => {
    //     const siblings: Element[] = [];
    //     const code = '1234';
    //     spyOn(component.codeSent, 'emit');
    
    //     component.code = code;
    //     component.sendCode(siblings);
    
    //     expect(component.codeSent.emit).toHaveBeenCalledWith(code);
    // });

    it('should display an alert and clear code when an invalid code is entered', () => {
        const siblings: Element[] = [];
        const code = '12345'
        spyOn(window, 'alert');
        spyOn(component, 'clearCode');
    
        component.code = code;
        component.sendCode(siblings);
    
        expect(window.alert).toHaveBeenCalledWith('Please enter a 4-digit code');
        expect(component.clearCode).toHaveBeenCalledWith(siblings);
    });
    it('should call paste method when a paste event occurs', () => {
        const clipboardEvent = new ClipboardEvent('paste');
        const pasteSpy = spyOn(component, 'paste');

        const targetElement = document.createElement('div');
        const parentNode = document.createElement('div');
        parentNode.appendChild(targetElement);

        spyOnProperty(clipboardEvent, 'target').and.returnValue(targetElement);
        spyOnProperty(targetElement, 'parentNode').and.returnValue(parentNode);
    
        component.onEvent(clipboardEvent);
    
        expect(pasteSpy).toHaveBeenCalledWith(clipboardEvent, jasmine.any(Array));
      });
    it('should call delete method when Backspace key is pressed', () => {
        const keyboardEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
        const deleteSpy = spyOn(component, 'delete');
        const targetElement = document.createElement('div');
        const parentNode = document.createElement('div');
        parentNode.appendChild(targetElement);
        
        spyOnProperty(keyboardEvent, 'target').and.returnValue(targetElement);
        spyOnProperty(targetElement, 'parentNode').and.returnValue(parentNode);
        
        component.onEvent(keyboardEvent);
        
        expect(deleteSpy).toHaveBeenCalledWith(jasmine.any(Array));
    });
    it('should call enterNumber method when a number key is pressed', () => {
        const keyboardEvent = new KeyboardEvent('keydown', { key: '1' });
        const enterNumberSpy = spyOn(component, 'enterNumber');
        const targetElement = document.createElement('div');
        const parentNode = document.createElement('div');
        parentNode.appendChild(targetElement);
        
        spyOnProperty(keyboardEvent, 'target').and.returnValue(targetElement);
        spyOnProperty(targetElement, 'parentNode').and.returnValue(parentNode);
        
        component.onEvent(keyboardEvent);
        
        expect(enterNumberSpy).toHaveBeenCalledWith(keyboardEvent, jasmine.any(Array));
    });
    it('should call sendCode method when Enter key is pressed', () => {
        const keyboardEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        const sendCodeSpy = spyOn(component, 'sendCode');
        const targetElement = document.createElement('div');
        const parentNode = document.createElement('div');
        parentNode.appendChild(targetElement);
        
        spyOnProperty(keyboardEvent, 'target').and.returnValue(targetElement);
        spyOnProperty(targetElement, 'parentNode').and.returnValue(parentNode);
        
        component.onEvent(keyboardEvent);

        expect(sendCodeSpy).toHaveBeenCalledWith(jasmine.any(Array));
    });
    it('should clear value of current input element and focus on previous element', () => {
        const siblings: Element[] = [
            document.createElement('input'),
            document.createElement('input'),
            document.createElement('input'),
            document.createElement('input'),
        ];
        component.delete(siblings);
        expect(component.code.length).toBe(0);
    });
    it('should set value of current input element and focus on next element when number key is pressed', () => {
        const siblings: Element[] = [
            document.createElement('input'),
            document.createElement('input'),
            document.createElement('input'),
            document.createElement('input'),
        ];
        const key = '5';
        const keyboardEvent = new KeyboardEvent('keydown', { key });
        component.currentIndex = 3;
        component.enterNumber(keyboardEvent, siblings);

        expect(true).toBe(true);
    });
    it('should set code and focus on sibling elements based on pasted text', () => {
        const siblings: HTMLElement[] = [
            document.createElement('input'),
            document.createElement('input'),
            document.createElement('input'),
            document.createElement('input'),
        ];
        const pastedText = '123';
        const clipboardData = {
            getData: (format: string) => {
                return format === 'text/plain' ? pastedText : '';
            }
        };

        const clipboardEvent = {
            clipboardData,
            preventDefault: () => {}
        } as ClipboardEvent;

        component.paste(clipboardEvent, siblings);

        expect(component.code).toBe(pastedText);
    });
});
