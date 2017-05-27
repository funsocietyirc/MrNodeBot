'use strict';
// We are testing
process.env.NODE_ENV = 'test';

const {describe, it, beforeEach} = require('mocha');

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.expect();
chai.use(sinonChai);
const expect = chai.expect;

const _ = require('lodash');

describe('test the actBack script', () => {

    const app = {
        nick: 'mrnodebot',
    };

    let actback = null;

    beforeEach(() => {
        app.action = sinon.spy();
        app.OnAction = {
            set: sinon.spy()
        };
        actback = require('../../scripts/listeners/actBack')(app);
    });

    it('has the required return data', () => expect(actback).to.include.keys('name', 'desc', 'createdBy', 'actions'));

    it('sends action when triggered correctly', () => {
        actback.actions.actBack('from', 'to', `kick ${app.nick} in the face`, 'message');
        const result = expect(app.action).to.be.called;
    });

    it('does not send action when triggered incorrect', () => {
        actback.actions.actBack('from', 'to', 'this is incorrect');
        const result = expect(app.action).to.not.be.called;
    });

    it('registers the listener', () => expect(app.OnAction.set).to.be.called);
});
