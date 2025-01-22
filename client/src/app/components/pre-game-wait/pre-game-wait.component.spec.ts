import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { PreGameWaitComponent } from '@app/components/pre-game-wait/pre-game-wait.component';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { Socket } from 'socket.io-client';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('PreGameWaitComponent', () => {
    let component: PreGameWaitComponent;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;

        await TestBed.configureTestingModule({
            declarations: [PreGameWaitComponent],
            providers: [{ provide: SocketClientService, useValue: socketServiceMock }],
            imports: [RouterTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        const fixture = TestBed.createComponent(PreGameWaitComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should not handle sockets if the socket service does not exist', () => {
        const handleSpy = spyOn(component, 'configureBaseSocketFeatures')
        component.socketService = undefined as unknown as SocketClientService;
        component.ngOnInit();
        expect(handleSpy).not.toHaveBeenCalled();
    });
    describe('Receiving events', () => {
        it('should handle countdown event', () => {
            const initialTimer = 1;
            const expectedTimer = 0;
            component.timer = initialTimer;
            socketHelper.peerSideEmit('countdown', expectedTimer);
            expect(component.timer).toEqual(expectedTimer);
        });
    });
});
