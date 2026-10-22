import React,{useEffect,useRef} from 'react';
export default function UnsavedPackageDialog({onKeep,onDiscard}){
 const dialog=useRef();
 useEffect(()=>{const previous=document.activeElement;dialog.current.showModal();return()=>{previous?.focus?.();};},[]);
 return <dialog ref={dialog} className="unsaved-package-dialog" aria-labelledby="unsaved-package-title" onCancel={e=>{e.preventDefault();onKeep();}}><h2 id="unsaved-package-title">Keep your changes?</h2><p>This package has unsaved edits. Stay here to save them, or discard the edits and continue.</p><div><button type="button" autoFocus onClick={onKeep}>Keep editing</button><button type="button" onClick={onDiscard}>Discard & continue</button></div></dialog>;
}
