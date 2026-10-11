import test from 'node:test';import assert from 'node:assert/strict';
import {mediaPath,validateFile} from '../src/media.js';
import {socialBrand,socialIcon} from '../src/social-icons.js';
import {onRequestGet} from '../functions/media/[[path]].js';
test('Media paths, file signatures and module types are checked',async()=>{
 assert.equal(mediaPath('/media/../secret'),null);
 assert.equal((await validateFile(new File(['<html>bad</html>'],'fake.png',{type:'image/png'}),'identity')).error,'type');
 assert.equal((await validateFile(new File(['%PDF-1.7\n'],'catalogue.pdf'),'pdf_catalog')).ext,'pdf');
 assert.equal((await validateFile(new File(['%PDF-1.7\n'],'photo.jpg'),'gallery')).error,'type');
 const response=await onRequestGet({params:{path:['..','secret']}});assert.equal(response.status,404);
});
test('Social logos are inferred only from genuine brand domains',()=>{
 assert.equal(socialBrand('https://instagram.com.evil.invalid/'),undefined);
 assert.equal(socialBrand('https://www.instagram.com/example')[1],'Instagram');
 assert.match(socialIcon('https://linkedin.com/in/example').html,/<svg/);
 assert.equal(socialIcon('javascript:alert(1)'),null);
});
