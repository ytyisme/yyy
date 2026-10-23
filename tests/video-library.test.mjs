import test from 'node:test';
import assert from 'node:assert/strict';
import {VIDEO_CATALOG,VIDEO_CATEGORIES,VIDEO_STORAGE_KEY,cleanMediaUrl,rememberRemoteVideo,attachCleanMedia,parseVideoLink,videoPageUrl,videoPlayerUrl,normalizeVideoLibrary,readVideoLibrary,writeVideoLibrary,videoList,filterVideos,toggleVideoFavorite,rememberVideo,addVideoLink,formatVideoDuration} from '../lib/video-library.mjs';

test('all three video sources use canonical IDs and clean originals allow only real media URLs',()=>{
  assert.deepEqual(parseVideoLink('https://www.douyin.com/video/7540207387488177458'),{id:'dy:7540207387488177458',page:1});
  assert.deepEqual(parseVideoLink('https://www.kuaishou.com/short-video/3xwn3kkerxj6g9n'),{id:'ks:3xwn3kkerxj6g9n',page:1});
  assert.equal(parseVideoLink('https://www.douyin.com.evil.test/video/7540207387488177458'),null);
  for(const url of ['javascript:alert(1)','https://localhost/a.mp4','https://127.0.0.1/a.mp4','https://example.com/a.html','assets/../secret.mp4'])assert.equal(cleanMediaUrl(url),null);
  assert.equal(cleanMediaUrl('https://media.example.com/a.mp4?token=x'),'https://media.example.com/a.mp4?token=x');
  let state=rememberRemoteVideo(null,{id:'dy:7540207387488177458',title:'公开作品',author:'创作者',page:1});state=attachCleanMedia(state,'dy:7540207387488177458','https://media.example.com/a.mp4');
  assert.equal(videoList(state)[0].mediaUrl,'https://media.example.com/a.mp4');assert.equal(videoList(state)[0].author,'创作者');
});
test('24 verified videos cover four channels and retain real authors, covers and part durations',()=>{
  assert.equal(VIDEO_CATALOG.length,24);assert.equal(new Set(VIDEO_CATALOG.map(v=>v.id)).size,24);
  for(const category of VIDEO_CATEGORIES.slice(1))assert.equal(VIDEO_CATALOG.filter(v=>v.category===category.id).length,6);
  for(const video of VIDEO_CATALOG){assert(video.title&&video.author);assert.equal(new URL(video.cover).protocol,'https:');assert.match(new URL(video.cover).hostname,/\.hdslb\.com$/);assert(video.parts.length>0);assert(video.duration===video.parts[0].duration);assert(videoPlayerUrl(video));}
});
test('BV, av, full video links and pasted share messages retain only an identifier and a valid part',()=>{
  assert.deepEqual(parseVideoLink(' BV1Q64y1z7se '),{id:'BV1Q64y1z7se',page:1});
  assert.deepEqual(parseVideoLink('av668580847'),{id:'av668580847',page:1});
  assert.deepEqual(parseVideoLink('【空间站】 https://www.bilibili.com/video/BV1MZ4y1F7Cq/?p=2&share_source=copy_web'),{id:'BV1MZ4y1F7Cq',page:2});
  assert.deepEqual(parseVideoLink('https://m.bilibili.com/video/av668580847?p=0'),{id:'av668580847',page:1});
  assert.equal(parseVideoLink('https://www.bilibili.com/video/BV1Q64y1z7se/?p=1001').page,1);
});
test('arbitrary hosts, nested URLs, credentials, scripts and malformed identifiers never become frame URLs',()=>{
  for(const input of ['javascript:alert(1)','https://evil.example/video/BV1Q64y1z7se','https://www.bilibili.com.evil.example/video/BV1Q64y1z7se','https://evil.example/?next=https://www.bilibili.com/video/BV1Q64y1z7se','https://evil@www.bilibili.com/video/BV1Q64y1z7se','https://www.bilibili.com:8080/video/BV1Q64y1z7se','https://b23.tv/abc123','BVfake','av0','<iframe src="evil">',null,'a'.repeat(2001)])assert.equal(parseVideoLink(input),null,input);
  assert.equal(videoPlayerUrl({id:'javascript:alert(1)'}),null);assert.equal(videoPageUrl({id:'not-a-video'}),null);
});
test('native playback requests stay on the game server and preserve the selected part',()=>{
  const video={id:'BV1Q64y1z7se',page:3},player=new URL(videoPlayerUrl(video),'https://game.example'),original=new URL(videoPageUrl(video));
  assert.equal(player.origin,'https://game.example');assert.equal(player.pathname,'/api/video/play');assert.equal(player.searchParams.get('id'),video.id);assert.equal(player.searchParams.get('page'),'3');assert.equal(original.searchParams.get('p'),'3');
  assert.equal(new URL(videoPlayerUrl({id:'dy:7540207387488177458'}),'https://game.example').searchParams.get('id'),'dy:7540207387488177458');
});
test('collections combine channel, Chinese/English search, creator names and recent ordering',()=>{
  assert.equal(filterVideos().length,24);assert.equal(filterVideos({category:'science',query:'星球'}).length,6);assert(filterVideos({query:'minecraft'}).length>=6);assert.equal(filterVideos({category:'music',query:'没有这个视频'}).length,0);
  const ids=VIDEO_CATALOG.slice(0,2).map(v=>v.id),library={favorites:ids,recent:[...ids].reverse()};
  assert.deepEqual(filterVideos({library,collection:'recent'}).map(v=>v.id),library.recent);assert.equal(filterVideos({library,collection:'favorites',category:'music'}).length,0);
});
test('favorites and recents persist without changing caller state or accepting unknown IDs',()=>{
  const first=VIDEO_CATALOG[0].id,second=VIDEO_CATALOG[1].id,initial=normalizeVideoLibrary(null),saved=toggleVideoFavorite(initial,first);
  assert.deepEqual(initial.favorites,[]);assert.deepEqual(saved.favorites,[first]);assert.deepEqual(toggleVideoFavorite(saved,first).favorites,[]);assert.deepEqual(toggleVideoFavorite(saved,'BV1xxxxxxxxx'),saved);
  const state=rememberVideo(rememberVideo(rememberVideo(saved,first),second),first);assert.deepEqual(state.recent,[first,second]);assert.deepEqual(state.favorites,[first]);
  const map=new Map(),storage={setItem:(key,value)=>map.set(key,value),getItem:key=>map.get(key)};
  assert(writeVideoLibrary(storage,state));assert(map.has(VIDEO_STORAGE_KEY));assert.deepEqual(readVideoLibrary(storage),state);assert(!writeVideoLibrary({setItem(){throw Error();}},state));assert.deepEqual(readVideoLibrary({getItem:()=>'{bad'}),initial);
});
test('custom links can be played, favorited, searched and restored, with bounded sanitized storage',()=>{
  const result=addVideoLink(null,'https://www.bilibili.com/video/BV1ciHD6TEqE/?p=2');assert(result);assert.equal(result.video.page,2);
  const state=toggleVideoFavorite(result.library,result.video.id);assert.equal(filterVideos({library:state,collection:'favorites'})[0].id,result.video.id);assert.equal(filterVideos({library:state,query:'BV1ciHD6TEqE'})[0].id,result.video.id);
  assert.equal(addVideoLink(state,'BV1ciHD6TEqE').library.custom.length,1);assert.equal(addVideoLink(state,VIDEO_CATALOG[0].id).library.custom.length,1);assert.equal(addVideoLink(state,'https://evil.example'),null);
  const cleaned=normalizeVideoLibrary({custom:[null,{id:'BV1ciHD6TEqE',page:Infinity,cover:'javascript:bad'},{id:'BV1ciHD6TEqE'},{}],favorites:[result.video.id,result.video.id,'BV1xxxxxxxxx'],recent:'bad'});assert.deepEqual(cleaned.custom,[{id:result.video.id,page:1}]);assert.deepEqual(cleaned.favorites,[result.video.id]);
  const many=Array.from({length:100},(_,i)=>({id:'av'+(i+1),page:i+1}));assert.equal(normalizeVideoLibrary({custom:many}).custom.length,30);assert.equal(videoList({custom:many}).length,54);
});
test('duration labels describe the selected first part, including hour long concerts',()=>{
  assert.equal(formatVideoDuration(67),'1:07');assert.equal(formatVideoDuration(3661),'1:01:01');assert.equal(formatVideoDuration(0),'视频');assert.equal(formatVideoDuration(NaN),'视频');
});
