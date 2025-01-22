import { HistoryObj } from '@common/message';
import { expect } from 'chai';
import { HistoryObject } from './history-object';

describe('HistoryObject', () => {
    beforeEach(() => {
        // Create a new instance of HistoryObject before each test
    });

    it('should have a toJSON() method ', () => {
        const maxPoints = 400;
        const nPlayer = 5;
        const historyObj: HistoryObj = {
            date: new Date(),
            title: 'history title',
            maxPoints,
            players: nPlayer,
        };
        const testInstance = new HistoryObject(historyObj);
        expect(() => testInstance.toJSON()).to.be.a('function');
    });
    it('should convert to JSON correctly', () => {
        const date = new Date();
        const maxPoints = 400;
        const nPlayer = 5;
        const historyObj: HistoryObj = {
            date,
            title: 'history title',
            maxPoints,
            players: nPlayer,
        };
        const testInstance = new HistoryObject(historyObj);
        const jsonTestInstance = testInstance.toJSON();

        const expectedJSON = {
            date: date.toISOString(),
            title: 'history title',
            maxPoints,
            players: nPlayer,
        };

        expect(jsonTestInstance).to.deep.equal(expectedJSON);
    });
});
