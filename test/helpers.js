// We are testing
process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-moment'));
const moment = require('moment');
const expect = chai.expect;
const _ = require('lodash');
const c = require('irc-colors');

const config = require('../config');
const helpers = require('../helpers');


describe('Title Line should provide IRC Formatting', () => {
    let sentence = 'This is a title line';
    let encoded = c.white.bold.bgblack(sentence);
    let decoded = c.stripColorsAndStyle(encoded);
    it('should not have the same result for the sentence and the encoded sentence', () => expect(sentence).to.not.equal(encoded));
    it('should have the same result for original sentence and decoded sentence', () => expect(sentence).to.equal(decoded));
});

describe('Url Pattern Regular Expression', () => {
    let pattern = helpers.ValidHostExpression;
    let validHosts = ['www.google.com', '127.0.0.1', 'this'];
    let invaldHosts = ['http://www.google.com', 'this/is/a/test']
    it('should pass valid hosts', () => _.each(validHosts, host => expect(host).to.match(pattern)));
    it('should vail invalid hosts', () => _.each(invaldHosts, host => expect(host).to.not.match(pattern)));
});

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
    ].join('').replace(helpers.FakeSpaceChars, '').trim()).to.be.empty));

describe('Non printing character Regex Expression', () => it('should match all given chars', () => expect(['\u0002', '\u001F', '\u0016', '\u0003', '\u000F'].join('').replace(helpers.RemoveNonPrintChars, '').trim()).to.be.empty));

describe('Strip New Line Regex Expression', () =>
    it('should match all given chars', () =>
        _.each(['\r', '\n', '\r\n', '\n\r'], result =>
            expect(helpers.StripNewLine(result).trim()).to.be.empty
        )
    )
);

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
    it('is a valid Moment.js object', () => expect(helpers.StartTime._isAMomentObject).to.be.true);
    it('is in the future', () => expect(helpers.StartTime).to.be.beforeMoment(moment()));
});

describe('Access Strings', () => {

    // The Configuration File portion
    describe('Configuration File', () => {
        // The confiuration file is ok
        it('has valid configuration file', () => expect(config.accessLevels).to.be.an('object'));
        // We get valid translations from the helpers
        it('value should be numeric', () => {
            for (const value in config.accessLevels) {
                expect(config.accessLevels[value]).to.be.a.number;
            }
        });
    });

    // The Helpers portion
    describe('Helpers', () => {
        it('gets a valid string response from helper', () => _.each(config.accessLevels, (v, k) => expect(helpers.AccessString(v)).to.be.a.string));
        it('should get an invalid response from helper', () => expect(helpers.AccessString(config.accessLevels.length)).to.equal('Unknown'));
    });
});
