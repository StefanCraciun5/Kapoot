import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { Socket } from 'socket.io-client';
import { UsernameListComponent } from './username-list.component';

class SocketClientServiceMock extends SocketClientService {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    override connect() {}
}

describe('UsernameListComponent', () => {
    let component: UsernameListComponent;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;

        await TestBed.configureTestingModule({
            declarations: [UsernameListComponent],
            providers: [{ provide: SocketClientService, useValue: socketServiceMock }],
            imports: [RouterTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        const fixture = TestBed.createComponent(UsernameListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component.configureBaseSocketFeatures();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should configure base socket features and fetch users when roomId changes', () => {
        component.roomId = '1234';
        const changes = { roomId: { currentValue: '1234', previousValue: null, firstChange: true, isFirstChange: () => true } };

        component.ngOnChanges(changes);

        expect(component.usernames).toEqual([]);
    });

    describe('Receiving events', () => {
        it('should handle users event', () => {
            const usernames = ['organisateur', 'player1'];
            socketHelper.peerSideEmit('users', usernames);
            expect(component.usernames.length).toBe(1);
        });
        it('should handle playersUpdated event', () => {
            const fetchUsernameSpy = spyOn(component, 'fetchUsers');
            socketHelper.peerSideEmit('playersUpdated');
            expect(fetchUsernameSpy).toHaveBeenCalled();
        });
    });

    describe('Emitting event', () => {
        it('should send banPlayer event', () => {
            const usernames = ['player1', 'player2'];
            component.usernames = usernames;
            component.deleteUser('player1');
            expect(component.usernames.length).toBe(1);
        });
    });
});
