import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMParser} from '@xmldom/xmldom';
import {zipSync,strToU8} from 'fflate';
import {exportPackages,readWorkbook,importWorkbook,encodeWorkbook} from '../src/catalog/package-excel.js';
const part={productId:'11111111-1111-1111-1111-111111111111',title:'A & B <kit>',supplierSku:'01234',supplier:'Test',role:'Front kit',quantity:1,unitCostCents:null,unitRetailCents:10000};
const pack={id:'22222222-2222-2222-2222-222222222222',source_key:'test:package',title:'Test kit',category:'Suspension',revision:3,data:{vehicle:{make:'Toyota',model:'Tacoma',yearFrom:2016,yearTo:2023},useLevel:'weekender',description:'=HYPERLINK("evil")',fitmentNotes:'Test scope',installNotes:'Test install',defaultVariantId:'front-rear',lines:[part],labor:{hours:1.5,rateCents:17500,alignmentCents:0},variants:[{id:'front-only',label:'Front only',enabled:true,lines:[part],labor:{hours:1,rateCents:17500,alignmentCents:0}},{id:'front-rear',label:'Front & rear',enabled:true,lines:[{...part,quantity:2}],labor:{hours:1.5,rateCents:17500,alignmentCents:null}}]}};
test('Excel round trip retains identifiers, scopes, prices, unknowns, zeroes and literal formula-looking text',async()=>{
 const bytes=exportPackages([pack]),sheets=readWorkbook(bytes,DOMParser);assert.equal(sheets.Packages[1][11].value,pack.data.description);
 const b=await importWorkbook(bytes,'Export.xlsx',DOMParser),p=b.packages[0];assert.equal(p.id,pack.id);assert.equal(p.expectedRevision,3);assert.equal(p.data.variants.length,2);assert.equal(p.data.variants[0].labor.alignmentCents,0);assert.equal(p.data.variants[1].labor.alignmentCents,null);assert.equal(p.data.variants[0].lines[0].unitCostCents,null);assert.equal(p.data.variants[0].lines[0].sku,'01234');assert.equal(p.data.variants[0].lines[0].title,'A & B <kit>');
});
test('Excel reader rejects unsupported files, XML declarations and oversized input',()=>{
 assert.throws(()=>readWorkbook(new Uint8Array(5000001),DOMParser),/smaller/);assert.throws(()=>readWorkbook(zipSync({'xl/workbook.xml':strToU8('<!DOCTYPE x><workbook/>')}),DOMParser),/declarations/);assert.ok(readWorkbook(encodeWorkbook({Bad:[['data']]}),DOMParser).Bad);
});
test('unknown workbook layouts never silently map to existing package fields',async()=>{
 await assert.rejects(importWorkbook(encodeWorkbook({Random:[['Vehicle','Years'],['Tacoma','16-23']]}),'Unknown.xlsx',DOMParser),/No supported/);
 const headers=Array(45).fill('');headers[3]='Vehicle';headers[4]='Years';headers[7]='Cost';
 await assert.rejects(importWorkbook(encodeWorkbook({'Overlander (light)':[[],headers]}),'Moved.xlsx',DOMParser),/column changed/);
});

test('September light layout keeps quantity, cost, retail, labor and provenance separate; empty component rows are skipped',async()=>{
 const headers=Array(45).fill('');Object.assign(headers,{3:'Vehicle',4:'Years',7:'QTY',8:'Cost',9:'Retail',41:'Labor',43:"What's Included"});const row=Array(45).fill(null);Object.assign(row,{3:'Tacoma',4:'16-23',5:'Synthetic front kit',6:'TEST-47',7:1,8:733.35,9:953.36,41:6,42:1,43:'Synthetic install description'});const empty=Array(45).fill(null);Object.assign(empty,{3:'Tundra',4:'22-26'});
 const imported=await importWorkbook(encodeWorkbook({'Overlander (light)':[[],headers,row,empty]}),'Synthetic September.xlsx',DOMParser),p=imported.packages[0],line=p.data.variants[0].lines[0];assert.equal(imported.packages.length,1);assert.equal(imported.skippedRows.length,1);assert.equal(line.quantity,1);assert.equal(line.unitCostCents,73335);assert.equal(line.unitRetailCents,95336);assert.equal(p.data.variants[0].labor.hours,6);assert.equal(p.data.variants[0].labor.rustHours,1);assert.equal(p.data.variants[0].labor.alignmentCents,null);assert.equal(p.source.row,3);assert.equal(p.sourceCells.H.cell,'H3');assert.equal(p.data.useLevel,'overlander-light');
});
test('native workbook refuses inconsistent scope metadata and orphan parts',async()=>{
 let sheets=readWorkbook(exportPackages([pack]),DOMParser);const rows=Object.fromEntries(Object.entries(sheets).map(([name,records])=>[name,records.map(r=>r.map(c=>c?.value??null))]));rows.Packages[2][6]='Different truck';await assert.rejects(importWorkbook(encodeWorkbook(rows),'Conflict.xlsx',DOMParser),/shared package fields/);rows.Packages[2][6]=rows.Packages[1][6];rows.Parts[1][1]='missing-scope';await assert.rejects(importWorkbook(encodeWorkbook(rows),'Orphan.xlsx',DOMParser),/missing package or scope/);
});
