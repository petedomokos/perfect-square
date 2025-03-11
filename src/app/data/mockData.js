import { range, min, max, randomNormal } from 'd3';

const rehabCategories = [
  { key:"sharpness", name:"Sharpness" },
  { key:"cardio", name:"Cardio" },
  { key:"postural", name:"Postural" },
  { key:"technical", name:"Technical" },
]
const rehabMeasures = [
  //sharpness
  { preInjuryValue:27.2, key:"s1", name:"Max Speed", label:"MAX", categoryKey:"sharpness", range:[20, 35] },
  { preInjuryValue:0.25, key:"s2", name:"Turn Rate - Decel (sec)", label:"TRD", categoryKey:"sharpness", range:[20, 35], optimalValue:"min" },
  { preInjuryValue:0.16, key:"s3", name:"Turns Rate - Accel (sec)", label:"TRA", categoryKey:"sharpness", range:[20, 35], optimalValue:"min" },
  { preInjuryValue:19, key:"s4", name:"Short Sprints (nr)", label:"SS", categoryKey:"sharpness", range:[20, 35], optimalValue:"max" },
  { preInjuryValue:10, key:"s5", name:"Self-Report (/10)", label:"REP", categoryKey:"sharpness",range:[20, 35], optimalValue:"max" },
  //cardio
  { preInjuryValue:8, key:"c1", name:"High Speed Runs (nr)", label:"HSR", categoryKey:"cardio", range:[20, 35], optimalValue:"max" },
  { preInjuryValue:15, key:"c2", name:"Med Speed Runs (nr)", label:"MSR", categoryKey:"cardio", range:[20, 35], optimalValue:"max" },
  { preInjuryValue:9.8, key:"c3", name:"Total Distance (km)", label:"TOT", categoryKey:"cardio", range:[20, 35], optimalValue:"max" },
  { preInjuryValue:25, key:"c4", name:"Ball Actions (nr)", label:"ACT", categoryKey:"cardio", range:[20, 35], optimalValue:"max" },
  { preInjuryValue:10, key:"c5", name:"Self-Report (/10)", label:"REP", categoryKey:"cardio", range:[20, 35], optimalValue:"max" },
  //postural
  { preInjuryValue:0, key:"p1", name:"Knee Flex (deg)", label:"KF", categoryKey:"postural", range:[20, 35], optimalValue:"min" },
  { preInjuryValue:180, key:"p2", name:"Knee Ext (deg)", label:"KE", categoryKey:"postural", range:[20, 35], optimalValue:"max" },
  { preInjuryValue:120, key:"p3", name:"Turn(deg)", label:"TUR", categoryKey:"postural", range:[100, 140], optimalValue:120 }, //optimalValue should be 'other' ie a middle number
  { preInjuryValue:10, key:"p4", name:"Squat Position (/10)", label:"SQU", categoryKey:"postural", range:[20, 35], optimalValue:"min" },
  { preInjuryValue:10, key:"p5", name:"Self-Report (/10)", label:"REP", categoryKey:"postural", range:[20, 35], optimalValue:"min" },
  //technical
  { preInjuryValue:92, key:"t1", name:"Ball Control (%)", label:"CON", categoryKey:"technical", range:[20, 35], optimalValue:"min" },
  { preInjuryValue:64, key:"t2", name:"Attacking Pass Success (%)", label:"APS", categoryKey:"technical", range:[20, 35], optimalValue:"min" },
  { preInjuryValue:77, key:"t3", name:"Forward Pass Success (%)", label:"FPS", categoryKey:"technical", range:[20, 35], optimalValue:"min" },
  { preInjuryValue:74, key:"t4", name:"Dribble Success (%)", label:"DS", categoryKey:"technical", range:[20, 35], optimalValue:"min"},
  { preInjuryValue:79, key:"t5", name:"Shots On Target (%)", label:"SOT", categoryKey:"technical", range:[20, 35], optimalValue:"min" },
]
/*
The Data story
Sharpness - the 2 turn-rate ones lag and improve slowly, the other 3 get better, but only to about 80%
cardio - recovers steadily across all kpis up to 100%, so its a flat shape, gradually increasing
Postural - kne ext recovers quickly, but knee flex and squats lag behind, and plateux
...Turn-deg is also making no progress and weak. Self-report is moderate, so between the good and bad
Tech- all aspects lag behind the other 3 quds significantly
*/

const valuesForSessionsPostInjury = {
  //cat 1 - sharpness
  //max 27.2
  s1:[24, 24.2, 24.3, 24.8, 25.1, 25, 24.8, 24.7, 25, 25.2, 25.3, 25.3, 25.4, 25.3, 25.6, 25.7, 25.6, 25.4, 25.7, 25.6, 25.6, 25.7, 25.8, 25.8],
  //turn decel 0.25
  s2:[1.2, 1.23, 1.21, 1.1, 1.01, 0.96, 0.95, 0.91, 0.90, 0.87, 0.86, 0.81, 0.81, 0.76, 0.77, 0.75, 0.73, 0.72, 0.69, 0.65, 0.63, 0.61, 0.58, 0.56],
  //turn accel 0.16
  s3:[1.1, 1.05, 0.95, 0.91, 0.90, 0.87, 0.86, 0.81, 0.81, 0.76, 0.77, 0.75, 0.73, 0.72, 0.67, 0.65, 0.64, 0.57, 0.54, 0.49, 0.47, 0.43, 0.41, 0.38],
  //nr short sprints 19
  s4:[0, 0, 0, 2, 3, 3, 4, 5, 5, 6, 7, 8, 8, 9, 10, 11, 13, 14, 14, 15, 15, 16, 16, 16],
  //self-report 10
  s5:[1, 1, 1, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9, 8, 8],
  //cat 2 - cardio
  //HSR 8 
  c1:[1, 2, 2, 2, 3, 3, 3, 3, 4, 5, 7, 7, 7, 6, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  //MSR 15
  c2:[3, 3, 3, 4, 4, 5, 6, 6, 7, 8, 8, 10, 10, 9, 9, 10, 11, 13, 13, 14, 14, 15, 15, 15],
  //Dist 9.8
  c3:[6, 6.5, 6.7, 6.9, 6.8, 4.5, 6.9, 7.3, 7.4, 7.6, 7.5, 7.6, 8, 8.2, 8,8.5, 8.7, 8.4, 9.4, 9.1, 9.6, 9.8, 9.5, 9.8, 9.7],
  //Ball Actions 25
  c4:[ 5, 6, 6, 7, 9, 8, 8, 10, 12, 11, 10, 11, 11, 12, 13, 7, 10, 11, 14, 12, 9, 13, 14, 12],
  //self 10
  c5:[1, 1, 1, 2, 4, 3, 6, 6, 6, 7, 6, 7, 8, 8, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10],
  //cat 3 - postural
  //Knee flex 0
  p1:[40, 38, 36, 36, 32, 30, 33, 29, 27, 25, 24, 21, 18, 18, 17, 16, 16, 16, 15, 15, 14, 13, 13, 12],
  //knee ext 180
  p2:[150, 152, 155, 159, 158, 157, 159, 163, 164, 165, 167, 172, 174, 174, 175, 176, 176, 176, 177, 177, 177, 178, 180, 180],
  //turn deg 120
  p3:[137, 136, 133, 133, 132, 129, 128, 125, 123, 121, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120],
  //squat pos 10
  p4:[ 1, 1, 1, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7],
  //self 10
  p5:[1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9],
  //cat 4 - technical
  //control 92
  t1:[62, 61, 64, 64, 66, 67, 65, 67, 69, 71, 73, 70, 67, 72, 69, 71, 70, 71, 73, 75, 73, 71, 75, 74],
  //pass succ 84
  t2:[52, 54, 51, 55, 58, 51, 57, 59, 58, 61, 65, 63, 60, 57, 62, 66, 63, 65, 63, 61, 63, 65, 67, 65],
  //forward pass succ 77
  t3:[47, 50, 50, 52, 56, 46, 52, 57, 58, 60, 60, 58, 60, 57, 62, 61, 60, 59, 58, 61, 63, 60, 61, 60],
  //drib succ 74
  t4:[43, 51, 51, 49, 56, 56, 51, 53, 53, 57, 60, 55, 58, 52, 60, 55, 60, 54, 54, 58, 60, 58, 65, 58],
  //shots on targ 79
  t5:[44, 53, 51, 48, 52, 47, 54, 58, 52, 62, 54, 58, 62, 57, 58, 57, 61, 55, 54, 58, 60, 59, 60, 57],
}

const howItWorks = [
  "Click chart to select. Click key to select quadrant. Spread fingers to zoom. Drag to pan."
]

export const getRehabDataForVisuals = (nrSessions=24) => {
  const rehabData = {
    key:"rehab-data",
    title:["Rehab Tracker of Post-Injury", "Training Sessions"],
    desc:[
        "Shows player's recovery from injury, based on pre-injury indicators (standardised to 100%) across 4 categories.",
        "When all bars are filled in 100%, it shows a perfect square which means the player is back to pre-injury levels.",
        ...howItWorks
    ],
    playerName:"James Stevens",
    measures:rehabMeasures,
    categories:rehabCategories,
    datapoints:range(nrSessions).map(sessionIndex => createSessionData(sessionIndex)),
  }
  return prepareRehabDataForVisuals(rehabData);
}

function prepareRehabDataForVisuals(rehabData){
  const { key, title, desc, playerName, measures, categories, datapoints } = rehabData;
  return {
    key,
    title,
    desc,
    info:{ label:"Player Name", name: playerName },
    measures,
    categories:categories.map((c,i) => ({ key:c.key, title:c.name, i })),
    datapoints:datapoints.map(datapoint => ({
      ...datapoint,
      categoriesData:datapoint.categoriesData.map(datapointCategory => ({
        ...datapointCategory,

      }))
    })),
  }

}

function createSessionData(sessionIndex){
  const sessionKey = `session-${sessionIndex}`;
  return {
    key:sessionKey,
    title:`Session ${sessionIndex + 1}`,
    categoriesData:range(4).map(categoryIndex => createRehabCategoriesData(sessionIndex, sessionKey, categoryIndex))
  }
}

function createRehabCategoriesData(sessionIndex, sessionKey, categoryIndex){
  const category = rehabCategories[categoryIndex];
  const categoryKey = `${sessionKey}-category-${categoryIndex}`;
  return {
    key:categoryKey,
    title:category.name,
    values:rehabMeasures
      .filter(m => m.categoryKey === category.key)
      .map(m => ({
        key:`${categoryKey}-measure-${m.key}`,
        measureKey:m.key,
        value:valuesForSessionsPostInjury[m.key] ? valuesForSessionsPostInjury[m.key][sessionIndex] : null
      }))
  }
}


//GENERIC RANDOMISED MOCK DATA ------------------------------------------
const createMockDatum = (datapointIndex, categories=[], measures=[]) => {
  //Give the measure scores for this datapoint a random mean around 70, and standard deviation around 30
  const meanOfMean = 70;
  const stdDevOfMean = 40;
  const meanOfStdDev = 30;
  const stdDevOfStdDev = 20;
  const meanOfScore = randomNormal(meanOfMean, stdDevOfMean)();
  const stdDevOfScore = randomNormal(meanOfStdDev, stdDevOfStdDev)();
  //create the score generator using a normal distribution with this mean and stdDev
  const randGenerator = randomNormal(meanOfScore, stdDevOfScore);
  return { 
    key:`datapoint-${datapointIndex}`,
    title:`Datapoint ${datapointIndex + 1}`,
    categoriesData:range(4).map(categoryIndex => {
      const category = categories[categoryIndex];
      const categoryKey = `datapoint-${datapointIndex}-category-${categoryIndex}`;
      return {
        key:categoryKey,
        title:`Category ${categoryIndex + 1}`,
        values:measures
          .filter(m => m.categoryKey === category.key)
          .map(m => ({ key:`${categoryKey}-${m.key}`, measureKey:m.key, value:bound(Math.round(randGenerator())) }))
      }
    })
  }
}

const createMockMeasures = (nrMeasuresInEachCategory=[5,5,5,5]) => {
  return nrMeasuresInEachCategory
    .map((nrMeasures,i) => 
      range(nrMeasures).map(measureIndex => ({
        categoryKey:`category-${i}`,
        key:`measure-${measureIndex}`,
        label:`M${measureIndex + 1}`,
        preInjuryValue:100
      }))
    )
    .reduce((arr1,arr2) => [...arr1,...arr2])
  
}

//{ preInjuryValue:27.2, key:"s1", name:"Max Speed", label:"MAX", categoryKey:"sharpness", range:[20, 35] },

export function createMockDataForVisuals(nrDatapoints=100){
  const categories = range(4).map((categoryIndex) => ({ i:categoryIndex, key:`category-${categoryIndex}`, title:`Category ${categoryIndex + 1}`}));
  const measures = createMockMeasures();
  return {
    key:`mock-data-${nrDatapoints}`,
    title:[`${nrDatapoints} sets of mock datapoints displayed`],
    desc:[
      "Shows how each set of data compares against an ideal model. ",
      "When all bars are filled in 100%, it shows a perfect square which means the dataset has reached the ideal state.",
      ...howItWorks
  ],
    measures,
    categories,
    datapoints:range(nrDatapoints).map(datapointIndex => createMockDatum(datapointIndex, categories, measures)),
  };
}

function bound(value, lower=0, upper=100){
  return max([lower, min([upper, value])]);
}
