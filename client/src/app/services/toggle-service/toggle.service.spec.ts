import { TestBed } from '@angular/core/testing';

import { ToggleService } from './toggle.service';

describe('ToggleService', () => {
    let service: ToggleService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ToggleService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have initial state false', () => {
        expect(service.state).toBeFalse();
    });

    it('should toggle state from false to true', () => {
        service.toggle();
        expect(service.state).toBeTrue();
    });

    it('should toggle state from true to false', () => {
        service.toggle(); // state is true
        service.toggle(); // state should be false again
        expect(service.state).toBeFalse();
    });
});
