import {TestBed} from '@angular/core/testing';
import 'localforage';
import * as _ from 'lodash';
import {def} from '../../test.def';
import {NgForage} from '../main/NgForage.service';
import {NgForageConfig} from './NgForageConfig.service';
import {NgForageOptions} from './NgForageOptions';

describe('NgForageConfig service', () => {
  let conf: NgForageConfig;
  let defaults: NgForageOptions;

  beforeEach(() => {
    TestBed.configureTestingModule(def);
    conf = TestBed.get(NgForageConfig);
    defaults = _.cloneDeep(conf.config);
  });

  afterEach(() => {
    conf.configure(_.cloneDeep(defaults));
  });

  it('#toJSON() should be the same as #config', () => {
    expect(conf.toJSON()).toEqual(conf.config);
  });

  it('toStringTag', () => {
    expect(conf[Symbol.toStringTag]).toContain('NgForageConfig');
  });

  it('toString() should be a JSON.stringify', () => {
    expect(conf.toString()).toEqual(JSON.stringify(conf));
  });

  describe('#defineDriver', () => {
    let spec: LocalForageDriver;
    let inst: NgForage;

    beforeAll(() => {
      spec = {
        _driver: __filename,
        // tslint:disable-next-line:no-empty
        _initStorage() {
        },
        _support: true,
        getItem() {
          return Promise.resolve(null);
        },
        setItem() {
          return Promise.resolve(null);
        },
        removeItem() {
          return Promise.resolve(null);
        },
        clear() {
          return Promise.resolve(null);
        },
        length() {
          return Promise.resolve(null);
        },
        key() {
          return Promise.resolve(null);
        },
        keys() {
          return Promise.resolve(null);
        },
        iterate() {
          return Promise.resolve(null);
        }
      };
      inst = TestBed.get(NgForage);
    });

    it('Custom driver should be unsupported initially', () => {
      expect(inst.supports(spec._driver)).toBe(false);
    });

    it('Defining driver should return void promise', done => {
      conf.defineDriver(spec)
        .then(v => {
          expect(v).toBeUndefined();
          done();
        })
        .catch(done);
    });

    it('Driver should now be supported', () => {
      expect(inst.supports(spec._driver)).toBe(true);
    });
  });

  describe('#configure', () => {
    it('Shouldn\'t fail with undefined', () => {
      expect(conf.configure(<any>undefined)).toBe(conf);
    });

    const confs: NgForageOptions = {
      cacheTime: 1,
      description: 'foo',
      driver: 'foo',
      name: 'foo',
      size: 1,
      storeName: 'foo',
      version: 1
    };

    _.forEach(confs, (val: number | string, key: string) => {
      describe(`${key}`, () => {
        const checkSetter = () => {
          expect(conf[key]).toBe(val);
        };
        const checkConfig = () => {
          expect(conf.config[key]).toBe(val);
        };

        describe('Set via configure()', () => {
          beforeEach(() => {
            conf.configure({[key]: val});
          });

          it('Should be gettable via getter', checkSetter);
          it('Should be gettable via #config', checkConfig);
        });

        describe('Set via setter', () => {
          beforeEach(() => {
            conf[key] = val;
          });

          it('Should be gettable via getter', checkSetter);
          it('Should be gettable via #config', checkConfig);
        });
      });
    });
  });

});
