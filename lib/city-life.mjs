export const CRIME_MAX=10000000, WAGE=50, WORK_SECONDS=5;
export function advanceClock(minutes,seconds){return (minutes+Math.max(0,seconds)/60)%(24*60);}
export function clockText(minutes){const total=Math.floor(minutes*60+1e-6);return [Math.floor(total/3600)%24,Math.floor(total/60)%60,total%60].map(n=>String(n).padStart(2,'0')).join(':');}
export function wagesDue(start,now,paid=0){return Math.max(0,Math.floor((now-start+1e-6)/WORK_SECONDS)-paid);}
export function moneyText(amount){return amount===Infinity?'∞':amount.toLocaleString();}
export function createWallet(initial=0){const unlimited=initial===Infinity;let balance=unlimited?Infinity:Number.isFinite(initial)?initial:0,deposits=0;return {
 get balance(){return balance},get deposits(){return deposits},get unlimited(){return unlimited},
 canPay(amount){return Number.isFinite(amount)&&amount>=0&&(unlimited||balance>=amount)},
 change(amount){if(!Number.isFinite(amount))return false;if(!unlimited)balance+=amount;return true},
 deposit(amount){if(!this.canPay(amount)||amount<=0)return false;if(!unlimited)balance-=amount;deposits+=amount;return true},
 withdraw(amount){if(!Number.isFinite(amount)||amount<=0||deposits<amount)return false;deposits-=amount;if(!unlimited)balance+=amount;return true}
};}
