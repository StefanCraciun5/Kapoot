import { MementoDto } from './memento-dto';

describe('MementoDto', () => {
    const duration1 = 60;
    const duration2 = 120;

    it('should create a MementoDto instance', () => {
        const mementoDto = new MementoDto('Title', 'Description', duration1);

        expect(mementoDto).toBeDefined();
        expect(mementoDto instanceof MementoDto).toBe(true);
    });

    it('should have the correct properties', () => {
        const title = 'Title';
        const description = 'Description';
        const duration = 60;

        const mementoDto = new MementoDto(title, description, duration);

        expect(mementoDto.title).toEqual(title);
        expect(mementoDto.description).toEqual(description);
        expect(mementoDto.duration).toEqual(duration);
    });

    it('should allow modifying properties', () => {
        const mementoDto = new MementoDto('Title', 'Description', duration1);

        mementoDto.title = 'New Title';
        mementoDto.description = 'New Description';
        mementoDto.duration = duration2;

        expect(mementoDto.title).toEqual('New Title');
        expect(mementoDto.description).toEqual('New Description');
        expect(mementoDto.duration).toEqual(duration2);
    });
});
