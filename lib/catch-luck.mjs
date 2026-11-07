export const GOOD=['摸鱼成功','早点回家','工资翻倍'];
export const BAD=['给自己加作业','工作翻倍','洗澡停水'];
export function catchItem(state,good){return {good:state.good+(good?1:0),bad:state.bad+(good?0:1)};}
export function result(state){return state.bad>=3?'lost':state.good>=20?'won':null;}
