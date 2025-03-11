import * as d3 from 'd3';
import { isNumber } from '../helpers/dataHelpers';
import { remove, fadeIn } from '../helpers/domHelpers';
import { COLOURS } from "../constants";
import { resetIcon } from "../assets/svgIcons";

const { BLUE, LIGHT_BLUE, GREY } = COLOURS;

export default function quadrantsBarChartKey() {
    // settings that apply to all quadrantsBartCharts, in case there is more than 1 eg a row of players
    let margin = { left:0, right:0, top: 0, bottom:0 };
    let width = 800;
    let height = 600;
    let contentsWidth;
    let contentsHeight;

    let quadrantWidth;
    let quadrantHeight;
   

    let styles = {
        axis:{
        },
        quadrant:{
            title:{
                fontSize:10
            },
            selectedTitle:{
            }
        },
    }

    function updateDimns(){
        contentsWidth = width - margin.left - margin.right;
        contentsHeight = height - margin.top - margin.bottom;
        quadrantWidth = contentsWidth/2;
        quadrantHeight = contentsHeight/2;
        styles.quadrant.title.fontSize = quadrantHeight * 0.2;
    };

    //state
    let selectedQuadrantIndex = null;
    //handlers
    let setSelectedQuadrantIndex = () => {};

    function chart(selection) {
        updateDimns();

        selection.each(function (data,i) {
            if(d3.select(this).selectAll("*").empty()){ init(this, data); }
            update(this, data);
        })

        function init(containerElement, data, settings={}){
            //'this' is the container
            const container = d3.select(containerElement);

            const contentsG = container.append("g").attr("class", "chart-contents");
            //bg
            contentsG
                .append("rect")
                    .attr("class", "chart-contents-bg")
                    .attr("stroke", "grey")
                    .attr("fill", "transparent");

            contentsG.append("line").attr("class", "axis x-axis");
            contentsG.append("line").attr("class", "axis y-axis");
            contentsG.selectAll("line.axis")
                .attr("stroke-width", 0.5)
                .attr("stroke", "grey")

        }

        function update(containerElement, data, settings={}){
            const contentsG = d3.select(containerElement).select("g.chart-contents")
                .attr("transform", `translate(${margin.left}, ${margin.top})`)
            
            //bg
            contentsG.select("rect.chart-contents-bg")
                .attr("width", `${contentsWidth}px`)
                .attr("height", `${contentsHeight}px`);

            //axes
            contentsG.select("line.x-axis")
                .attr("x1", 0)
                .attr("y1", contentsHeight/2)
                .attr("x2", contentsWidth)
                .attr("y2", contentsHeight/2)
            
            contentsG.select("line.y-axis")
                .attr("x1", contentsWidth/2)
                .attr("y1", 0)
                .attr("x2", contentsWidth/2)
                .attr("y2", contentsHeight)

            //Quadrants
            const quadrantContainerG = contentsG.selectAll("g.quadrant-container").data(data)
            quadrantContainerG.enter()
                .append("g")
                    .attr("class", (d,i) => `quadrant-container quandrant-container-${d.key}`)
                    .attr("cursor", "pointer")
                    .each(function(d,i){
                        const quadrantG = d3.select(this).append("g").attr("class", "quadrant")
                        quadrantG
                            .append("text")
                                .attr("class", "quadrant-title")
                                .attr("text-anchor", "middle")
                                .attr("dominant-baseline", "central")
                                .attr("stroke-width", 0.1)
                                .attr("opacity", selectedQuadrantIndex === i ? 1 : 0.5);
                    })
                    .merge(quadrantContainerG)
                    .attr("transform", (d,i) => `translate(${(i === 0 || i === 2) ? 0 : quadrantWidth}, ${(i === 0 || i === 1) ? 0 : quadrantHeight})`)
                    .on("click", function(e,d){
                        e.stopPropagation();
                        if(selectedQuadrantIndex !== d.i){
                            setSelectedQuadrantIndex(d.i)
                        }else{
                            setSelectedQuadrantIndex("")
                        }
                    })
                    .each(function(d,i){
                        const quadrantG = d3.select(this).select("g.quadrant");
                        quadrantG.select("text.quadrant-title")
                            .attr("transform", `translate(${quadrantWidth/2}, ${quadrantHeight/2})`)
                            .attr("font-size", styles.quadrant.title.fontSize)
                            .text(d.title)
                                .transition()
                                .duration(200)
                                    .attr("opacity", selectedQuadrantIndex === i ? 1 : 0.5);
                    })
            
            quadrantContainerG.exit().call(remove);

            //reset icon
            const resetIconData = isNumber(selectedQuadrantIndex) ? [1] : [];
            const resetG = contentsG.selectAll("g.reset-icon").data(resetIconData);
            resetG.enter()
                .append("g")
                .attr("class", "reset-icon")
                .call(fadeIn)
                .attr("cursor", "pointer")
                .each(function(){
                    const resetG = d3.select(this);
                    resetG.append("rect")
                        .attr("width", resetIcon.width)
                        .attr("height", resetIcon.height)
                        .attr("fill", "#F5F5F5");

                    resetG.append("path")
                        .attr("d", resetIcon.path.d)
                        .attr("fill", BLUE)
                        .attr("fillrule", resetIcon.path.fillrule)
                        .attr("transform", resetIcon.path.transform)
                })
                .merge(resetG)
                .attr("transform", `translate(${(contentsWidth - resetIcon.width)/2},${(contentsHeight - resetIcon.height)/2})`)
                .on("click", () => setSelectedQuadrantIndex(null))

            resetG.exit().call(remove);
        }

        return selection;
    }

    //api
    chart.width = function (value) {
        if (!arguments.length) { return width }
        width = value;
        return chart;
    };
    chart.height = function (value) {
        if (!arguments.length) { return height }
        height = value;
        return chart;
    };
    chart.margin = function (value) {
        if (!arguments.length) { return margin }
        margin = { ...margin, ...value };
        return chart;
    };
    chart.selectedQuadrantIndex = function (value) {
        if (!arguments.length) { return selectedQuadrantIndex; }
        selectedQuadrantIndex = value;
        return chart;
    };
    chart.setSelectedQuadrantIndex = function (func) {
        if (!arguments.length) { return setSelectedQuadrantIndex; }
        setSelectedQuadrantIndex = func;
        return chart;
    };
    return chart;
};
