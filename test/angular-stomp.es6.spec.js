describe('angular-stomp-dk', () => {

    let ngstompProvider,
        stompClient = jasmine.createSpyObj('stompClient', ['connect', 'send', 'disconnect', 'subscribe', 'debug']),
        Stomp = {
            over : (value) => stompClient,
            client : (value) => stompClient
        };

    function resolve(promise) {

    }

    const   url = '/ws',
            login = 'login',
            password = 'password',
            clazz = 'Clazz',
            debug = true,
            vhost = 'localhost';

    beforeEach(module(function($provide) {
        $provide.constant('Stomp', Stomp);
    }));

    beforeEach(module('AngularStompDK', function (_ngstompProvider_) {
        ngstompProvider = _ngstompProvider_;

        spyOn(Stomp, 'over').and.callThrough();
        spyOn(Stomp, 'client').and.callThrough();
    }));


    describe('Provider', () => {
        describe('give settings one by one to provider', () => {
            beforeEach(inject(() => {
                ngstompProvider
                    .url(url)
                    .credential(login, password)
                    .class(clazz)
                    .debug(debug)
                    .vhost(vhost);
            }));

            it('should have some settings defined', () => {
                expect(ngstompProvider.settings.url).toBe(url);
                expect(ngstompProvider.settings.login).toBe(login);
                expect(ngstompProvider.settings.password).toBe(password);
                expect(ngstompProvider.settings.class).toBe(clazz);
                expect(ngstompProvider.settings.debug).toBeTruthy();
                expect(ngstompProvider.settings.vhost).toBe(vhost);
            });
        });
        describe('give whole settings to provider', () => {
            beforeEach(inject(() => {
                ngstompProvider
                    .setting({
                        url : '/ws',
                        login : 'login',
                        password : 'password',
                        class : 'Clazz',
                        debug : true,
                        vhost : 'localhost'
                    });
            }));

            it('should have some settings defined', () => {
                expect(ngstompProvider.settings.url).toBe(url);
                expect(ngstompProvider.settings.login).toBe(login);
                expect(ngstompProvider.settings.password).toBe(password);
                expect(ngstompProvider.settings.class).toBe(clazz);
                expect(ngstompProvider.settings.debug).toBeTruthy();
                expect(ngstompProvider.settings.vhost).toBe(vhost);
            });
        });
    });

    describe('Service', () => {

        let ngstomp, $log, $rootScope, $q;

        describe('specific configuration', () => {

            beforeEach(inject((_$q_, _$log_, _$rootScope_) => {
                $log = _$log_;
                $rootScope = _$rootScope_;
                $q = _$q_;

                ngstompProvider
                    .url(url)
                    .credential(login, password)
                    .debug(false)
                    .class(null)
                    .vhost(vhost);

                ngstomp = ngstompProvider
                    .$get($q, $log, $rootScope, Stomp)
            }));

            it('should instatiate and connect', () => {
                expect(Stomp.client).toHaveBeenCalled();
                expect(stompClient.debug).toBe(stompClient.debug);
                stompClient.debug();
                expect(stompClient.connect).toHaveBeenCalled();
            });


        });

        beforeEach(inject((_$q_, _$log_, _$rootScope_) => {
            $log = _$log_;
            $rootScope = _$rootScope_;
            $q = _$q_;

            ngstompProvider
                .url(url)
                .credential(login, password)
                .class(function() {})
                .debug(true)
                .vhost(vhost);

            ngstomp = ngstompProvider
                    .$get($q, $log, $rootScope, Stomp)
        }));

        describe("connect", () => {

            it('should instatiate and connect', () => {
                expect(Stomp.over).toHaveBeenCalled();
                expect(stompClient.debug).toBe($log.debug);
                expect(stompClient.connect).toHaveBeenCalled();
            });

            describe("with success", () => {
                it('should have resolved', () => {
                    stompClient.connect.calls.mostRecent().args[2]();
                    expect(ngstomp.promiseResult.$$state.status).toBe(1);
                })
            });

            describe("with error", () => {
                it('should have rejected', () => {
                    stompClient.connect.calls.mostRecent().args[3]();
                    expect(ngstomp.promiseResult.$$state.status).toBe(2);
                })
            })
        });

        it('should subscribe to a topic', () => {
            let fakeScope = jasmine.createSpyObj('fakeScope', ['$on']),
                callback = jasmine.createSpy('callback');

            ngstomp.promiseResult = $q.when({});
            ngstomp
                .subscribe('/url', callback, fakeScope);
            $rootScope.$apply();

            expect(stompClient.subscribe).toHaveBeenCalled();
            expect(stompClient.subscribe.calls.mostRecent().args[0]).toBe('/url');
            stompClient.subscribe.calls.mostRecent().args[1]();
            expect(callback).toHaveBeenCalled();
            expect(ngstomp.connections.length).toBe(1);
            expect(fakeScope.$on).toHaveBeenCalled();
            expect(fakeScope.$on.calls.mostRecent().args[1]).toBeDefined();
            fakeScope.$on.calls.mostRecent().args[1]();
        });

        it('should subscribe to a topic without scope', () => {
            ngstomp.promiseResult = $q.when({});
            ngstomp
                .subscribe('/url', function(){});
            $rootScope.$apply();

            expect(stompClient.subscribe).toHaveBeenCalled();
            expect(ngstomp.connections.length).toBe(1);
        });

        it('should unsubscribe', () => {
            let subscription = jasmine.createSpyObj('subscription', ['unsubscribe']);
            stompClient.subscribe.and.callFake(() => subscription);

            ngstomp.promiseResult = $q.when({});
            ngstomp.subscribe('/url', function(){});
            $rootScope.$apply();

            expect(ngstomp.connections.length).toBe(1);


            ngstomp.unsubscribe('/url');
            $rootScope.$apply();
            expect(ngstomp.connections.length).toBe(0);
            expect(subscription.unsubscribe).toHaveBeenCalled();
        });

        it('should unsubscribe', () => {
            ngstomp.promiseResult = $q.when({});
            ngstomp.subscribe('/url', function(){});
            $rootScope.$apply();

            expect(ngstomp.connections.length).toBe(1);

            ngstomp.unsubscribe('/url2');
            $rootScope.$apply();
            expect(ngstomp.connections.length).toBe(1);
        });

        describe('disconnection', () => {

            it('with succees', () => {
                ngstomp.disconnect();
                stompClient.disconnect.calls.mostRecent().args[0]();
            });

        });

        describe('send data', () => {

            it('should send data without headers', () => {
                ngstomp.promiseResult = $q.when({});
                let promise = ngstomp.send('/url', { key : 'key', value : 'value'});
                $rootScope.$apply();

                expect(stompClient.send).toHaveBeenCalledWith('/url', {}, "{\"key\":\"key\",\"value\":\"value\"}");
            })

        });


    });


});