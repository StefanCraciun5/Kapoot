import { Service } from 'typedi';

@Service()
export class AuthenticationService {
    static authenticate(password: string): boolean {
        return password === 'log2990-107';
    }
}
