

/**
* Desc ...
* @constructor
* @param {string} 
* @param {Object}
* @param {Object[]}  
* @param {number} 
**/

//date optional
export const addDays = (n, date) => {
	const clonedDate = date ? new Date(date.getTime()) : new Date()
	return new Date(clonedDate.setDate(clonedDate.getDate() + n) )
}
export const addWeeks = (n, date) => {
	const clonedDate = date ? new Date(date.getTime()) : new Date()
	return new Date(clonedDate.setDate(clonedDate.getDate() + (n * 7)))
}

export const startOfMonth = date => {
	const month = date.getMonth();
	const year = date.getFullYear();
	const startStr = year + "-" + (month + 1) + "-01";
	return new Date(startStr);
}

export const addMonths = (n, date) => {
	const clone = new Date(date.getTime());
	return new Date(clone.setMonth(clone.getMonth() + n));
}

export const addYears = (n, date) => addWeeks(n * 52, date);

export const diffInWeeks = (d1, d2) => {
    var t2 = d2.getTime()
    var t1 = d1.getTime()

    return parseInt((t2-t1)/(24*3600*1000*7))
}

export const sameDay = (date1, date2) => {
	return date1.getYear() === date2.getYear() &&
		   date1.getMonth() === date2.getMonth() &&
		   date1.getDate() === date2.getDate()
}

export const millisecondsToDays = ms =>{
	return ms / 86400000
}

export function idFromDates(dates){
	return dates
		.map(d => d.getTime() +"")
		.join("-")
}

function calcBestUnits(from, to){
	return "days";
}

export function calcDateCount(from, to, requiredUnits, options={}){
	const { 
		maxDays=31, 
		maxWeeks=15, 
		maxMonths=23, 
		allowMixedYearsMonths=false,
		showZeroMonths=false
	} = options;
	//@todo next - calc this
	const fromMs = from.getTime();
	const toMs = to.getTime();
	const deltaMs = toMs - fromMs;
	const deltaDays = Math.round(millisecondsToDays(deltaMs));
	const absDeltaDays = Math.abs(deltaDays);
	if(absDeltaDays <= maxDays){
		return { 
			value: deltaDays, 
			unit: "days", 
			label: deltaDays === 1 ? "day" : "days",
			fullLabel: deltaDays === 1 ? "day" : "days"
		}
	}
	//16 weeks or less is given as weeks
	if(absDeltaDays <= (7 * maxWeeks)){
		const deltaWeeks = Math.round(deltaDays / 7);
		return { 
			value: deltaWeeks, 
			unit: "weeks", 
			label: deltaWeeks === 1 ? "wk" : "wks",
			fullLabel: deltaWeeks === 1 ? "week" : "weeks"
		}
	}
	//given in months (approx)
	if(absDeltaDays <= (maxMonths * 30.5)){
		//@todo - make it more accurate, and the years ie use a date library like Moment
		const deltaMonths = Math.round(deltaDays / 30.5); 
		return { 
			value: deltaMonths, 
			unit: "months", 
			label: deltaMonths === 1 ? "mth" : "mths",
			fullLabel: deltaMonths === 1 ? "month" : "months"
		}
	}
	//give as years, or mixed years and months if asked for in options
	const deltaYears = deltaDays / 365;
	const fullYears = Math.floor(deltaYears);
	const remainingMonths = Math.round((deltaYears - fullYears) * 12/10);
	if(!allowMixedYearsMonths || (remainingMonths === 0 || !showZeroMonths)){
		return { 
			value: fullYears, 
			unit: "years", 
			label: fullYears === 1 ? "yr" : "yrs",
			fullLabel: fullYears === 1 ? "year" : "years" 
		}
	}

	return {
		value: {
			years:fullYears,
			months:remainingMonths
		},
		label:{
			years:fullYears === 1 ? "yr" : "yrs",
			months:remainingMonths === 1 ? "mth" : "mths"
		},
		fullLabel:{
			years:fullYears === 1 ? "year" : "years",
			months:remainingMonths === 1 ? "month" : "months"
		},
		unit:"years-months"
	}
}

export function calcAge(dob, date){
	if(!dob){ return undefined; }
	const birthDate = typeof dob === "string" ? new Date(dob) : dob;
	const dateMS = date?.getTime() || Date.now();
    //calculate ms difference from current date in time  
    const deltaMS = dateMS - birthDate.getTime();
      
    //convert the calculated difference in date format  
    const deltaAge = new Date(deltaMS);  
    //extract year from date      
    const year = deltaAge.getUTCFullYear();  
    //now calculate the age of the user  
    return Math.abs(year - 1970);  
}