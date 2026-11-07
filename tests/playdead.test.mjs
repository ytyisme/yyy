import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isShotCommand} from '../lib/playdead.mjs';
test('recognizes spoken shot commands and ignores unrelated speech',()=>{for(const value of ['biu','BIU','啪！','pong','乓','砰'])assert.equal(isShotCommand(value),true,value);for(const value of ['你好','苹果','stop'])assert.equal(isShotCommand(value),false,value)});
