// Verified public place names; only names, not real building geometry/addresses.
// Source dates and attribution: data-sources/city-places.txt.
const homes='https://gjj.beijing.gov.cn/web/zwgk61/xwdt/wxzjxxgs/436382927/2025111117134614748.pdf';
const retail='https://map.beijing.gov.cn/bjdxmap/category?categoryId=dxlsbld';
const wangfujing='https://www.bjdch.gov.cn/ywdt/xdcb/202505/P020250527419006839241.pdf';
export const CITY_PLACE_SNAPSHOTS={
 '北京市|北京市':{city:'北京市|北京市',saved:1792598400000,source:'北京市公开资料',verified:'2026-10-22',lists:{
  residence:['远洋山水','国美第一城（国美家园）','龙锦苑东区','芍药居北里','常青藤嘉园','太阳宫金星园','西二旗燕尚园','天赐良园','怡海花园'].map(name=>({name,url:homes})),
  market:[{name:'物美超市（新街口店）',url:'https://www.bjxch.gov.cn/xcdt/xxxq/pnidpv987546.html'}],
  store:[{name:'便利蜂（瑞海二区店）',url:retail}],
  mall:[{name:'北京市百货大楼',url:wangfujing}],
  shopping:[{name:'北京apm',url:wangfujing}]
 }}
};
