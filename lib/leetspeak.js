// Transform text into Elite speak
module.exports = text => text.replace(/l|i/gi, '1').replace(/z/gi, '2').replace(/e/gi, '3').replace(/a/gi, '4').replace(/s/gi, '5').replace(/G/g, '6').replace(/t/gi, '7').replace(/b/gi, '8').replace(/g/g, '9').replace(/o/gi, '0');
