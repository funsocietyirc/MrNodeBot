/**
 * Covid 19 Risk
 * @param age
 * @returns {{deathRate: number, survivalRate: number, hRate: number, icRate: number}}
 */
const covidRisk = (age) => {
    const deathRate = Math.max(0, -0.00186807 + 0.00000351867 * age ** 2 + (2.7595 * 10 ** -15) * age ** 7);
    return {
        deathRate,
        icRate: Math.max(0, -0.0572602 - -0.0027617 * age),
        hRate: Math.max(0, -0.0730827 - age * -0.00628289),
        survivalRate: 1 - deathRate,
    }
};

/**
 * Covid 19 Risk
 * @type {function(*): {deathRate: number, survivalRate: number, hRate: number, icRate: number}}
 */
module.exports = covidRisk;
