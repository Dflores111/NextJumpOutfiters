// Presentation-only interests use the existing general inquiry contract.
import {P, inquiry} from './routes.js';
export const interests = {
 'complete-build': {label:'A complete build',heading:"Tell us about the truck you want to build.",topic:'Something else'},
 'trip-care': {label:'Trip prep or vehicle care',heading:'What do you need help with before or after your trip?',topic:'Something else'},
 trips:{label:'Upcoming trips',heading:'Ask about upcoming trips.',topic:'Something else'},
 membership:{label:'Future memberships',heading:'Ask about future memberships.',topic:'Something else'},
 dealer:{label:'Dealer program',heading:'Ask about the dealer program.',topic:'Something else'},
 'paint-protection':{label:'Paint protection film',heading:'Protect the places your truck takes the most wear.',topic:'Installation or service'},
 'rhino-lining':{label:'Rhino lining',heading:'A tougher finish where you need it.',topic:'Installation or service'},
 recovery:{label:'Recovery & protection',heading:'Tell us about the upgrade you need.',topic:'Installation or service'},
};
export const interestInquiry = key => inquiry('general',{interest:key});
export const serviceCopy = {
 P16:['Lift and suspension installation, built around your truck.','A daily driver, a loaded work truck and a camper all need different things from their suspension. Tell us what you carry and where you drive.','Get a suspension quote','Ride, clearance and load support start with the right setup.'],
 P18:['Wheels and tires that fit how you use your truck.',"Tire size, clearance and load matter. We'll review your truck and the setup you're after before confirming the work.",'Get a wheel and tire quote','Work through size, clearance and how you actually drive.'],
 P20:['Better light for the trail, work and camp.',"From driving lights to camp lighting, we'll help plan placement, mounting, wiring and controls.",'Get a lighting quote','See the trail, your work area or camp with the right mounting and wiring.'],
 P17:['Bumpers and racks built around what you carry.','Add protection and carrying space without losing sight of clearance, mounting or the rest of your setup.','Get an installation quote','Make room for the gear you carry and protect the parts that matter.'],
 P19:['Power for the places you want to go.',"Let's work through charging, batteries, wiring and what needs to keep running when you're away from hookups.",'Talk about my power setup','Plan batteries, charging, outlets and off-grid power around your rig.'],
 P21:['A rooftop tent setup that fits your truck.',"We'll review the tent, rack, mounting and the way you want to use the space around it.",'Ask about tent installation','Get the camper or tent setup fitted to the truck you drive.'],
 P22:['Get the camper and truck working together.',"We'll look at the camper, truck, mounting and carrying setup before planning the installation.",'Discuss my camper setup','Plan the truck, mounting and camper together.'],
};
export const startingPaths=[
 {title:'Upgrade my truck',text:'Lifts, wheels, tires, lighting, bumpers, racks and more. Get the work you need without committing to a full build.',action:'See installation services',to:P.services,file:'flagship-dillon-f250.webp',alt:"Dillon's lifted green and white F-250, an actual customer project",imagePosition:'50% 64%'},
 {title:'Build a flatbed or camper',text:"Load from the side or rear without working around wheel wells. Start with an aluminum deck, then review storage or camper options for your truck.",action:'Explore flatbeds & campers',to:P.flatbeds,file:'flagship-ranger-flatbed.jpg',alt:'Ford Ranger photographed with a Next Jump flatbed',imagePosition:'50% 58%'},
 {title:'Plan a complete build',text:'Bring the truck you own or ask us to help find one. Build the full setup at once, or take it a piece at a time.',action:'Explore complete builds',to:P.complete,file:'ute-front.jpg',alt:'The completed Super Ute collaboration on a forest road, with flatbed, side storage and camp equipment',imagePosition:'50% 68%'},
];
