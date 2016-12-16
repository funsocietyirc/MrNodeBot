// We are testing
process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-moment'));
const moment = require('moment');
const expect = chai.expect;
const _ = require('lodash');

const config = require('../config');

const helpers = require('../helpers');

describe('Pluralize Helper', () => {
  it('defaults to no pluralization', () => expect(helpers.Plural('test')).to.equal('test'));
  it('does not add an s when given a 1', () => expect(helpers.Plural('test',1)).to.equal('test'));
  it('adds an s when given a number above 1', () => expect(helpers.Plural('test',2)).to.equal('tests'));  
});

describe('Start Time', () => {

    it('is a valid number', () => expect(helpers.StartTime).to.be.a.number);

    it('is a valid Moment.js object', () => {
      expect(helpers.StartTime).to.have.property('_isAMomentObject');
      expect(helpers.StartTime._isAMomentObject).to.be.true;
    });

    it('is in the future', () => expect(helpers.StartTime).to.be.beforeMoment(moment()));
});

describe('Access Strings', () => {

    // The Configuration File portion
    describe('Configuration File', () => {
        // The confiuration file is ok
        it('has valid configuration file', () => {
            expect(config.accessLevels).to.exist;
            expect(config.accessLevels).to.be.an('object');
            expect(config.accessLevels).to.not.be.empty;
        });
        // We get valid translations from the helpers
        it('value should be numeric', () => {
            for (const value in config.accessLevels) {
                expect(config.accessLevels[value]).to.be.a.number;
            }
        });
    });

    // The Helpers portion
    describe('Helpers', () => {
        it('gets a valid string response from helper', () =>
            _.each(config.accessLevels, (v, k) => {
                expect(helpers.AccessString(v)).to.be.a.string;
                expect(helpers.AccessString(v)).to.not.be.empty;
            })
        );

        it('should get an invalid response from helper', () =>
            expect(helpers.AccessString(config.accessLevels.length)).to.equal('Unknown')
        );

    });
});
