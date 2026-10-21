import { cp, mkdir, rm } from "node:fs/promises";
const out="dist/plugin-ui-csp-lab";await rm("dist",{recursive:true,force:true});await mkdir(`${out}/src`,{recursive:true});for(const file of ["index.html","styles.css","README.md","LICENSE","PRIVACY.md"]){await cp(file,`${out}/${file}`);}for(const file of ["src/app.mjs","src/core.mjs"]){await cp(file,`${out}/${file}`);}console.log(`Built ${out}`);
