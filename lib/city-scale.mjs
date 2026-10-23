// Physical sizes remain metres. Only the old compact layout's horizontal
// addresses are spread into full blocks; vehicles and buildings are not scaled.
export const CITY_LAYOUT_SCALE=4;
export const CITY_RADIUS_METRES=1200;
export const CITY_HIGHWAY_AXIS=960;
export const CITY_PORTAL=1120;
export const WALK_SPEED=1.4;
export const CITY_CROSSINGS=[-176,0,176];
export function expandCityAddress(value){return value*CITY_LAYOUT_SCALE;}
export function cityMapScale(profile,pixels=210){return pixels/(2*(profile.radius??CITY_RADIUS_METRES));}
