import test from 'node:test';import assert from 'node:assert/strict';
import {createWallet,advanceClock,clockText,wagesDue,CRIME_MAX} from '../lib/city-life.mjs';
import {rampsAt,roadAt,commuterRoute,advanceRoute} from '../lib/city-roads.mjs';
import {flightPose} from '../lib/city-flight.mjs';
test('game time uses sixty real seconds per minute and sixty minutes per hour',()=>{assert.equal(clockText(advanceClock(480,59)),'08:00:59');assert.equal(clockText(advanceClock(480,60)),'08:01:00');assert.equal(clockText(advanceClock(480,3600)),'09:00:00');assert.equal(clockText(advanceClock(1439,60)),'00:00:00');});
test('wages pay only completed five-second intervals and account for unpaid intervals',()=>{assert.equal(wagesDue(10,14.99),0);assert.equal(wagesDue(10,15),1);assert.equal(wagesDue(10,26,1),2);assert.equal(wagesDue(10,26,3),0);});
test('wallet begins at zero and bank transactions conserve money without overdrawing',()=>{const w=createWallet();assert.equal(w.balance,0);assert.equal(w.deposit(50),false);w.change(150);assert.equal(w.deposit(100),true);assert.equal(w.balance,50);assert.equal(w.deposits,100);assert.equal(w.withdraw(150),false);assert.equal(w.withdraw(50),true);assert.equal(w.balance+w.deposits,150);assert.equal(w.canPay(101),false);assert.equal(CRIME_MAX,10000000);});
test('toll approaches stay flat and both entry and exit ramps are continuous in every city',()=>{
 for(const o of [{x:0,z:0},{x:600,z:-1200}])for(const points of rampsAt(o)){
  assert.equal(roadAt(points[0]).height,0);assert.equal(roadAt(points[1]).height,0);
  let previous=0;for(let i=1;i<points.length;i++)for(let step=0;step<=100;step++){const t=step/100,a=points[i-1],b=points[i],q={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t},height=roadAt(q).height;assert(Math.abs(height-previous)<.15,JSON.stringify({q,height,previous}));previous=height;}
  assert.equal(previous,8);
 }
});
test('other vehicles use a ramp, travel to another city, and descend to its streets',()=>{
 for(const branch of [0,1]){const route=commuterRoute({x:0,z:0},branch);const car={g:{position:{...route[0]},rotation:{}},speed:25,route,routeIndex:1};let elevated=false,otherCity=false,returnedToStreet=false;
  for(let i=0;i<2500;i++){advanceRoute(car,.04);const p=car.g.position;elevated||=p.y===8;otherCity||=p.x>600||p.z>600;if(otherCity&&p.y===0)returnedToStreet=true;}
  assert(elevated);assert(otherCity);assert(returnedToStreet);
 }
});
test('cruise continues forward and landing follows the nose without reversing or teleporting',()=>{const a=flightPose(30,{id:'cruise',progress:0}),b=flightPose(60,{id:'cruise',progress:0});assert(b.z<a.z);let previous=b;for(let i=0;i<=100;i++){const p=flightPose(60,{id:'landing',progress:i/100},b);assert(p.z<=previous.z);assert(p.y<=previous.y+.001);assert(Math.abs(p.z-previous.z)<20);previous=p;}assert.equal(previous.y,0);assert(previous.z<b.z-800);});

test('the aircraft raises its nose during takeoff and flares before touchdown',()=>{assert(flightPose(20,{id:'takeoff',progress:.8}).pitch>0);assert(flightPose(24,{id:'climb',progress:.6}).pitch>0);assert(flightPose(50,{id:'landing',progress:.2}).pitch<0);assert(flightPose(50,{id:'landing',progress:.7}).pitch>0);});
