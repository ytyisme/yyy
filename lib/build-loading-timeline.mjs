// Visible animation time in milliseconds. The two plateaus are deliberate.
export const BUILD_LOADING_DURATION=4700;
export function buildLoadingProgress(time){
 const t=Math.max(0,Number(time)||0);
 if(t<1100)return {value:50*t/1100,phase:'running',done:false};
 if(t<1800)return {value:50,phase:'half',done:false};
 if(t<2900)return {value:50+42*(t-1800)/1100,phase:'running',done:false};
 if(t<3900)return {value:92,phase:'almost',done:false};
 if(t<4550)return {value:92+8*(t-3900)/650,phase:'finishing',done:false};
 return {value:100,phase:'ready',done:t>=BUILD_LOADING_DURATION};
}
