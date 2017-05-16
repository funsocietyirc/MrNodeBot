'use strict';
// We are testing
process.env.NODE_ENV = 'test';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.expect();
chai.use(sinonChai);
const expect = chai.expect;

const _ = require('lodash');
const c = require('irc-colors');

const ircTypo = require('../../scripts/lib/_ircTypography');

describe('String Builder', () => {

    it('appends a string', () => {
        let string = new ircTypo.StringBuilder();
        string.append('hello world');
        expect(string.text).to.equal('hello world');
    });

    it('appends a string with an invalid logo', () => {
        let string = new ircTypo.StringBuilder({
            logo: 'hello'
        });
        string.append('this is a test');
        expect(string.text).to.equal('this is a test');
    });

    it('appends a string with a valid logo', () => {
        let string = new ircTypo.StringBuilder({
            logo: 'twitter'
        });
        string.append('this is a test');
        let result = `${ircTypo.logos['twitter']} this is a test`;
        expect(string.text).to.equal(result);
    });

    it('inserts dividers properly', () => {
        let string = new ircTypo.StringBuilder({
            divider: '/'
        });
        string.insert('hello');
        string.insertDivider();
        string.insert('world');
        expect(string.text).to.equal('hello / world');
    });

    it('inserts custom dividers proerply', () => {
        let string = new ircTypo.StringBuilder();
        string.insert('hello');
        string.insertDivider('|');
        string.insert('world');
        expect(string.text).to.equal('hello | world');
    });

    it('append chains properly', () => {
        let string = new ircTypo.StringBuilder();
        let divider = string.options.divider;
        string
            .append('hello')
            .append('world')
            .append('this')
            .append('is a test');
        expect(string.text).to.equal(`hello ${divider} world ${divider} this ${divider} is a test`);
    });

});
