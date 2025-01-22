import { AuthenticationService } from '@app/services/authentication-service/authentication.service';
import { expect } from 'chai';

describe('Authentication Service', () => {
    it('should authenticate user if password is valid', () => {
        const password = 'log2990-107';
        const result = AuthenticationService.authenticate(password);
        expect(result).to.equal(true);
    });
    it('should not authenticate user if password is invalid', () => {
        const password = 'log2990-108';
        const result = AuthenticationService.authenticate(password);
        expect(result).to.equal(false);
    });
    it('should not authenticate user if password is falsy', () => {
        const password: string = undefined;
        const result = AuthenticationService.authenticate(password);
        expect(result).to.equal(false);
    });
});
