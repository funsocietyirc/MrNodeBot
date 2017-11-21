const _ = require('lodash');

const insults1 = [
    'racist',
    'xenophobic',
    'privileged',
    'white',
    'womyn-hating',
    'misogynistic',
    'racist',
    'chauvinistic',
    'hateful',
    'fascist',
    'racist',
    'straight',
    'narrow-minded',
    'deluded',
    'marginalizing',
];

const insults2 = [
    'sexist',
    'elitist',
    'oppressive',
    'ignorant',
    'patriarchal',
    'fat-shaming',
    'male',
    'hyper-masculine',
    'mansplaining',
    'middle-class',
    'nativist',
    'close-minded',
    'euro-centric',
    'ethno-centric',
    'elitist',
];

const insults3 = [
    'homophobic',
    'transphobic',
    'cisgendered',
    'islamophobic',
    'rich',
    'greedy',
    'nazi',
    'intolerant',
    'heteronormative',
    'heterosexual',
    'thin-privileged',
    'imperialistic',
    'nationalistic',
    'anti-semitic',
    'hate-mongering',
    'victim-blaming',
];

const insults4 = [
    'bigot',
    'Christian',
    'Conservative',
    'Republican',
    'Catholic',
    'Protestant',
    'prude',
    'zionist',
    'pig',
    'nazi',
    'neo-con',
    'Hitler',
    'neo-nazi',
    'traditionalist',
    'subhuman',
    'rapist',
    'colonialist',
    'sympathizer',
    'Nazi',
    'rape-apologist',
    'cracker',
    'white-devil',
    'WASP',
    'fear-monger',
];

module.exports = size => new Promise((resolve) => {
    const rand1 = _.sample(insults1);
    const rand2 = _.sample(insults2);
    const rand3 = _.sample(insults3);
    const rand4 = _.sample(insults4);

    const finalSize = _.isSafeInteger(size) && size > 0 ? size : 1;

    const output = [];

    _.times(
        size,
        output.push(`you're a ${rand1}, ${rand2}, ${rand3}, ${rand4}!`),
    );

    resolve(output);
});
