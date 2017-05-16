'use strict';
// We are testing
process.env.NODE_ENV = 'test';

const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');

const pre = require('../../lib/preprocessText');
const config = require('../../config');

const beforeEach = () => {
    config.drunk = false;
};

describe('Returns a string', () => {
    it('Returns a empty string on null', () =>
        expect(
            pre(null)
        )
            .to
            .equal('')
    );

    it('Returns an empty string on a invalid type', () => expect(
        pre({})
        )
            .to
            .equal('')
    );

});

describe('Returns the proper output', () => {
    it('Handles a normal string', () => expect(
        pre('this is a test')
        )
            .to
            .equal('this is a test')
    );

    it('Handles a random string', () => expect(
        pre('{foo|bar|baz}')
        )
            .to
            .satisfy(text => text === 'foo' || text === 'bar' || text === 'baz')
    );

    it('Handles drunk test', () => {
        config.drunk = true;
        expect(pre('hello world'))
            .to
            .not
            .equal('hello world')
    });

});

describe('Handles a custom processor', () => {
    it('works with a custom processor', () => expect(
        pre('hello world', text => text.toUpperCase())
        )
            .to
            .equal('HELLO WORLD')
    );
});
