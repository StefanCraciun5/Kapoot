import { AnswerService } from './answer-service';
import { expect } from 'chai';
import { FIFTY_PERCENT, HUNDRED_PERCENT, ZERO_PERCENT } from '@common/constant';

describe('AnswerService', () => {
    let service: AnswerService;

    beforeEach(() => {
        service = new AnswerService();
    });
    it('should set LAQ scores correctly 100', () => {
        let laqScores: number[] = [0, 0, 0];
        laqScores = service.setLAQScores(HUNDRED_PERCENT, laqScores);
        expect(laqScores).to.deep.equal([0, 0, 1]);
    });
    it('should set LAQ scores correctly 50', () => {
        let laqScores: number[] = [0, 0, 0];
        laqScores = service.setLAQScores(FIFTY_PERCENT, laqScores);
        expect(laqScores).to.deep.equal([0, 1, 0]);
    });
    it('should set LAQ scores correctly 0', () => {
        let laqScores: number[] = [0, 0, 0];
        laqScores = service.setLAQScores(ZERO_PERCENT, laqScores);
        expect(laqScores).to.deep.equal([1, 0, 0]);
    });
});
