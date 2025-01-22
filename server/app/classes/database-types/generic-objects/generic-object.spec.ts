import { expect } from 'chai';
import { GenericObject } from '@app/classes/database-types/generic-objects/generic-object';

describe('GenericObject', () => {
    it('should have an overrideable toJSON() method ', () => {
        class TestObject extends GenericObject {
            toJSON(): JSON {
                return JSON.parse('{}');
            }
        }
        const testInstance = new TestObject();
        expect(testInstance).to.not.haveOwnProperty('toJSON');
        expect(() => testInstance.toJSON()).to.be.a('function');
        expect(testInstance.toJSON()).to.deep.equal(JSON.parse('{}'));
    });
});
