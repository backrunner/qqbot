const csprng = require('csprng');

module.exports = {
    realRandomInt: (min, max) => {
        let number = parseFloat(`0.${csprng(64, 10)}`);
        return Math.floor(max - number * (max - min));
    },
    randomInt: (min, max) => {
        return Math.floor(max - Math.random() * (max - min));
    },
    randomOperator: () => {
        return Math.random() < 0.5 ? '+' : '-';
    }
};