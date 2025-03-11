import * as d3 from 'd3';
import { isNumber } from '../helpers/dataHelpers';
import { remove, fadeIn } from '../helpers/domHelpers';
import { COLOURS } from "../constants";

const { BLUE, LIGHT_BLUE, GREY } = COLOURS;

export default function quadrantsBarChart() {
    // settings that apply to all quadrantsBartCharts, in case there is more than 1 eg a row of players
    let margin = { left:0, right:0, top: 0, bottom:0 };
    let width = 800;
    let height = 600;
    let contentsWidth;
    let contentsHeight;

    let chartTitleHeight;
    let chartWidth;
    let chartHeight;

    let gapBetweenQuadrants;
    let zoomedGapBetweenQuadrants;
    let quadrantWidth;
    let quadrantHeight;
    let quadrantTitleHeight;

    let quadrantsSummaryWidth;
    let quadrantsSummaryHeight;

    let barsAreaWidth;
    let barsAreaHeight;
    let extraHorizMargin;
    let extraVertMargin;

    let styles = {
        chart:{
            title:{
                fontSize:12
            },
            subtitle:{
                fontSize:10
            }
        },
        quadrant:{
            title:{
                fontSize:10
            },
            selectedTitle:{
                fontSize:10
            }
        },
        bar:{
            fontSize:10
        }
    }

    //settings
    let zoomState = { transform: d3.zoomIdentity };
    let withQuadrantTitles;
    //let withBarLabels;
    let levelOfDetail;
    let shouldShowTitle;
    let shouldShowSubtitle;
    let barsAreClickable;
    let shouldShowQuadrantsSummary;

    let nrCharts;

    function updateDimns(){
        scaleValue = value => value / zoomState.transform.k;

        const maxContentsWidth = width - margin.left - margin.right;
        const maxContentsHeight = height - margin.top - margin.bottom;
        //next - pass xoom state thorugyh and use it for calculating sizes
        chartTitleHeight = maxContentsHeight * 0.15;// d3.max([18, maxContentsHeight * 0.1]);
        quadrantTitleHeight = 0;
        withQuadrantTitles = false;
        //withBarLabels = true;
        levelOfDetail = 1;
        if(chartTitleHeight * zoomState.transform.k > 10){
            levelOfDetail = 2;
        }
        if(chartTitleHeight * zoomState.transform.k > 45){
            levelOfDetail = 3;
        }
        shouldShowTitle = levelOfDetail >= 2;
        shouldShowSubtitle = levelOfDetail >= 3;
        barsAreClickable = levelOfDetail >= 3;
        shouldShowQuadrantsSummary = levelOfDetail >= 3;

        //contentsheight includes space for quad titles, whereas contenstWidth doesnt
        contentsWidth = d3.min([maxContentsWidth, maxContentsHeight - chartTitleHeight - 2 * quadrantTitleHeight]);
        contentsHeight = contentsWidth + chartTitleHeight + 2 * quadrantTitleHeight;

        const extraHorizSpace = maxContentsWidth - contentsWidth;
        const extraVertSpace = maxContentsHeight - contentsHeight;
        extraHorizMargin = extraHorizSpace/2;
        extraVertMargin = extraVertSpace/2;

        gapBetweenQuadrants = d3.min([10, contentsWidth * 0.005]);
        //keep the gap between quadrants under some control
        const maxGapBetweenQuadrants = gapBetweenQuadrants * 5;
        //note - the zoomed gap is the one displayed, but it doesnt affect any other calculations, so it can adjust with zoom
        //and not affect performance
        zoomedGapBetweenQuadrants = d3.min([maxGapBetweenQuadrants, gapBetweenQuadrants * zoomState.transform.k ** 0.7]);

        quadrantsSummaryWidth = contentsWidth * 0.3;
        quadrantsSummaryHeight = chartTitleHeight * 0.8;

        chartWidth = contentsWidth;
        chartHeight = contentsHeight - chartTitleHeight;
        quadrantWidth = (contentsWidth - gapBetweenQuadrants)/2;
        //quadrant title is part of the quadrant, whereas chart title is not, so we subtract it
        quadrantHeight = (chartHeight - gapBetweenQuadrants)/2;
        //Each bar area works out as a square because of the way dimns are done above
        barsAreaWidth = quadrantWidth;
        barsAreaHeight = quadrantHeight - quadrantTitleHeight;

        //styles that are based on dimns
        styles.chart.title.fontSize = shouldShowSubtitle ? chartTitleHeight * 0.4 : chartTitleHeight * 0.55;
        styles.chart.subtitle.fontSize = chartTitleHeight * 0.25;
        styles.quadrant.title.fontSize = quadrantHeight * 0.11;
        styles.quadrant.selectedTitle.fontSize = quadrantHeight * 0.11;
        styles.bar.fontSize = quadrantHeight * 0.09;
    };

    //state
    let selectedQuadrantIndex = null;
    let selectedChartKey = "";
    //handlers
    let setSelectedChartKey = () => {};
    let updateZoom;

    //helper
    let scaleValue;

    function chart(selection) {
        nrCharts = selection.nodes().length;
        updateDimns();

        selection.each(function (data,i) {
            if(d3.select(this).selectAll("*").empty()){ init(this, data); }
            update(this, data);
        })

        function init(containerElement, data, settings={}){
            //'this' is the container
            const container = d3.select(containerElement);
            //here do anything for the chart that isnt repeated for all quadrants
            //or just remove the init-update functions altogether
            //bg
            container.append("rect").attr("class", "chart-bg")
                .attr("fill", "transparent");

            const contentsG = container.append("g").attr("class", "chart-contents");
            contentsG.append("rect").attr("class", "chart-contents-bg")
                .attr("fill", "transparent");

            //chart title and contents gs
            const chartTitleG = contentsG.append("g").attr("class", "chart-title");
            const mainContentsG = contentsG.append("g").attr("class", "main-contents");

            //title
            chartTitleG
                .append("text")
                    .attr("class", "title")
                        .attr("dominant-baseline", "hanging")
                        .attr("opacity", 0)
                        .attr("stroke-width", 0.1);
                
            chartTitleG
                .append("text")
                    .attr("class", "subtitle")
                        .attr("opacity", 0)
                        .attr("stroke-width", 0.1);
                      
            const quadrantsSummaryG = chartTitleG.append("g").attr("class", "quadrants-summary");
            quadrantsSummaryG.append("rect")
                .attr("class", "quadrants-summary-outline")
                .attr("stroke", "grey")
                .attr("stroke-width", scaleValue(0.1))
                .attr("fill", "none");

            quadrantsSummaryG.append("line").attr("class", "quadrants-summary-vertical-line quadrants-summary-outline");
            quadrantsSummaryG.append("line").attr("class", "quadrants-summary-horizontal-line quadrants-summary-outline");
            quadrantsSummaryG.selectAll("line")
                .attr("stroke", "grey")
                .attr("stroke-width", scaleValue(0.1));

            //title-hitbox
            chartTitleG.append("rect").attr("class", "chart-title-hitbox")
                .attr("cursor", "pointer")
                .attr("fill", "transparent");


            //g that handles scaling when selections made
            mainContentsG.append("g").attr("class", "scale").attr("transform", "scale(1)");

            //chart-hitbox
            mainContentsG.append("rect").attr("class", "chart-hitbox")
                .attr("cursor", "pointer")
                .attr("fill", "transparent");

        }

        function update(containerElement, data, options={}){
            //'this' is the container
            const container = d3.select(containerElement);
            const anotherChartIsSelected = selectedChartKey && selectedChartKey !== data.key;
            //bg
            container.select("rect.chart-bg")
                .attr("width", `${width}px`)
                .attr("height", `${height}px`);

            const contentsG = container.select("g.chart-contents")
                .attr("transform", `translate(${margin.left + extraHorizMargin}, ${margin.top + extraVertMargin})`);

            contentsG.select("rect.chart-contents-bg")
                .attr("width", `${contentsWidth}px`)
                .attr("height", `${contentsHeight}px`);

            updateTitle.call(containerElement, data);

            const quadrantsSummaryG = contentsG.select("g.chart-title").select("g.quadrants-summary");
            quadrantsSummaryG
                .transition()
                .duration(100)
                    .attr("transform", `translate(${contentsWidth + zoomedGapBetweenQuadrants - gapBetweenQuadrants - quadrantsSummaryWidth},0)`)
                    .attr("opacity", shouldShowQuadrantsSummary ? 1 : 0);

            const quadrantSummaryG = quadrantsSummaryG.selectAll("g.quadrant-summary").data(data.quadrantsData, q => q.key);
            quadrantSummaryG.enter()
                .append("g")
                    .attr("class", "quadrant-summary")
                    .each(function(){
                        d3.select(this)
                            .append("text")
                                .attr("text-anchor", "middle")
                                .attr("dominant-baseline", "central");
                    })
                    .merge(quadrantSummaryG)
                    .attr("transform", (d,i) => `translate(${i === 0 || i === 2 ? 0 : quadrantsSummaryWidth/2},${i <= 1 ? 0 : quadrantsSummaryHeight/2})`)
                    .each(function(summaryD){
                        d3.select(this).select("text")
                            .attr("x", quadrantsSummaryWidth/4)
                            .attr("y", quadrantsSummaryHeight/4)
                            .attr("font-size", scaleValue(9))
                            .attr("stroke", anotherChartIsSelected ? "grey" : (summaryD.value < 50 ? "red" : BLUE))
                            .attr("fill", anotherChartIsSelected ? "grey" : (summaryD.value < 50 ? "red" : BLUE))
                            .attr("stroke-width", scaleValue(0.2))
                            .text(`${summaryD.value}%`);
                    })
            
            //outline and lines
            quadrantsSummaryG.select("rect")
                .attr("width", quadrantsSummaryWidth)
                .attr("height", quadrantsSummaryHeight)
                .attr("stroke-width", scaleValue(0.1));

            quadrantsSummaryG.select("line.quadrants-summary-vertical-line")
                .attr("x1", quadrantsSummaryWidth/2)
                .attr("x2", quadrantsSummaryWidth/2)
                .attr("y1", 0)
                .attr("y2", quadrantsSummaryHeight)
                .attr("stroke-width", scaleValue(0.1));

            quadrantsSummaryG.select("line.quadrants-summary-horizontal-line")
                .attr("x1", 0)
                .attr("x2", quadrantsSummaryWidth)
                .attr("y1", quadrantsSummaryHeight/2)
                .attr("y2", quadrantsSummaryHeight/2)
                .attr("stroke-width", scaleValue(0.1));
                    

            //Chart contents
            const mainContentsG = contentsG.select("g.main-contents")
                .attr("transform", `translate(0, ${chartTitleHeight})`);

            //hitboxes (title is always clickable, but chart itself is only clickable when bars are not)
            contentsG.select("rect.chart-title-hitbox")
                .attr("width", contentsWidth)
                .attr("height", chartTitleHeight)
                .on("click", () => setSelectedChartKey(data.key))
                .attr("stroke-width", scaleValue(0.3))

            mainContentsG.select("rect.chart-hitbox")
                .attr("display", barsAreClickable ? "none" : null)
                .attr("width", chartWidth)
                .attr("height", chartHeight)
                .attr("fill", "transparent")
                .on("click", () => setSelectedChartKey(data.key))

            //scaling transforms
            const scaleG = mainContentsG.select("g.scale");

            const chartTransformOrigin = 
                selectedQuadrantIndex === 0 ? `${contentsWidth} ${contentsHeight}` :
                selectedQuadrantIndex === 1 ? `0 ${contentsHeight}` :
                selectedQuadrantIndex === 2 ? `${contentsWidth} 0` :
                `0 0`;

            const chartTransform = `scale(${isNumber(selectedQuadrantIndex) ? 0.5 : 1})`;
            scaleG
                .transition()
                .delay(isNumber(selectedQuadrantIndex) ? 0 : 75)
                .duration(500)
                    .attr("transform", chartTransform)
                    .attr("transform-origin", chartTransformOrigin)

            //Quadrants
            const quadrantContainerG = scaleG.selectAll("g.quadrant-container").data(data.quadrantsData, d => d.key)
            quadrantContainerG.enter()
                .append("g")
                    .attr("class", (d,i) => `quadrant-container quandrant-container-${d.key}`)
                    .each(function(d,i){
                        const quadrantContainerG = d3.select(this);
                        const quadrantG = quadrantContainerG.append("g").attr("class", "quadrant")

                        quadrantG
                            .append("text")
                                .attr("class", "quadrant-title")
                                .attr("text-anchor", "middle")
                                .attr("dominant-baseline", "central")
                                .attr("stroke-width", 0.1)
                                .attr("opacity", withQuadrantTitles ? 0.5 : 0)
                                .attr("display", withQuadrantTitles ? null : "none");

                        const shouldShowSelectedQuadrantTitle = !withQuadrantTitles && selectedQuadrantIndex === i;
                        quadrantG
                            .append("text")
                                .attr("class", "selected-quadrant-title")
                                    .attr("text-anchor", "middle")
                                    .attr("dominant-baseline", i < 2 ? null : "hanging")
                                    .attr("stroke-width", 0.1)
                                    .attr("display", shouldShowSelectedQuadrantTitle ? null : "none")
                                    .attr("opacity", shouldShowSelectedQuadrantTitle ? 0.5 : 0)


                        const barsAreaG = quadrantG.append("g").attr("class", "bars-area");
                        const anotherQuadrantIsSelected = isNumber(selectedQuadrantIndex) && selectedQuadrantIndex !== i;
                        barsAreaG
                            .append("rect")
                                .attr("class", "bars-area-bg")
                                .attr("stroke", anotherQuadrantIsSelected || anotherChartIsSelected ? GREY : BLUE)
                                .attr("stroke-width", scaleValue(anotherQuadrantIsSelected || anotherChartIsSelected ? 0.1 : 0.3))
                                .attr("fill", "transparent");
                         
                        barsAreaG.append("g").attr("class", "bars");
                    })
                    .merge(quadrantContainerG)
                    .attr("transform", (d,i) => `translate(${(i === 0 || i === 2) ? 0 : quadrantWidth + zoomedGapBetweenQuadrants}, ${(i === 0 || i === 1) ? 0 : quadrantHeight + zoomedGapBetweenQuadrants})`)
                    .each(function(quadD,i){
                        const quadrantContainerG = d3.select(this);
                        //make sure bar labels etc are on top of DOM
                        if(selectedQuadrantIndex === i){ quadrantContainerG.raise(); }

                        const quadScale = i === selectedQuadrantIndex ? 3 : 1;
                        const quadTransformOrigin =
                            selectedQuadrantIndex === 0 ? `${quadrantWidth} ${quadrantHeight}` :
                            selectedQuadrantIndex === 1 ? `0 ${quadrantHeight}` :
                            selectedQuadrantIndex === 2 ? `${quadrantWidth} 0` :
                            `0 0`;

                        const quadrantG = quadrantContainerG.select("g.quadrant");
                        quadrantG
                            .transition()
                            .delay(isNumber(selectedQuadrantIndex) ? 75 : 0)
                            .duration(500)
                                .attr("transform", `scale(${quadScale})`)
                                .attr("transform-origin", quadTransformOrigin);

                        const titleShiftHoriz = i === 0 || i === 2 ? barsAreaWidth/2 : barsAreaWidth/2;
                        const titleShiftVert = i === 0 || i === 1 ? quadrantTitleHeight/2 : quadrantHeight - quadrantTitleHeight/2;
                        quadrantG.select("text.quadrant-title")
                            .attr("transform", `translate(${titleShiftHoriz}, ${titleShiftVert})`)
                            .attr("font-size", styles.quadrant.title.fontSize)
                            .text(quadD.title)
                                .transition()
                                .duration(200)
                                    .attr("opacity", withQuadrantTitles ? 0.5 : 0)
                                    .on("end", function(){ d3.select(this).attr("display", withQuadrantTitles ? null : "none") });


                        const shouldShowSelectedQuadrantTitle = !withQuadrantTitles && selectedQuadrantIndex === i;
                        const selectedQuadrantTitleText = quadrantG.select("text.selected-quadrant-title");
                        //@todo - use a fadeIn custom function that checks for this
                        if(shouldShowSelectedQuadrantTitle && selectedQuadrantTitleText.attr("display") === "none"){ selectedQuadrantTitleText.attr("display", null) }
                        selectedQuadrantTitleText
                            .attr("x", quadrantWidth/2)
                            .attr("y", i < 2 ? -2 : quadrantHeight + 2)
                            .attr("font-size", styles.quadrant.selectedTitle.fontSize)
                            .text(quadD.title)
                                .transition()
                                .duration(500)
                                    .attr("opacity", shouldShowSelectedQuadrantTitle ? 0.5 : 0)
                                        .on("end", function(){ d3.select(this).attr("display", shouldShowSelectedQuadrantTitle ? null : "none")})

                        const barAreaShiftVert = i === 0 || i === 1 ? quadrantTitleHeight : 0;
                        const barsAreaG = quadrantG.select("g.bars-area")
                            .attr("transform", `translate(0, ${barAreaShiftVert})`);

                        const anotherQuadrantIsSelected = isNumber(selectedQuadrantIndex) && selectedQuadrantIndex !== quadD.i;
                        const anotherChartIsSelected = selectedChartKey && selectedChartKey !== data.key;
                        barsAreaG.select("rect.bars-area-bg")
                            .attr("width", barsAreaWidth)
                            .attr("height", barsAreaHeight);

                        barsAreaG.select("rect.bars-area-bg")
                                .transition()
                                .duration(500)
                                    .attr("stroke", anotherQuadrantIsSelected || anotherChartIsSelected ? GREY : BLUE)
                                    .attr("stroke-width", scaleValue(anotherQuadrantIsSelected || anotherChartIsSelected ? 0.1 : 0.3))

                        //bars
                        const nrBars = quadD.values.length;
                        const nrGaps = nrBars - 1;
                        //gap must not be as large as the axeswidth
                        const gapBetweenBars = gapBetweenQuadrants * 0.1;
                        const totalSpaceForBars = barsAreaWidth - gapBetweenBars * nrGaps;
                        const barWidth = totalSpaceForBars/nrBars;
                        //const barLabelWidth = 15;
                        //const barLabelHeight = 4;
                        //const horizLabelMargin = barWidth * 0.2;

                        //@todo - base this showing on zoomScale * quadrantsWidth
                        const shouldShowBars = true;
                        const barsData = shouldShowBars ? quadD.values : [];

                        const barsG = barsAreaG.select("g.bars");
                        const barG = barsG.selectAll("g.bar").data(barsData, d => d.key);
                        barG.enter()
                            .append("g")
                                .attr("class", `bar`)
                                .attr("cursor", "pointer")
                                .each(function(barD,j){
                                    const barHeight = barD.calcBarHeight(barsAreaHeight);
                                    const barG = d3.select(this);
                                    barG
                                        .append("rect")
                                            .attr("class", "bar")
                                                .attr("width", barWidth)
                                                .attr("height", barHeight)
                                                .attr("fill", anotherQuadrantIsSelected || anotherChartIsSelected ? GREY : BLUE);
                                })
                                .merge(barG)
                                .each(function(barD,j){

                                    const barHeight = barD.calcBarHeight(barsAreaHeight);
                                    //no space between bars and outer edge of chart
                                    const barG = d3.select(this)
                                        .attr("transform", `translate(${j * (barWidth + gapBetweenBars)},${i < 2 ? barsAreaHeight - barHeight : 0})`)
                                        .on("click", function(){
                                            console.log("bar clicked", barD)
                                        });

                                    barG.select("rect.bar")
                                        .transition()
                                        .duration(100)
                                            .attr("width", barWidth)
                                            .attr("height", barHeight)
                                            .attr("fill", anotherQuadrantIsSelected || anotherChartIsSelected ? GREY : BLUE);

                                    //labels
                                    /*
                                    const shouldShowLabels = withBarLabels && selectedQuadrantIndex === j;
                                    const labelG = barG.selectAll("g.bar-label").data(shouldShowLabels ? [1] : []);
                                    labelG.enter()
                                        .append("g")
                                            .attr("class", "bar-label")
                                            .call(fadeIn)
                                            .each(function(){
                                                const labelG = d3.select(this);
                                                labelG.append("rect")
                                                    .attr("fill", LIGHT_BLUE)
                                                    .attr("stroke-width", 0.3)
                                                    .attr("rx", "2")
                                                    .attr("ry", "2");
                                                
                                                labelG.append("text")
                                                    .attr("x", barLabelWidth/2)
                                                    .attr("y", `${barLabelHeight/2}`)
                                                    .attr("dominant-baseline", "central")
                                                    .attr("text-anchor", "middle")
                                                    .attr("fill", "white")
                                                    .attr("stroke", "white")
                                                    .attr("stroke-width", 0.1)
                                                    .attr("font-size", styles.bar.fontSize)
                                                    .text(barD.label);
                                            })
                                            .merge(labelG)
                                            .each(function(){
                                                const labelG = d3.select(this);
                                                const vertAdjustmentForOverlap = 2.5;
                                                const labelAngle = -45;
                                                //@todo - if angel not 45, need to use toRadians function
                                                const labelAngleRads = Math.PI/4;
                                                const labelX = i < 2 ? -(barLabelWidth * Math.cos(labelAngleRads)) + horizLabelMargin : horizLabelMargin; 
                                                const labelY = i < 2 ? (barHeight - vertAdjustmentForOverlap) + (barLabelWidth * Math.sin(labelAngleRads)) : 0; 
                                                const shouldShowlabels = withBarLabels && selectedQuadrantIndex === i;
                                                
                                                //turn display on before fade in if necc
                                                //@todo - use a fadeIn custom function that checks for this
                                                if(shouldShowlabels && labelG.attr("display") === "none"){ labelG.attr("display", null) }
                                                labelG
                                                    .attr("transform", `translate(${labelX} ${labelY}) rotate(${labelAngle})`)
                                                    .transition()
                                                    .duration(500)
                                                        .attr("opacity", shouldShowlabels ? 1 : 0)
                                                        //if revealing them, we need to set display to null before trans
                                                        //.on("end", function(){ d3.select(this).attr("display", shouldShowlabels ? null : "none" )});

                                                labelG.select("rect")
                                                    .attr("width", `${barLabelWidth}px`)
                                                    .attr("height", `${barLabelHeight}px`)
                                                    .attr("opacity", 0.8);

                                            })
                                    */
                                })

                        barG.exit().call(remove);

                    })
            
            quadrantContainerG.exit().call(remove);

            //handlers and helpers
        }

        function updateTitle(data){
            const titleG = d3.select(this).select("g.chart-title");
            titleG.select("text.title")
                .transition()
                .duration(100)
                    .attr("opacity", shouldShowTitle ? 0.55 : 0)
                    .attr("font-size", styles.chart.title.fontSize)
                    .text(data.title || "");


            titleG.select("text.subtitle")
                .transition()
                .duration(100)
                    .attr("transform", `translate(0, ${chartTitleHeight * 0.8})`)
                    .attr("opacity", shouldShowSubtitle ? 0.45 : 0)
                    .attr("font-size", styles.chart.subtitle.fontSize)
                    .text(data.subtitle || (data.position ? `Position ${data.position} / ${nrCharts}` : ""));

        }

        updateZoom = function(){
            updateDimns();
            selection.each(function(data,i){
                const chartG = d3.select(this);
                const anotherChartIsSelected = selectedChartKey && selectedChartKey !== data.key;
                //hide/show title
                updateTitle.call(this, data);
                const quadrantsSummaryG = chartG.select("g.chart-title").select("g.quadrants-summary");
                quadrantsSummaryG
                    .transition()
                    .duration(100)
                        .attr("transform", `translate(${contentsWidth + zoomedGapBetweenQuadrants - gapBetweenQuadrants - quadrantsSummaryWidth},0)`)
                        .attr("opacity", shouldShowQuadrantsSummary ? 1 : 0);

                quadrantsSummaryG.selectAll("text")
                    .transition()
                    .duration(100)
                        .attr("font-size", scaleValue(9))
                        .attr("stroke-width", scaleValue(0.2))
                        .attr("stroke", summaryD => anotherChartIsSelected ? "grey" : (summaryD.value < 50 ? "red" : BLUE))
                        .attr("fill", summaryD => anotherChartIsSelected ? "grey" : (summaryD.value < 50 ? "red" : BLUE));
                    

                quadrantsSummaryG.selectAll(".quadrants-summary-outline")
                    .attr("stroke-width", scaleValue(0.1))

                chartG.select("rect.chart-hitbox")
                    .attr("display", barsAreClickable ? "none" : null);

                chartG.selectAll("rect.bars-area-bg")
                    .attr("stroke-width", scaleValue(anotherChartIsSelected ? 0.1 : 0.3))
                    .transition()
                    .duration(200)
                        .attr("stroke", anotherChartIsSelected ? GREY : BLUE)
                
                //add the extra gap between quadrants, and colour the bars correctly
                //note - the order of the nodes in this selectAll is not reliable, so we use d.i not i
                chartG.selectAll("g.quadrant-container")
                    .attr("transform", d => `translate(
                        ${(d.i === 0 || d.i === 2) ? 0 : quadrantWidth + zoomedGapBetweenQuadrants}, 
                        ${(d.i === 0 || d.i === 1) ? 0 : quadrantHeight + zoomedGapBetweenQuadrants})`)
                    .each(function(quadD,j){
                        const anotherQuadrantIsSelected = isNumber(selectedQuadrantIndex) && selectedQuadrantIndex !== quadD.i;
                        d3.select(this).selectAll("rect.bar")
                            .transition()
                            .duration(200)
                                .attr("fill", anotherQuadrantIsSelected || anotherChartIsSelected ? GREY : BLUE)
                    });

            })
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
    chart.selectedChartKey = function (value) {
        if (!arguments.length) { return selectedChartKey; }
        selectedChartKey = value;
        return chart;
    };
    chart.setSelectedChartKey = function (func) {
        if (!arguments.length) { return setSelectedChartKey; }
        setSelectedChartKey = func;
        return chart;
    };
    chart.zoomState = function (value, shouldUpdateDom) {
        if (!arguments.length) { return zoomState; }
        zoomState = value;

        if(shouldUpdateDom){ d3.selectAll(".chart").call(updateZoom) }
        return chart;
    };
    return chart;
};
