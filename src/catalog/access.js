// Role decisions stay on the server. The local pilot receives explicit local admin access.
const grants={admin:['catalog','inventory','sales','audit'],catalog:['catalog'],inventory:['inventory'],sales:['sales']};
export const localIdentity={provider:'local',subject:'localhost',email:'Local staff workspace',roles:['admin'],local:true};
export function canStaff(identity,permission){return !!identity?.roles?.some(role=>grants[role]?.includes(permission));}
export function staffPermission(path,method){
 if(path==='/api/staff/session')return 'session';
 if(path==='/api/staff/options')return 'inventory';
 if(path.startsWith('/api/staff/products')||path==='/api/staff/fitments')return 'catalog';
 if(path==='/api/staff/inventory')return 'inventory';
 if(path==='/api/staff/builds')return 'sales';
 if(path==='/api/staff/audit')return 'audit';
 return null;
}
export const staffActor=identity=>identity.local?'Local staff workspace':`${identity.email} [${identity.provider}:${identity.subject}]`;
