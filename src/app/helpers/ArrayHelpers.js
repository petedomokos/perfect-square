import * as d3 from 'd3';

//helpers
export function sortAscending(data, accessor =  d => d){
  const dataCopy = data.map(d => d);
  return dataCopy.sort((a, b) => d3.ascending(accessor(a), accessor(b)))
};

export function sortDescending(data, accessor =  d => d){
	const dataCopy = data.map(d => d);
	return dataCopy.sort((a, b) => d3.descending(accessor(a), accessor(b)))
  };
