module.exports = {
    randomInt: (min, max) => {
        return Math.floor(Math.random() * (max - min)) + min;
    },
    randomOperator: () => {
        return Math.random() < 0.5 ? '+' : '-';
    }
};