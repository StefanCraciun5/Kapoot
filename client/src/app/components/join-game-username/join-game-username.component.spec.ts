import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JoinGameUsernameComponent } from './join-game-username.component';

describe('JoinGameUsernameComponent', () => {
    let component: JoinGameUsernameComponent;
    let fixture: ComponentFixture<JoinGameUsernameComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [JoinGameUsernameComponent],
        });
        fixture = TestBed.createComponent(JoinGameUsernameComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit userNameSent event with trimmed username when sendUserName is called with non-empty username', () => {
        const userName = '  testUser  ';
        spyOn(component.userNameSent, 'emit');
        component.userName = userName;
        component.sendUserName();
        expect(component.userNameSent.emit).toHaveBeenCalledWith(userName.trim());
    });

    it('should not emit userNameSent event when sendUserName is called with empty username', () => {
        spyOn(component.userNameSent, 'emit');
        component.userName = '    ';
        component.sendUserName();
        expect(component.userNameSent.emit).not.toHaveBeenCalled();
    });
    it('should call sendUserName when Enter key is pressed', () => {
        const sendUserNameSpy = spyOn(component, 'sendUserName');
        const keyboardEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    
        component.invalidUsername = false;
        component.invalidCode = false;
        component.onKeyDown(keyboardEvent);
    
        expect(sendUserNameSpy).toHaveBeenCalled();
        expect(component.invalidUsername).toBeFalse();
        expect(component.invalidCode).toBeFalse();
    });
    it('should reset invalid flags when a non-Enter key is pressed', () => {
        const sendUserNameSpy = spyOn(component, 'sendUserName');
        const keyboardEvent = new KeyboardEvent('keydown', { key: 'a' }); // Simulate pressing a non-Enter key
    
        component.invalidUsername = true;
        component.invalidCode = true;
    
        component.onKeyDown(keyboardEvent);
    
        expect(sendUserNameSpy).not.toHaveBeenCalled();
        expect(component.invalidUsername).toBeFalse();
        expect(component.invalidCode).toBeFalse();
    });
});
