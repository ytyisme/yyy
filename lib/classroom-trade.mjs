import {createSnacks} from './classroom-snacks.mjs?v=35-20261104b';
// Room host owns all inventories and commits only after both players confirm.
export function createTradeState(){return {players:{},offers:{}};}
const keys=['sticks','sips','candy'];
export function addPlayer(state,id,seat){if(state.players[id]||Object.keys(state.players).length>=6||Object.values(state.players).some(p=>p.seat===seat))return false;state.players[id]={seat,...createSnacks()};return true;}
export function propose(state,id,from,to,give,want,phase){if(phase!=='break'||state.offers[id]||from===to||!state.players[from]||!state.players[to]||!keys.includes(give)||!keys.includes(want))return false;state.offers[id]={from,to,give,want,accepted:false};return true;}
export function accept(state,id,actor,phase){const o=state.offers[id];if(!o||o.accepted||phase!=='break'||actor!==o.to)return false;const a=state.players[o.from],b=state.players[o.to];if(!a||!b||a[o.give]<1||b[o.want]<1)return false;a[o.give]--;b[o.give]++;b[o.want]--;a[o.want]++;o.accepted=true;return true;}
export function removePlayer(state,id){delete state.players[id];for(const [key,o] of Object.entries(state.offers))if(!o.accepted&&(o.from===id||o.to===id))delete state.offers[key];}
