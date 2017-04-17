'use strict';
// Original concept credited to http://www.hackerfactor.com/GenderGuesser.php
const _ = require('lodash');

module.exports = text => new Promise((resolve, reject) => {
  if (!text || !_.isString(text)) {
    reject('You did not give input, or gave improper input');
    return;
  }

  // Metric Place Holders
  let MaleInformal = 0;
  let MaleFormal = 0;
  let FemaleInformal = 0;
  let FemaleFormal = 0;

  let TextArray = _(text.split(/[^a-zA-Z]+/))
    .reject(_.isEmpty)
    .value();

  if (TextArray.length < 300) {
    reject(`Sample size is not big enough. I needed 300 words, I received ${TextArray.length}.`);
    return;
  }

  _(TextArray).each(Word => {
    if (!isNaN(DictionaryInformal[Word])) {
      if (DictionaryInformal[Word] > 0) {
        MaleInformal += DictionaryInformal[Word];
      }
      if (DictionaryInformal[Word] < 0) {
        FemaleInformal -= DictionaryInformal[Word];
      }
    }
    if (!isNaN(DictionaryFormal[Word])) {
      if (DictionaryFormal[Word] > 0) {
        MaleFormal += DictionaryFormal[Word];
      }
      if (DictionaryFormal[Word] < 0) {
        FemaleFormal -= DictionaryFormal[Word];
      }
    }
  });

  let FormalPercentage = (MaleFormal + FemaleFormal > 0) ?
    MaleFormal * 100.0 / (MaleFormal + FemaleFormal) :
    0;
  FormalPercentage = FormalPercentage ? parseInt(FormalPercentage * 100) / 100.0 : 0;

  let InformalPercentage = (MaleInformal + FemaleInformal > 0) ?
    MaleInformal * 100.0 / (MaleInformal + FemaleInformal) :
    0;
  InformalPercentage = InformalPercentage ? parseInt(InformalPercentage * 100) / 100.0 : 0;

  let CombinedPercentage = (FormalPercentage + InformalPercentage > 0) ?
    (FormalPercentage + InformalPercentage) / 2.0 :
    0;
  CombinedPercentage = Math.round(CombinedPercentage);

  let getSex = (male, female) => {
    if (male > female) return 'Male';
    if (male < female) return 'Female';
    return 'Unkown';
  };

  // Return results
  resolve({
    results: {
      // Formal
      Formal: {
        // Formal
        male: MaleFormal,
        female: FemaleFormal,
        percentage: FormalPercentage,
        diff: MaleFormal - FemaleFormal,
        weak: FormalPercentage > 40 && FormalPercentage < 60,
        sex: getSex(MaleFormal, FemaleFormal),
      },
      // Informal
      Informal: {
        male: MaleInformal,
        female: FemaleInformal,
        percentage: InformalPercentage,
        diff: MaleInformal - FemaleInformal,
        weak: InformalPercentage > 40 && InformalPercentage < 60,
        sex: getSex(MaleInformal, FemaleInformal),
      },
      Combined: {
        male: MaleFormal + MaleInformal,
        female: FemaleFormal + FemaleInformal,
        percentage: CombinedPercentage,
        diff: (MaleFormal + MaleInformal) - (FemaleFormal + FemaleInformal),
        weak: CombinedPercentage > 40 && CombinedPercentage < 60,
        sex: getSex(MaleFormal + MaleInformal, FemaleFormal + FemaleInformal),
      }
    },
    sampleSize: TextArray.length
  });
});

// Dictionary Of Informal Words
const DictionaryInformal = {
  actually: -49,
  am: -42,
  as: 37,
  because: -55,
  but: -43,
  ever: 21,
  everything: -44,
  good: 31,
  has: -33,
  him: -73,
  if: 25,
  in: 10,
  is: 19,
  like: -43,
  more: -41,
  now: 33,
  out: -39,
  since: -25,
  so: -64,
  some: 58,
  something: 26,
  the: 17,
  this: 44,
  too: -38,
  well: 15,
};

// Dictionary of Informal words
const DictionaryFormal = {
  a: 6,
  above: 4,
  and: -4,
  are: 28,
  around: 42,
  as: 23,
  at: 6,
  be: -17,
  below: 8,
  her: -9,
  hers: -3,
  if: -47,
  is: 8,
  it: 6,
  many: 6,
  me: -4,
  more: 34,
  myself: -4,
  not: -27,
  said: 5,
  she: -6,
  should: -7,
  the: 7,
  these: 8,
  to: 2,
  was: -1,
  we: -8,
  what: 35,
  when: -17,
  where: -18,
  who: 19,
  with: -52,
  your: -17,
};
