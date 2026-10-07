import {DatabaseSync} from 'node:sqlite';
import {mkdir,readFile,readdir} from 'node:fs/promises';
import path from 'node:path';

export function sqliteAdapter(database){
 const prepared=sql=>({bind(...values){return statement(sql,values)},...statement(sql,[])});
 function statement(sql,values){return {async first(){return database.prepare(sql).get(...values)||null},async all(){return {results:database.prepare(sql).all(...values)}},async run(){const result=database.prepare(sql).run(...values);return {meta:{changes:Number(result.changes)}}},_sql:sql,_values:values};}
 return {prepare:prepared,async batch(statements){database.exec('BEGIN IMMEDIATE');try{const results=[];for(const item of statements){const result=database.prepare(item._sql).run(...item._values);results.push({meta:{changes:Number(result.changes)}});}database.exec('COMMIT');return results;}catch(error){database.exec('ROLLBACK');throw error;}}};
}
export async function openLocalMaster(folder,root){
 await mkdir(folder,{recursive:true,mode:0o700});
 const database=new DatabaseSync(path.join(folder,'product-master.sqlite'));database.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
 // Development-only migration ledger. Hosted D1 migrations run at deployment.
 database.exec('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)');
 for(const name of (await readdir(path.join(root,'drizzle'))).filter(n=>n.endsWith('.sql')).sort()){
  if(database.prepare('SELECT name FROM local_migrations WHERE name=?').get(name))continue;
  const sql=await readFile(path.join(root,'drizzle',name),'utf8');database.exec('BEGIN');try{database.exec(sql);database.prepare('INSERT INTO local_migrations VALUES (?)').run(name);database.exec('COMMIT');}catch(error){database.exec('ROLLBACK');database.close();throw error;}
 }
 return {DB:sqliteAdapter(database),database,close:()=>database.close()};
}
