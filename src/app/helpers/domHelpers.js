import * as d3 from "d3";
import { isNumber } from './dataHelpers';

const TRANSITIONS = {
    FAST:50,
    MED:200,
    SLOW:500
}


export function fadeIn(selection, options={}){
    const { transition, cb=()=>{}, display=null, opacity=1 } = options;
    selection.each(function(){
        //will be multiple exits because of the delay in removing
        const sel = d3.select(this);
        const isFadingIn = sel.attr("class").includes("fading-in");
        const currOpacity = sel.attr("opacity") ? +sel.attr("opacity") : null;
        const currDisplay = sel.attr("display");
        const somethingMustChange = currOpacity !== opacity || currDisplay !== display;
        if(!isFadingIn && somethingMustChange){
            d3.select(this)
                .attr("opacity", d3.select(this).attr("opacity") || 0)
                //adjust display if required or if new value passed in
                .attr("display", currDisplay !== display ? display : currDisplay)
                .classed("fading-in", true)
                .transition("fade-in")
                    .delay(transition?.delay || 0)
                    .duration(isNumber(transition?.duration) ? transition.duration : TRANSITIONS.MED) //WAS CONTENT_FADE_DURATION FOR KPIS
                    .attr("opacity", opacity)
                    .on("end", function() { 
                        d3.select(this).classed("fading-in", false); 
                        cb.call(this);
                    });
        }
    })
}


export function fadeOut(selection, options={}){
    const { transition, cb=()=>{}, shouldRemove, display="none", opacity=0 } = options;
    selection.each(function(){
        //will be multiple exits because of the delay in removing
        const sel = d3.select(this);
        const isFadingOut = sel.attr("class").includes("fading-out");
        const currOpacity = sel.attr("opacity") ? +sel.attr("opacity") : null;
        const currDisplay = sel.attr("display");
        const somethingMustChange = currOpacity !== opacity || currDisplay !== display;
       
        if(!isFadingOut && somethingMustChange){
            d3.select(this)
                .attr("opacity", d3.select(this).attr("opacity") || 1)
                .classed("fading-out", true)
                .transition("fade-out")
                    .delay(transition?.delay || 0)
                    //.duration(transition?.duration || CONTENT_FADE_DURATION) - OLD, FOR KPIS
                    .duration(isNumber(transition?.duration) ? transition.duration : TRANSITIONS.MED)
                    .attr("opacity", opacity)
                    .on("end", function() { 
                        if(shouldRemove){ 
                            d3.select(this).remove(); 
                        }
                        else{
                            d3.select(this)
                                .attr("display", display)
                                .classed("fading-out", false); 
                        }
                        cb.call(this);
                    });
        }
    })
}

export function remove(selection, options={}){ 
    return fadeOut(selection, { ...options, shouldRemove:true })
}

