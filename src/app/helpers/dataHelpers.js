import * as d3 from 'd3';

export const isNumber = number => typeof number === "number" && !isNaN(number);

export const percentageScoreConverter = (targetValue, options={}) => (value) => {
    const { dps=0, defaultValue, customRange, allowGreaterThan100=false, allowLessThanZero=false } = options;
    if(!isNumber(targetValue) || !isNumber(value)){
        //must handle default = 0 separately, but also allow user to choose any default eg null, undefined, "N/A" etc
        return isNumber(defaultValue) || defaultValue ? defaultValue : null;
    }
    const range = customRange || [0, targetValue];
    const rangeSize = Math.abs(range[1] - range[0]);
    const direction = range[1] - range[0] >= 0 ? "increasing" : "decreasing";
    const quantityOfRangeAchieved = direction === "increasing" ? value - range[0] : range[1] - value;
    const pc = Number(((quantityOfRangeAchieved/rangeSize) * 100).toFixed(dps));
    const lowerBound = allowLessThanZero && pc < 0 ? pc : 0;
    const upperBound = allowGreaterThan100 && pc > 100 ? pc : 100;
    return d3.min([upperBound, d3.max([lowerBound, pc])])
}


