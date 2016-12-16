// We are testing
process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-moment'));
const moment = require('moment');
const expect = chai.expect;
const _ = require('lodash');

const config = require('../config');
const helpers = require('../helpers');

describe('Fake Space character Regex Expression', () => it('should match all given chars', () => expect(
    [
        '\u0009',
        '\u000A',
        '\u000B',
        '\u000C',
        '\u000D',
        '\u0085',
        '\u00A0',
        '\u1680',
        '\u2000',
        '\u2001',
        '\u2002',
        '\u2003',
        '\u2004',
        '\u2005',
        '\u2006',
        '\u2007',
        '\u2008',
        '\u2009',
        '\u200A',
        '\u2029',
        '\u202F',
        '\u205F',
        '\u3000',
        '\u180E',
        '\u200B',
        '\u200C',
        '\u200D',
        '\u2060',
        '\uFEFF',
    ].join('').replace(helpers.RemoveNonPrintChars, '').trim()).to.be.empty));

describe('Non printing character Regex Expression', () => it('should match all given chars', () => expect(['\u0002', '\u001F', '\u0016', '\u0003', '\u000F'].join('').replace(helpers.RemoveNonPrintChars, '').trim()).to.be.empty));

describe('Rot13 Encode / Decode', () => {
    let sentence = 'How are you today, I am fine, I am a Robot...';
    let encoded = helpers.Rot13(sentence);
    let decoded = helpers.Rot13(encoded);

    it('should have difference values', () => expect(encoded).to.not.equal(decoded));
    it('should have the same initial value as decoded value', () => expect(sentence).to.equal(decoded));
});

describe('Pluralize Helper', () => {
    it('defaults to no pluralization', () => expect(helpers.Plural('test')).to.equal('test'));
    it('does not add an s when given a 1', () => expect(helpers.Plural('test', 1)).to.equal('test'));
    it('adds an s when given a number above 1', () => expect(helpers.Plural('test', 2)).to.equal('tests'));
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
