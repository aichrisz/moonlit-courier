'use strict';
const {build}=require('./public.cjs');
console.log(`Built ${build()} allowlisted runtime files in dist/.`);
