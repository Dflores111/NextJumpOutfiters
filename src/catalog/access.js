// Role decisions stay on the server. The local pilot receives explicit local admin access.
const grants={admin:['catalog','inventory','purchasing','sales','audit'],catalog:['catalog'],inventory:['inventory'],sales:['sales']};
export const localIdentity={provider:'local',subject:'localhost',email:'Local staff workspace',roles:['admin'],local:true};
export function canStaff(identity,permission){return !!identity?.roles?.some(role=>grants[role]?.includes(permission));}
export function staffPermission(path,method){
 if(path==='/api/staff/session')return 'session';
 if(path==='/api/staff/source-imports'||path==='/api/staff/source-rows'||path==='/api/staff/package-imports'||path==='/api/staff/package-preview'||path.startsWith('/api/staff/packages')||path.startsWith('/api/staff/standards'))return 'catalog';
 if(path.startsWith('/api/staff/package-quotes'))return 'sales';
 if(path.startsWith('/api/staff/supply/'))return method==='GET'?'inventory':'purchasing';
 if(path==='/api/staff/options')return 'inventory';
 if(path==='/api/staff/barcodes'||path.startsWith('/api/staff/jobs'))return 'inventory';
 if(path.startsWith('/api/staff/purchases'))return method==='GET'||path.endsWith('/receive')?'inventory':'purchasing';
 if(path.startsWith('/api/staff/products')||path==='/api/staff/fitments')return 'catalog';
 if(path==='/api/staff/inventory'||path.startsWith('/api/staff/inventory/'))return 'inventory';
 if(path==='/api/staff/builds')return 'sales';
 if(path==='/api/staff/audit')return 'audit';
 return null;
}
export const staffActor=identity=>identity.local?'Local staff workspace':`${identity.email} [${identity.provider}:${identity.subject}]`;
