import { MongoStep, mongoToPipe, PipelineStep, pipeToMongo } from '@/pipebuild';

describe('Pipebuild translator', () => {
    it('generate domain step', () => {
        const query: Array<MongoStep> = [{ $match: { domain: 'test_cube' } }];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([{ step: 'domain', domain: 'test_cube' }]);
    });

    it('generate domain and filter steps from one match', () => {
        const query: Array<MongoStep> = [
            { $match: { domain: 'test_cube', Region: 'Europe', Manager: 'Pierre' } },
        ];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([
            { step: 'domain', domain: 'test_cube' },
            { step: 'filter', column: 'Manager', value: 'Pierre' },
            { step: 'filter', column: 'Region', value: 'Europe' },
        ]);
    });

    it('generate domain and filter steps', () => {
        const query: Array<MongoStep> = [
            { $match: { domain: 'test_cube' } },
            { $match: { Region: 'Europe' } },
        ];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([
            { step: 'domain', domain: 'test_cube' },
            { step: 'filter', column: 'Region', value: 'Europe' },
        ]);
    });

    it('generate domain step and filter several columns step', () => {
        const query: Array<MongoStep> = [
            { $match: { domain: 'test_cube' } },
            { $match: { Region: 'Europe', Manager: 'Pierre' } },
        ];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([
            { step: 'domain', domain: 'test_cube' },
            { step: 'filter', column: 'Manager', value: 'Pierre' },
            { step: 'filter', column: 'Region', value: 'Europe' },
        ]);
    });

    it('generate domain and rename steps', () => {
        const query: Array<MongoStep> = [
            { $match: { domain: 'test_cube' } },
            { $project: { zone: '$Region' } },
        ];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([
            { step: 'domain', domain: 'test_cube' },
            { step: 'rename', oldname: 'Region', newname: 'zone' },
        ]);
    });

    it('generate domain and be clever if key and column are the same', () => {
        const query: Array<MongoStep> = [
            { $match: { domain: 'test_cube' } },
            { $project: { Region: '$Region' } },
        ];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([
            { step: 'domain', domain: 'test_cube' },
            { step: 'select', columns: ['Region'] },
        ]);
    });

    it('generate domain and delete steps', () => {
        const query: Array<MongoStep> = [
            { $match: { domain: 'test_cube' } },
            { $project: { Manager: 0 } },
        ];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([
            { step: 'domain', domain: 'test_cube' },
            { step: 'delete', columns: ['Manager'] },
        ]);
    });

    it('generate domain and custom steps from project :1', () => {
        const query: Array<MongoStep> = [
            { $match: { domain: 'test_cube' } },
            { $project: { Manager: 1 } },
        ];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([
            { step: 'domain', domain: 'test_cube' },
            { step: 'select', columns: ['Manager'] },
        ]);
    });

    it('generate steps from heterogeneous project', () => {
        const query: Array<MongoStep> = [
            { $match: { domain: 'test_cube' } },
            {
                $project: {
                    zone: '$Region',
                    Region: '$Region',
                    Manager: 0,
                    id: { $concat: ['$country', ' - ', '$Region'] },
                },
            },
        ];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([
            { step: 'domain', domain: 'test_cube' },
            { step: 'select', columns: ['Region'] },
            { step: 'rename', oldname: 'Region', newname: 'zone' },
            { step: 'delete', columns: ['Manager'] },
            {
                step: 'newcolumn',
                column: 'id',
                query: { $concat: ['$country', ' - ', '$Region'] },
            },
        ]);
    });

    it('generate domain and custom steps from unknown operator', () => {
        const query: Array<MongoStep> = [
            { $match: { domain: 'test_cube' } },
            { $group: { _id: '$Manager', Value: { $sum: '$Value' } } },
        ];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([
            { step: 'domain', domain: 'test_cube' },
            {
                step: 'custom',
                query: {
                    $group: { _id: '$Manager', Value: { $sum: '$Value' } },
                },
            },
        ]);
    });
});

describe('Pipeline to mongo translator', () => {
    it('can generate domain steps', () => {
        const pipeline: Array<PipelineStep> = [{ step: 'domain', domain: 'test_cube' }];
        const querySteps = pipeToMongo(pipeline);
        expect(querySteps).toEqual([{ $match: { domain: 'test_cube' } }]);
    });

    it('can generate match steps', () => {
        const pipeline: Array<PipelineStep> = [
            { step: 'domain', domain: 'test_cube' },
            { step: 'select', columns: ['Region'] },
            { step: 'rename', oldname: 'Region', newname: 'zone' },
            { step: 'delete', columns: ['Manager'] },
            {
                step: 'newcolumn',
                column: 'id',
                query: { $concat: ['$country', ' - ', '$Region'] },
            },
        ];
        const querySteps = pipeToMongo(pipeline);
        expect(querySteps).toEqual([
            { $match: { domain: 'test_cube' } },
            {
                $project: {
                    Region: 1,
                    zone: '$Region',
                    Manager: 0,
                    id: { $concat: ['$country', ' - ', '$Region'] },
                },
            },
        ]);
    });

    it('can generate filter steps', () => {
        const pipeline: Array<PipelineStep> = [
            { step: 'domain', domain: 'test_cube' },
            { step: 'filter', column: 'Manager', value: 'Pierre' },
            { step: 'filter', column: 'Region', value: 'Europe', operator: 'eq' },
        ];
        const querySteps = pipeToMongo(pipeline);
        expect(querySteps).toEqual([
            { $match: { domain: 'test_cube', Manager: 'Pierre', Region: 'Europe' } },
        ]);
    });

    it('can simplify complex queries', () => {
        const pipeline: Array<PipelineStep> = [
            { step: 'domain', domain: 'test_cube' },
            { step: 'filter', column: 'Manager', value: 'Pierre' },
            { step: 'select', columns: ['Region'] },
            { step: 'rename', oldname: 'Region', newname: 'zone' },
            { step: 'delete', columns: ['Manager'] },
            { step: 'newcolumn', column: 'id', query: { $concat: ['$country', ' - ', '$Region'] } },
            {
                step: 'custom',
                query: { $group: { _id: '$country', population: { $sum: '$population' } } },
            },
        ];
        const querySteps = pipeToMongo(pipeline);
        expect(querySteps).toEqual([
            { $match: { domain: 'test_cube', Manager: 'Pierre' } },
            {
                $project: {
                    Region: 1,
                    zone: '$Region',
                    Manager: 0,
                    id: { $concat: ['$country', ' - ', '$Region'] },
                },
            },
            {
                $group: { _id: '$country', population: { $sum: '$population' } },
            },
        ]);
    });
});