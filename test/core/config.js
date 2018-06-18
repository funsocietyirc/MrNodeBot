// We are testing
process.env.NODE_ENV = 'test';

const {describe, it} = require('mocha');


const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');

const config = require('../../config');

describe('The Configuration File', () => {
    const requiredTopLevelKeys = [
        'ircClientDebug',
        'project',
        'bot',
        'localization',
        'userManager',
        'commandBindings',
        'owner',
        'irc',
        'knex',
        'logio',
        'nickserv',
        'apiKeys',
        'gitLog',
        'accessLevels',
        'express',
        'features'
    ];

    it('has required top level keys', () => expect(config).to.include.all.keys(requiredTopLevelKeys));

    describe('has the correct type for top level keys', () => {
        it('has the property ircClientDebug which is a boolean', () => expect(config.ircClientDebug).to.be.a('boolean'));
        it('has the property project to be equal to package.json contents', () => expect(config.project).to.equal(require('../../package.json')));
        it('has the property bot which is an object', () => expect(config.bot).to.be.a('object'));
        it('has the property localization that is an object', () => expect(config.localization).to.be.a('object'));
        it('has the property userManager that is an object', () => expect(config.userManager).to.be.a('object'));
        it('has the property commandBindings that is an array', () => expect(config.commandBindings).to.be.a('array'));
        it('has the property owner that is a object', () => expect(config.owner).to.be.a('object'));
        it('has the property irc that is a object', () => expect(config.irc).to.be.a('object'));
        it('has the property knex that is a object', () => expect(config.knex).to.be.a('object'));
        it('has the property nickserv that is a object', () => expect(config.nickserv).to.be.a('object'));
        it('has the property apiKeys that is a object', () => expect(config.apiKeys).to.be.a('object'));
        it('has the property gitLog that is a object', () => expect(config.gitLog).to.be.a('object'));
        it('has the property accessLevels that is a object', () => expect(config.accessLevels).to.be.a('object'));
        it('has the property express that is a object', () => expect(config.express).to.be.a('object'));
        it('has the property features that is a object', () => expect(config.features).to.be.a('object'));
    });

});
