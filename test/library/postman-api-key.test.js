const fs = require('fs'),
    nock = require('nock'),
    sinon = require('sinon'),
    request = require('postman-request'),
    COLLECTION = {
        id: 'C1',
        name: 'Collection',
        item: [{
            id: 'ID1',
            name: 'R1',
            request: 'https://postman-echo.com/get'
        }]
    },
    VARIABLE = {
        id: 'V1',
        name: 'Variable',
        values: [{
            key: 'foo',
            value: 'bar'
        }]
    };

describe('newman.run postmanApiKey', function () {
    before(function () {
        nock('https://api.getpostman.com')
            .persist()
            .get(/^\/collections/)
            .reply(200, COLLECTION);

        nock('https://api.getpostman.com')
            .persist()
            .get(/^\/environments/)
            .reply(200, VARIABLE);
    });

    after(function () {
        nock.restore();
    });

    beforeEach(function () {
        sinon.spy(request, 'get');
    });

    afterEach(function () {
        request.get.restore();
    });

    it('should fetch collection via UID', function (done) {
        newman.run({
            collection: '1234-588025f9-2497-46f7-b849-47f58b865807',
            postmanApiKey: '12345678'
        }, function (err, summary) {
            expect(err).to.be.null;
            expect(request.get.calledOnce).to.be.true;

            let requestArg = request.get.firstCall.args[0];

            expect(requestArg).to.be.an('object').with.keys(['url', 'json', 'headers']);

            expect(requestArg.url).to.be.a('string')
                .that.is.equal('https://api.getpostman.com/collections/1234-588025f9-2497-46f7-b849-47f58b865807');

            expect(requestArg.headers).to.be.an('object')
                .that.has.property('X-Api-Key').to.equal('12345678');

            expect(summary).to.be.an('object')
                .that.has.property('collection').to.be.an('object')
                .and.that.include({ id: 'C1', name: 'Collection' });

            done();
        });
    });

    it('should fetch environment via UID', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            environment: '1234-931c1484-fd1e-4ceb-81d0-2aa102ca8b5f',
            postmanApiKey: '12345678'
        }, function (err, summary) {
            expect(err).to.be.null;
            expect(request.get.calledOnce).to.be.true;

            let requestArg = request.get.firstCall.args[0];

            expect(requestArg).to.be.an('object').with.keys(['url', 'json', 'headers']);

            expect(requestArg.url).to.be.a('string')
                .that.is.equal('https://api.getpostman.com/environments/1234-931c1484-fd1e-4ceb-81d0-2aa102ca8b5f');

            expect(requestArg.headers).to.be.an('object')
                .that.has.property('X-Api-Key').to.equal('12345678');

            expect(summary).to.be.an('object')
                .that.has.property('environment').to.be.an('object')
                .and.that.include({ id: 'V1', name: 'Variable' });

            done();
        });
    });

    it('should fetch globals via UID', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            globals: '1234-6863abf8-6630-4eec-b9cc-2a58f5efe589',
            postmanApiKey: '12345678'
        }, function (err, summary) {
            expect(err).to.be.null;
            expect(request.get.calledOnce).to.be.true;

            let requestArg = request.get.firstCall.args[0];

            expect(requestArg).to.be.an('object').with.keys(['url', 'json', 'headers']);

            expect(requestArg.url).to.be.a('string')
                .that.is.equal('https://api.getpostman.com/environments/1234-6863abf8-6630-4eec-b9cc-2a58f5efe589');

            expect(requestArg.headers).to.be.an('object')
                .that.has.property('X-Api-Key').to.equal('12345678');

            expect(summary).to.be.an('object')
                .that.has.property('globals').to.be.an('object')
                .and.that.include({ id: 'V1', name: 'Variable' });

            done();
        });
    });

    it('should fetch all resources via UID', function (done) {
        newman.run({
            collection: '1234-588025f9-2497-46f7-b849-47f58b865807',
            environment: '1234-931c1484-fd1e-4ceb-81d0-2aa102ca8b5f',
            globals: '1234-6863abf8-6630-4eec-b9cc-2a58f5efe589',
            postmanApiKey: '12345678'
        }, function (err, summary) {
            expect(err).to.be.null;
            expect(request.get.calledThrice).to.be.true;

            expect(summary).to.be.an('object').with.keys(['collection', 'environment', 'globals', 'run']);

            expect(summary.collection).to.include({ id: 'C1', name: 'Collection' });
            expect(summary.environment).to.include({ id: 'V1', name: 'Variable' });
            expect(summary.globals).to.include({ id: 'V1', name: 'Variable' });

            done();
        });
    });

    it('should throw error without postmanApiKey', function (done) {
        newman.run({
            collection: '1234-588025f9-2497-46f7-b849-47f58b865807'
        }, function (err) {
            expect(err).to.be.ok.that.match(/no such file or directory/);
            expect(request.get.called).to.be.false;

            done();
        });
    });

    describe('read file', function () {
        const UID = '1234-96771253-046f-4ad7-81f9-a2d3c433492b';

        beforeEach(function (done) {
            fs.stat(UID, function (err) {
                if (err) {
                    return fs.writeFile(UID, JSON.stringify(COLLECTION), done);
                }

                done();
            });
        });

        afterEach(function (done) {
            fs.stat(UID, function (err) {
                if (err) { return done(); }

                fs.unlink(UID, done);
            });
        });

        it('should fetch from file having UID name', function (done) {
            newman.run({
                collection: UID,
                postmanApiKey: '12345678'
            }, function (err, summary) {
                expect(err).to.be.null;
                expect(request.get.called).to.be.false;

                expect(summary).to.be.an('object')
                    .that.has.property('collection').to.be.an('object')
                    .and.that.include({ id: 'C1', name: 'Collection' });

                done();
            });
        });
    });
});
